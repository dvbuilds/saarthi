import { Worker } from "bullmq";
import Groq from "groq-sdk";
import { redisConnection } from "../config/redisConnection.js";
import { Document } from "../models/Document.js";
import { GenerationJob } from "../models/GenerationJob.js";
import { DeadLetterJob } from "../models/DeadLetterJob.js";
import { extractPdfText } from "../services/extractPdfText.js";
import { generateSectionTitles } from "../services/generateActionTitle.js";
import { callGroqWithBreaker } from "../services/groqCircuitBreaker.js";
import { setCachedResult } from "../services/aiOutputCache.js";
import { publishGenerationEvent } from "../services/generationEvents.js";
import { computeSelectionSignature } from "../utils/computeSelectionSignature.js";
import { chunkPages, CHUNK_SIZE } from "../utils/chunking.js";
import { logger } from "../utils/logger.js";
import { generationJobsTotal, generationJobDuration } from "../utils/metrics.js";
import { StreamingArrayParser } from "../utils/streamingJsonArrayParser.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Per-page character caps applied when building a chunk's prompt context.
// Quiz/flashcards only need a taste of each page to write questions, so
// they stay tight. Summary/notes need more of the actual prose to
// synthesize well, but were previously UNBOUNDED (raw p.content, no
// slice) — a single unusually dense or OCR-garbled page could blow a
// chunk's token budget well past what 5 "normal" pages would use. Capping
// per page (rather than per chunk) keeps every chunk's worst case
// predictable regardless of what's actually in the PDF.
const SHORT_FORM_CHARS_PER_PAGE = 800;   // quiz, flashcards
const LONG_FORM_CHARS_PER_PAGE = 3000;   // summary, notes

// Maps an internal error into a short, user-safe category. The raw error
// (with full message/stack) still goes to the structured logger and the
// dead-letter record below — this is only what reaches the frontend via
// GenerationJob.error, so a user never sees a stack trace or a raw
// "Cannot read properties of undefined" style message.
const toUserFacingError = (error) => {
    if (error?.isCircuitBreakerOpen) {
        return "The AI service is temporarily unavailable. Please try again in a minute.";
    }
    if (error?.message === "Document not found") {
        return "This document could not be found.";
    }
    if (error?.message === "No valid sections selected") {
        return "No valid sections were selected. Please pick at least one section and try again.";
    }
    return "Generation failed after several attempts. Please try again.";
};

const buildPrompt = (type, pdfContext, questionsPerChunk, contentType) => {
    switch (type) {
        case "quiz":
            return `You are a quiz generator. Based on the excerpt below, generate exactly ${questionsPerChunk} multiple choice questions.

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Include a brief explanation for why the answer is correct
- Cover different topics across the document

Respond ONLY with a valid JSON array, no markdown, no extra text:
[
  {
    "question": "Question text here?",
    "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
    "answer": "A",
    "explanation": "Brief explanation why A is correct"
  }
]

DOCUMENT EXCERPT:
${pdfContext}`;

        case "flashcards":
            return `You are a flashcard generator. Based on the document excerpt below, generate 3 flashcards covering key concepts.

Respond ONLY with a valid JSON array, no markdown, no extra text:
[
  {
    "front": "Question or concept here?",
    "back": "Answer or explanation here"
  }
]

DOCUMENT EXCERPT:
${pdfContext}`;

        case "summary":
            return `You are a document summarizer. Extract key points from the excerpt below.

STRICT RULES:
- Each point must be a complete informative sentence with actual content
- Do NOT include headings, titles, or topic names as points
- Each point must explain something, not just name something
- Minimum 10 words per point

Respond ONLY with a valid JSON array of strings, no markdown, no extra text:
["Point 1 as a complete sentence.", "Point 2 as a complete sentence."]

DOCUMENT EXCERPT:
${pdfContext}`;

        case "notes":
            // "structured" excerpts are already close to note form (short
            // bullets/lines, minimal prose) — running the full synthesis
            // prompt on these just reformats what's already there ("notes
            // of notes"). Use a lighter grouping pass instead. "dense"
            // excerpts get the original full-synthesis treatment.
            if (contentType === "structured") {
                return `The excerpt below is already presented as short points, bullets, or brief definitions — it does not need heavy rewriting. Your job is only to GROUP related points under sensible topic headings and remove exact duplicates. Do not invent new explanations or pad points with extra words that aren't supported by the excerpt.

STRICT RULES:
- Respond ONLY with a valid JSON array, no markdown, no extra text
- Each object must have a "topic" and "points" array
- Reuse the excerpt's own wording where possible — light cleanup only, not rewriting
- Merge near-duplicate points into one instead of listing both
- Do NOT include vague headings or empty topics

Respond in this exact format:
[
  {
    "topic": "Topic Name",
    "points": ["Point 1.", "Point 2."]
  }
]

DOCUMENT EXCERPT:
${pdfContext}`;
            }

            return `You are a study notes generator. Convert the document excerpt below into structured study notes.

STRICT RULES:
- Respond ONLY with a valid JSON array, no markdown, no extra text
- Each object must have a "topic" and "points" array
- Each point must be a complete informative sentence
- Do NOT include vague headings or empty topics

Respond in this exact format:
[
  {
    "topic": "Topic Name",
    "points": ["Point 1 as a complete sentence.", "Point 2 as a complete sentence."]
  }
]

DOCUMENT EXCERPT:
${pdfContext}`;

        default:
            throw new Error(`Unknown generation type: ${type}`);
    }
};

