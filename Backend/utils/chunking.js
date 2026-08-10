// Single source of truth for how a document's pages are grouped into
// "chunks" (sections). Used by:
//  - services/generateActionTitle.js (section titles at extraction time)
//  - workers/startWorkers.js (quiz/flashcards/summary/notes generation)
//  - services/retrieveRelevantContext.js (chat retrieval)
// Keeping one definition means "section 12" always refers to the same
// page range everywhere in the app.
export const CHUNK_SIZE = 5; // pages per chunk

/**
 * Groups sorted pages into fixed-size chunks.
 * Returns [{ chunkIndex, pages: [{pageNumber, content}, ...] }, ...]
 */
export const chunkPages = (sortedPages, chunkSize = CHUNK_SIZE) => {
    const chunks = [];
    for (let i = 0; i < sortedPages.length; i += chunkSize) {
        chunks.push({
            chunkIndex: chunks.length,
            pages: sortedPages.slice(i, i + chunkSize),
        });
    }
    return chunks;
};
