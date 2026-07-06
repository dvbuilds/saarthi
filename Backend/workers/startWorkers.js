import { Worker } from "bullmq";
import Groq from "groq-sdk";
import { redisConnection } from "../config/redisConnection.js";
import { Document } from "../models/Document.js";
import { GenerationJob } from "../models/GenerationJob.js";
import { extractPdfText } from "../services/extractPdfText.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const buildPrompt = (type, pdfContext, questionsPerChunk) => {
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
            console.log(`[worker] Extracting text for document ${documentId}`);

            try {
                const pages = await extractPdfText(fileUrl);
                await Document.findByIdAndUpdate(documentId, {
                    extractedText: pages,
                    status: "ready",
                });
                console.log(`[worker] Document ${documentId} is ready`);
            } catch (error) {
                console.error(`[worker] Extraction failed for ${documentId}:`, error);
                await Document.findByIdAndUpdate(documentId, { status: "failed" });
                throw error;
            }
        },
        { connection: redisConnection, concurrency: 2 }
    );

    documentWorker.on("failed", (job, err) => {
        console.error(`[worker] Extraction job ${job.id} failed:`, err.message);
    });

    // ---------- AI generation worker ----------
    const generationWorker = new Worker(
        "ai-generation",
        async (job) => {
            const { jobRecordId, documentId, type, count } = job.data;

            await GenerationJob.findByIdAndUpdate(jobRecordId, { status: "processing" });

            try {
                const document = await Document.findById(documentId);
                if (!document) throw new Error("Document not found");

                const allPages = [...document.extractedText].sort((a, b) => a.pageNumber - b.pageNumber);

                const chunkSize = (type === "summary" || type === "notes") ? 2 : 5;
                const chunks = [];
                for (let i = 0; i < allPages.length; i += chunkSize) {
                    chunks.push(allPages.slice(i, i + chunkSize));
                }

                // NEW: record total chunk count upfront so the frontend can show "3 of 7" progress
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
                    const batch = chunks.slice(i, i + batchSize);

                    const batchResults = await Promise.all(
                        batch.map(async (chunk) => {
                            const isShortForm = type === "quiz" || type === "flashcards";
                            const pdfContext = chunk
                                .map(p => `[Page ${p.pageNumber}]\n${isShortForm ? p.content.slice(0, 800) : p.content}`)
                                .join("\n\n");

                            const prompt = buildPrompt(type, pdfContext, questionsPerChunk);

                            try {
                                const completion = await groq.chat.completions.create({
                                    model: "llama-3.1-8b-instant",
                                    messages: [{ role: "user", content: prompt }],
                                    max_tokens: 1024,
                                });

                                const raw = completion.choices[0].message.content;
                                const clean = raw.replace(/```json|```/g, "").trim();
                                return JSON.parse(clean);
                            } catch {
                                return [];
                            }
                        })
                    );

                    batchResults.forEach(r => allResults.push(...r));
                    chunksDone += batch.length;

                    // NEW: push partial results after every batch, not just at the end.
                    // Skip this for "quiz" — it gets shuffled/sliced only at the very end,
                    // so streaming mid-job would show an incomplete/misleading question set.
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

                    if (i + batchSize < chunks.length) {
                        await new Promise(resolve => setTimeout(resolve, 1200));
                    }
                }

                if (type === "quiz") {
                    allResults = allResults.sort(() => Math.random() - 0.5).slice(0, count || 10);
                }

                await GenerationJob.findByIdAndUpdate(jobRecordId, {
                    status: "completed",
                    result: allResults,
                    completedChunks: chunks.length,
                });

                console.log(`[worker] Generation job ${jobRecordId} (${type}) completed`);
            } catch (error) {
                console.error(`[worker] Generation job ${jobRecordId} failed:`, error);
                await GenerationJob.findByIdAndUpdate(jobRecordId, {
                    status: "failed",
                    error: error.message,
                });
                throw error;
            }
        },
        { connection: redisConnection, concurrency: 2 }
    );

    generationWorker.on("failed", (job, err) => {
        console.error(`[worker] Generation job ${job.id} failed:`, err.message);
    });

    console.log("[worker] Background workers started — listening for jobs...");
};