export const startWorkers = () => {
    // ---------- PDF extraction worker ----------
    const documentWorker = new Worker(
        "document-processing",
        async (job) => {
            const { documentId, fileUrl } = job.data;
            logger.info({ documentId }, "Extracting text for document");

            try {
                const pages = await extractPdfText(fileUrl);

                // Generate section titles once, right after extraction.
                // Cached on the document — reused by every future
                // quiz/flashcards/notes/summary generation for this PDF.
                logger.info({ documentId }, "Generating section titles for document");
                const sections = await generateSectionTitles(pages, CHUNK_SIZE);

                await Document.findByIdAndUpdate(documentId, {
                    extractedText: pages,
                    sections,
                    status: "ready",
                });
                logger.info({ documentId, sectionCount: sections.length }, "Document is ready");
            } catch (error) {
                const attemptsMade = job.attemptsMade + 1;
                const maxAttempts = job.opts.attempts || 1;
                const isFinalAttempt = attemptsMade >= maxAttempts;

                logger.error({ documentId, attemptsMade, maxAttempts, err: error }, "Extraction failed");

                // Only mark the document "failed" once retries are
                // exhausted — otherwise a transient failure on attempt 1
                // of 3 would show the user a permanent failure even
                // though BullMQ is about to retry and may well succeed.
                if (isFinalAttempt) {
                    await Document.findByIdAndUpdate(documentId, { status: "failed" });
                }
                throw error;
            }
        },
        { connection: redisConnection, concurrency: 2 }
    );

    documentWorker.on("failed", (job, err) => {
        logger.error({ jobId: job.id, err }, "Extraction job failed");
    });

    // ---------- AI generation worker ----------
    const generationWorker = new Worker(
        "ai-generation",
        async (job) => {
            const { jobRecordId, documentId, type, count, selectedChunkIndexes } = job.data;

            const jobRecord = await GenerationJob.findById(jobRecordId).select("status");
            if (!jobRecord || jobRecord.status === "cancelled") {
                logger.info({ jobRecordId }, "Job was cancelled before processing started — skipping");
                generationJobsTotal.labels(type, "cancelled").inc();
                return;
            }

            await GenerationJob.findByIdAndUpdate(jobRecordId, { status: "processing" });

            try {
                const document = await Document.findById(documentId);
                if (!document) throw new Error("Document not found");

                const allPages = [...document.extractedText].sort((a, b) => a.pageNumber - b.pageNumber);

                const allChunks = chunkPages(allPages, CHUNK_SIZE);

                // If the user picked specific sections, only process those
                // chunks. If nothing was passed (or it's empty), fall back
                // to generating from the whole document — keeps this
                // backward-compatible with any existing "generate all" flow.
                // Each chunk keeps its original chunkIndex through this
                // filter so it can still be matched back to its
                // document.sections entry (for contentType, used by notes).
                const chunks = (Array.isArray(selectedChunkIndexes) && selectedChunkIndexes.length > 0)
                    ? selectedChunkIndexes
                        .filter(i => i >= 0 && i < allChunks.length)
                        .sort((a, b) => a - b)
                        .map(i => allChunks[i])
                    : allChunks;

                if (chunks.length === 0) {
                    throw new Error("No valid sections selected");
                }

                await GenerationJob.findByIdAndUpdate(jobRecordId, {
                    totalChunks: chunks.length,
                    completedChunks: 0,
                });

                const questionsPerChunk = type === "quiz"
                    ? Math.max(1, Math.ceil((count || 10) / chunks.length))
                    : null;

                const batchSize = 3;
                let allResults = [];
                let chunksDone = 0;

                for (let i = 0; i < chunks.length; i += batchSize) {
                    // Cheap check before spending AI calls on the next batch.
                    // A user who hit Cancel mid-generation shouldn't keep
                    // burning Groq requests for chunks nobody will ever see.
                    const liveJob = await GenerationJob.findById(jobRecordId).select("status");
                    if (liveJob?.status === "cancelled") {
                        logger.info({ jobRecordId, chunksDone, totalChunks: chunks.length }, "Job cancelled mid-generation — stopping");
                        generationJobsTotal.labels(type, "cancelled").inc();
                        publishGenerationEvent(jobRecordId, { type: "cancelled" });
                        return;
                    }

                    const batch = chunks.slice(i, i + batchSize);

                    const batchResults = await Promise.all(
                        batch.map(async (chunk) => {
                            const isShortForm = type === "quiz" || type === "flashcards";
                            const perPageCap = isShortForm ? SHORT_FORM_CHARS_PER_PAGE : LONG_FORM_CHARS_PER_PAGE;
                            const pdfContext = chunk.pages
                                .map(p => `[Page ${p.pageNumber}]\n${p.content.slice(0, perPageCap)}`)
                                .join("\n\n");

                            const contentType = type === "notes"
                                ? (document.sections?.[chunk.chunkIndex]?.contentType || "dense")
                                : null;

                            const prompt = buildPrompt(type, pdfContext, questionsPerChunk, contentType);

                            // Collected as items complete, not just at the end — each
                            // item is also published live over Redis the instant the
                            // streaming parser closes it, so the frontend can render
                            // it (one card/question/point/topic at a time) while the
                            // model is still generating the rest. Quiz answers are
                            // NOT stripped here — that stays the job of the API layer
                            // (see sanitizeGenerationResult.js), same boundary as the
                            // existing poll endpoint.
                            const items = [];
                            let parser;

                            try {
                                parser = new StreamingArrayParser((item) => {
                                    items.push(item);
                                    publishGenerationEvent(jobRecordId, { type: "item", item });
                                });

                                await callGroqWithBreaker(async () => {
                                    const stream = await groq.chat.completions.create({
                                        model: "llama-3.1-8b-instant",
                                        messages: [{ role: "user", content: prompt }],
                                        max_tokens: 1024,
                                        stream: true,
                                    });

                                    for await (const part of stream) {
                                        const delta = part.choices?.[0]?.delta?.content;
                                        if (delta) parser.push(delta);
                                    }
                                });

                                // The incremental parser only fires for items whose
                                // closing bracket/quote actually arrived. If nothing
                                // came through it (model wrapped the array in a way
                                // the parser didn't expect), fall back to parsing
                                // everything it buffered in one go — mirrors the old
                                // non-streaming behavior instead of losing the chunk.
                                if (items.length === 0 && parser.getBuffer().trim()) {
                                    const clean = parser.getBuffer().replace(/```json|```/g, "").trim();
                                    const parsed = JSON.parse(clean);
                                    if (Array.isArray(parsed)) {
                                        parsed.forEach((item) => {
                                            items.push(item);
                                            publishGenerationEvent(jobRecordId, { type: "item", item });
                                        });
                                    }
                                }
                            } catch (chunkError) {
                                // A genuinely open circuit (sustained Groq
                                // outage) aborts the whole job — retrying
                                // every remaining chunk against a known-dead
                                // API just wastes time and produces a job
                                // full of empty results.
                                if (chunkError.isCircuitBreakerOpen) {
                                    throw chunkError;
                                }
                                // Any other failure (mid-stream network drop,
                                // unparsable fallback JSON, etc.) keeps
                                // whatever items were already streamed and
                                // published rather than discarding them —
                                // the client already saw them appear, so the
                                // stored/final result should agree.
                            }

                            return items;
                        })
                    );

                    batchResults.forEach(r => allResults.push(...r));
                    chunksDone += batch.length;

                    if (type !== "quiz") {
                        await GenerationJob.findByIdAndUpdate(jobRecordId, {
                            result: allResults,
                            completedChunks: Math.min(chunksDone, chunks.length),
                        });
                    } else {
                        await GenerationJob.findByIdAndUpdate(jobRecordId, {
                            completedChunks: Math.min(chunksDone, chunks.length),
                        });
                    }

                    publishGenerationEvent(jobRecordId, {
                        type: "progress",
                        completedChunks: Math.min(chunksDone, chunks.length),
                        totalChunks: chunks.length,
                    });

                    if (i + batchSize < chunks.length) {
                        await new Promise(resolve => setTimeout(resolve, 1200));
                    }
                }

                if (type === "quiz") {
                    // Live "item" events were published in raw generation order as
                    // each question streamed in — this shuffle+trim only affects
                    // the authoritative final result. The frontend replaces its
                    // streamed-in list with this "done" payload once it arrives,
                    // exactly like it already does for the poll-based result.
                    allResults = allResults.sort(() => Math.random() - 0.5).slice(0, count || 10);
                }

                await GenerationJob.findByIdAndUpdate(jobRecordId, {
                    status: "completed",
                    result: allResults,
                    completedChunks: chunks.length,
                });

                // Cache by content hash, not documentId — so a different
                // user uploading the exact same PDF gets an instant result
                // instead of paying for regeneration. See aiOutputCache.js.
                const selectionSignature = computeSelectionSignature(selectedChunkIndexes);
                await setCachedResult(document.fileHash, type, selectionSignature, count, allResults);

                publishGenerationEvent(jobRecordId, { type: "done", result: allResults });

                logger.info({ jobRecordId, type }, "Generation job completed");
                generationJobsTotal.labels(type, "completed").inc();
                generationJobDuration.labels(type).observe((Date.now() - job.timestamp) / 1000);
            } catch (error) {
                const attemptsMade = job.attemptsMade + 1; // this attempt, about to complete
                const maxAttempts = job.opts.attempts || 1;
                const isFinalAttempt = attemptsMade >= maxAttempts;

                logger.error({ jobRecordId, attemptsMade, maxAttempts, err: error }, "Generation job failed");

                if (isFinalAttempt) {
                    generationJobsTotal.labels(type, "failed").inc();

                    const userFacingError = toUserFacingError(error);

                    await GenerationJob.findByIdAndUpdate(jobRecordId, {
                        status: "failed",
                        error: userFacingError,
                    });

                    publishGenerationEvent(jobRecordId, { type: "error", message: userFacingError });

                    try {
                        await DeadLetterJob.create({
                            jobRecordId,
                            documentId,
                            type,
                            error: error.message,
                            attemptsMade,
                        });
                    } catch (dlqError) {
                        logger.error({ jobRecordId, err: dlqError }, "Failed to write dead-letter record");
                    }
                }
                // If this isn't the final attempt, deliberately leave the
                // GenerationJob status as "processing" — BullMQ will retry
                // with exponential backoff, and the frontend keeps polling
                // (a false "failed" here would stop the poll loop before
                // the retry even had a chance to run).

                throw error; // let BullMQ handle the retry/backoff scheduling
            }
        },
        { connection: redisConnection, concurrency: 2 }
    );

    generationWorker.on("failed", (job, err) => {
        logger.error({ jobId: job.id, err }, "Generation job failed (BullMQ-level)");
    });

    logger.info("Background workers started — listening for jobs...");
};