import Groq from "groq-sdk";
import { logger } from "../utils/logger.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// One AI call handles this many sections' worth of titles at once. Each
// section costs roughly 30-40 response tokens (title + contentType +
// JSON punctuation), so 40 sections keeps a batch comfortably inside the
// max_tokens budget below with room to spare. Below this size, a document
// still gets exactly one AI call — same as before.
const TITLES_PER_BATCH = 40;
const MAX_TOKENS_PER_BATCH = 2048;

const buildTitlesPrompt = (chunks) => {
    const excerpts = chunks.map((chunk, i) => {
        const text = chunk.map(p => p.content).join(" ").slice(0, 300);
        return `SECTION ${i + 1} (pages ${chunk[0].pageNumber}-${chunk[chunk.length - 1].pageNumber}):\n${text}`;
    }).join("\n\n---\n\n");

    return `You are analyzing sections of a textbook/document for a study app. Below are ${chunks.length} excerpts, each from a different section.

For EACH section, provide:
1. "title": a short, specific title (3-8 words) describing what it actually covers. Do not use generic labels like "Section 1" or "Introduction" unless that's genuinely what it is.
2. "contentType": either "dense" or "structured".
   - Use "dense" if the excerpt is written as flowing prose/paragraphs that would benefit from being condensed into notes.
   - Use "structured" ONLY if the excerpt is already presented as short bullet points, a list, table-like data, or brief one-line definitions/headings with little connective prose — i.e. it's already close to note form and doesn't need heavy synthesis.

Respond ONLY with a valid JSON array, in the same order as the sections, no markdown, no extra text:
[
  { "title": "Title for section 1", "contentType": "dense" },
  { "title": "Title for section 2", "contentType": "structured" }
]

${excerpts}`;
};

/**
 * Classifies one batch of chunks via a single AI call. Returns an array
 * the same length as `chunks`, falling back to generic labels for that
 * batch alone if the call or parse fails — a failure in one batch never
 * affects titles already generated for other batches.
 */
const classifyBatch = async (chunks) => {
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: buildTitlesPrompt(chunks) }],
            max_tokens: MAX_TOKENS_PER_BATCH,
        });

        const raw = completion.choices[0].message.content;
        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);

        if (!Array.isArray(parsed) || parsed.length !== chunks.length) {
            throw new Error("Section metadata count mismatch");
        }
        return parsed;
    } catch (error) {
        logger.warn({ err: error, batchSize: chunks.length }, "[generateSectionTitles] AI classification failed for a batch, falling back to generic labels");
        return chunks.map((_, i) => ({ title: `Section ${i + 1}`, contentType: "dense" }));
    }
};

/**
 * Given the full array of page objects [{ pageNumber, content }, ...] and a
 * chunkSize (pages per section), returns an array of section metadata.
 * Large documents are classified in batches (one AI call per batch of up
 * to TITLES_PER_BATCH sections) instead of one unbounded call, so the
 * response never risks being truncated by max_tokens regardless of
 * document length.
 *
 * Each section gets both a title AND a contentType classification:
 * - "dense": prose that needs real synthesis (paragraphs, explanations, proofs)
 * - "structured": already presented as short bullets/lines/headings with
 *   little to condense — used downstream by the notes generator to avoid
 *   just reformatting content that's already note-like ("notes of notes").
 *
 * Returns: [{ index, title, contentType, pageStart, pageEnd }, ...]
 */
export const generateSectionTitles = async (allPages, chunkSize = 5) => {
    const sortedPages = [...allPages].sort((a, b) => a.pageNumber - b.pageNumber);

    const chunks = [];
    for (let i = 0; i < sortedPages.length; i += chunkSize) {
        chunks.push(sortedPages.slice(i, i + chunkSize));
    }

    if (chunks.length === 0) return [];

    const batches = [];
    for (let i = 0; i < chunks.length; i += TITLES_PER_BATCH) {
        batches.push(chunks.slice(i, i + TITLES_PER_BATCH));
    }

    logger.info({ sectionCount: chunks.length, batchCount: batches.length }, "[generateSectionTitles] Classifying sections");

    const batchResults = await Promise.all(batches.map(classifyBatch));
    const parsed = batchResults.flat();

    return chunks.map((chunk, i) => ({
        index: i,
        title: parsed[i]?.title || `Section ${i + 1}`,
        contentType: parsed[i]?.contentType === "structured" ? "structured" : "dense",
        pageStart: chunk[0].pageNumber,
        pageEnd: chunk[chunk.length - 1].pageNumber,
    }));
};
