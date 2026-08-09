// Deterministic string for a chunk selection — same logic used for both
// idempotency keys (generationJobService.js) and AI output cache keys
// (aiOutputCache.js). Kept in one place so the two never drift apart.
export const computeSelectionSignature = (selectedChunkIndexes) => {
    return Array.isArray(selectedChunkIndexes) && selectedChunkIndexes.length > 0
        ? [...selectedChunkIndexes].sort((a, b) => a - b).join(",")
        : "all";
};
