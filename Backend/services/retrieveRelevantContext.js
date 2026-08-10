import { chunkPages, CHUNK_SIZE } from "../utils/chunking.js";
import { rankChunksByRelevance } from "./localEmbeddings.js";

// Roughly 4 chars/token for English text. Groq's llama-3.1-8b-instant has
// a 128k-token context window, but staying well under it keeps us clear of
// per-request TPM (tokens-per-minute) rate limits and leaves headroom for
// the system prompt, chat history, and the response itself. This is the
// actual bottleneck this module exists to fix: chatController used to
// concatenate every extracted page into one prompt, so a 300-page PDF
// could easily be 150,000+ tokens of PDF content alone — well past both
// the context window and any realistic TPM budget.
const CONTEXT_CHAR_BUDGET = 14000;

// Below this, the whole document already fits comfortably in the budget —
// skip retrieval entirely and send everything, same as the original
// behavior. Preserves existing quality/behavior for small PDFs.
const SMALL_DOC_CHAR_THRESHOLD = CONTEXT_CHAR_BUDGET;

const formatChunk = (chunk) => {
    return chunk.pages
        .map((p) => `[Page ${p.pageNumber}]\n${p.content}`)
        .join("\n\n");
};

/**
 * Builds the PDF context to hand to the AI for a chat message.
 *
 * - Small documents: full text, unchanged from the original implementation.
 * - Large documents: only the most relevant chunks (by local TF-IDF
 *   cosine similarity to the user's question, reusing chat history for
 *   extra query signal) are included, capped to a fixed character budget
 *   regardless of total document size — so page count stops being a
 *   context-limit bottleneck.
 *
 * Returns { context, usedRetrieval, chunksUsed, totalChunks }.
 */
export const buildChatContext = (document, message, history = []) => {
    const sortedPages = [...document.extractedText].sort((a, b) => a.pageNumber - b.pageNumber);
    const fullText = sortedPages.map((p) => `[Page ${p.pageNumber}]\n${p.content}`).join("\n\n");

    if (fullText.length <= SMALL_DOC_CHAR_THRESHOLD) {
        return {
            context: fullText,
            usedRetrieval: false,
            chunksUsed: sortedPages.length ? 1 : 0,
            totalChunks: 1,
        };
    }

    const chunks = chunkPages(sortedPages, CHUNK_SIZE).map((chunk) => ({
        ...chunk,
        text: formatChunk(chunk),
    }));

    // Recent user turns carry the topic the user keeps circling back to
    // (e.g. a short follow-up like "what about the second one?" has almost
    // no retrieval signal on its own) — folding the last couple of user
    // messages into the query improves relevance for follow-up questions.
    const recentUserTurns = history
        .filter((h) => h.role === "user")
        .slice(-2)
        .map((h) => h.content)
        .join(" ");
    const query = `${recentUserTurns} ${message}`.trim();

    const ranked = rankChunksByRelevance(chunks, query);

    const selected = [];
    let usedChars = 0;
    for (const chunk of ranked) {
        if (usedChars >= CONTEXT_CHAR_BUDGET) break;
        // Always take at least one chunk even if it blows the budget
        // slightly — better than an empty context.
        selected.push(chunk);
        usedChars += chunk.text.length;
    }

    // Present selected chunks back in document order (page order), not
    // relevance order — reads more naturally and keeps page-number
    // references coherent for the model.
    selected.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const context = selected.map((c) => c.text).join("\n\n");

    return {
        context,
        usedRetrieval: true,
        chunksUsed: selected.length,
        totalChunks: chunks.length,
    };
};
