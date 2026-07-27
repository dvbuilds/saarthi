import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Given the full array of page objects [{ pageNumber, content }, ...] and a
 * chunkSize (pages per section), returns an array of section titles — one
 * AI call total, not one per chunk.
 *
 * Returns: [{ index, title, pageStart, pageEnd }, ...]
 */
export const generateSectionTitles = async (allPages, chunkSize = 5) => {
    const sortedPages = [...allPages].sort((a, b) => a.pageNumber - b.pageNumber);

    const chunks = [];
    for (let i = 0; i < sortedPages.length; i += chunkSize) {
        chunks.push(sortedPages.slice(i, i + chunkSize));
    }

    // Build a short excerpt per chunk — first ~300 chars is usually enough
    // to identify the topic, keeps the single prompt from ballooning in size.
    const excerpts = chunks.map((chunk, i) => {
        const text = chunk.map(p => p.content).join(" ").slice(0, 300);
        return `SECTION ${i + 1} (pages ${chunk[0].pageNumber}-${chunk[chunk.length - 1].pageNumber}):\n${text}`;
    }).join("\n\n---\n\n");

    const prompt = `You are titling sections of a textbook/document for a study app. Below are ${chunks.length} excerpts, each from a different section. Give each one a short, specific title (3-8 words) describing what it actually covers. Do not use generic labels like "Section 1" or "Introduction" unless that's genuinely what it is.

Respond ONLY with a valid JSON array of strings, in the same order as the sections, no markdown, no extra text:
["Title for section 1", "Title for section 2", ...]

${excerpts}`;

    let titles;
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
        });

        const raw = completion.choices[0].message.content;
        const clean = raw.replace(/```json|```/g, "").trim();
        titles = JSON.parse(clean);

        if (!Array.isArray(titles) || titles.length !== chunks.length) {
            throw new Error("Title count mismatch");
        }
    } catch (error) {
        console.error("[generateSectionTitles] AI titling failed, falling back to generic labels:", error.message);
        titles = chunks.map((_, i) => `Section ${i + 1}`);
    }

    return chunks.map((chunk, i) => ({
        index: i,
        title: titles[i],
        pageStart: chunk[0].pageNumber,
        pageEnd: chunk[chunk.length - 1].pageNumber,
    }));
};