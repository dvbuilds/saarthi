import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Given the full array of page objects [{ pageNumber, content }, ...] and a
 * chunkSize (pages per section), returns an array of section metadata —
 * ONE AI call total, not one per chunk.
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

    // Build a short excerpt per chunk — first ~300 chars is usually enough
    // to identify the topic and judge its structure, keeps the single
    // prompt from ballooning in size.
    const excerpts = chunks.map((chunk, i) => {
        const text = chunk.map(p => p.content).join(" ").slice(0, 300);
        return `SECTION ${i + 1} (pages ${chunk[0].pageNumber}-${chunk[chunk.length - 1].pageNumber}):\n${text}`;
    }).join("\n\n---\n\n");

    const prompt = `You are analyzing sections of a textbook/document for a study app. Below are ${chunks.length} excerpts, each from a different section.

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

    let parsed;
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
        });

        const raw = completion.choices[0].message.content;
        const clean = raw.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);

        if (!Array.isArray(parsed) || parsed.length !== chunks.length) {
            throw new Error("Section metadata count mismatch");
        }
    } catch (error) {
        console.error("[generateSectionTitles] AI classification failed, falling back to generic labels:", error.message);
        // Safe fallback: generic titles, and default every chunk to "dense"
        // so the notes generator still does full synthesis (today's
        // existing behavior) rather than silently under-processing content.
        parsed = chunks.map((_, i) => ({ title: `Section ${i + 1}`, contentType: "dense" }));
    }

    return chunks.map((chunk, i) => ({
        index: i,
        title: parsed[i]?.title || `Section ${i + 1}`,
        contentType: parsed[i]?.contentType === "structured" ? "structured" : "dense",
        pageStart: chunk[0].pageNumber,
        pageEnd: chunk[chunk.length - 1].pageNumber,
    }));
};
