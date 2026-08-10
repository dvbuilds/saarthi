// Local, free, in-process "embeddings" for retrieval — no external API call,
// no model download, no new infrastructure. The existing stack has no
// vector DB or embeddings provider (checked: Groq only does inference, not
// embeddings; no Pinecone/Weaviate/Chroma config anywhere), so standing up
// a full neural-embedding pipeline would mean adding a new external
// dependency (and a network call) for every chat message just to answer
// "which pages are relevant". TF-IDF vectors + cosine similarity give a
// genuine vector-space nearest-neighbor retrieval that's fast, free, and
// works fully offline — appropriate for a single-document retrieval scope
// (we're ranking a few dozen/hundred chunks against one query, not doing
// open-domain semantic search over a huge corpus).
//
// Each chunk and the query are represented as sparse term -> weight Maps
// (not dense arrays) since vocabularies can run into the thousands of
// terms for a large document — sparse vectors keep this O(unique terms),
// not O(vocab size), per comparison.

const STOPWORDS = new Set([
    "the", "a", "an", "and", "or", "but", "if", "then", "is", "are", "was",
    "were", "be", "been", "being", "to", "of", "in", "on", "at", "for",
    "with", "as", "by", "this", "that", "these", "those", "it", "its",
    "from", "into", "which", "what", "who", "whom", "will", "would",
    "should", "can", "could", "not", "no", "do", "does", "did", "you",
    "your", "i", "we", "they", "he", "she", "his", "her", "their", "our",
    "about", "there", "here", "so", "than", "too", "very", "just", "also",
]);

const tokenize = (text) => {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((tok) => tok.length > 2 && !STOPWORDS.has(tok));
};

const termFrequencies = (tokens) => {
    const tf = new Map();
    for (const tok of tokens) {
        tf.set(tok, (tf.get(tok) || 0) + 1);
    }
    return tf;
};

/**
 * Builds document-frequency counts across all chunks (how many chunks each
 * term appears in) — the "corpus" here is just this one document's chunks,
 * which is exactly the retrieval scope we need.
 */
const buildDocumentFrequencies = (chunkTokenLists) => {
    const df = new Map();
    for (const tokens of chunkTokenLists) {
        const seen = new Set(tokens);
        for (const term of seen) {
            df.set(term, (df.get(term) || 0) + 1);
        }
    }
    return df;
};

const tfIdfVector = (tokens, df, totalDocs) => {
    const tf = termFrequencies(tokens);
    const vector = new Map();
    for (const [term, count] of tf.entries()) {
        const docFreq = df.get(term) || 1;
        // Smoothed IDF — never zero/negative, stays finite for terms only
        // seen in the query (docFreq defaults to 1 above).
        const idf = Math.log((totalDocs + 1) / (docFreq + 1)) + 1;
        vector.set(term, count * idf);
    }
    return vector;
};

const cosineSimilarity = (vecA, vecB) => {
    // Iterate the smaller map for the dot product — keeps this cheap even
    // when one side (usually the query) has far fewer terms.
    const [small, large] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];

    let dot = 0;
    for (const [term, weight] of small.entries()) {
        const other = large.get(term);
        if (other) dot += weight * other;
    }

    let normA = 0;
    for (const w of vecA.values()) normA += w * w;
    let normB = 0;
    for (const w of vecB.values()) normB += w * w;

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Ranks chunks (each { chunkIndex, text }) against a query string using
 * local TF-IDF cosine similarity. Returns chunks sorted by descending
 * relevance, each annotated with a `score`.
 */
export const rankChunksByRelevance = (chunks, query) => {
    const chunkTokenLists = chunks.map((c) => tokenize(c.text));
    const df = buildDocumentFrequencies(chunkTokenLists);
    const totalDocs = chunks.length;

    const chunkVectors = chunkTokenLists.map((tokens) => tfIdfVector(tokens, df, totalDocs));
    const queryVector = tfIdfVector(tokenize(query), df, totalDocs);

    return chunks
        .map((chunk, i) => ({
            ...chunk,
            score: cosineSimilarity(queryVector, chunkVectors[i]),
        }))
        .sort((a, b) => b.score - a.score);
};
