import Groq from 'groq-sdk';
import { Document } from "../models/Document.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateSummary = async (req, res) => {
    try {
        const docId = req.params.id;

        const document = await Document.findOne({
            _id: docId,
            uploadedBy: req.user._id,
        })

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        if (document.status !== 'ready') {
            return res.status(400).json({ message: "Document still processing" });
        }


        const allPages = [...document.extractedText]
            .sort((a, b) => a.pageNumber - b.pageNumber);

        const chunkSize = 2;
        const chunks = [];
        for (let i = 0; i < allPages.length; i += chunkSize) {
            chunks.push(allPages.slice(i, i + chunkSize));
        }

        // Process chunks in parallel batches of 2
        const batchSize = 2;
        const chunkSummaries = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);

            // process this batch in parallel
            const batchResults = await Promise.all(
                batch.map(async (chunk) => {
                    const pdfContext = chunk
                        .map(p => `[Page ${p.pageNumber}]\n${p.content}`)
                        .join("\n\n");

                    const prompt = `You are a document summarizer. Extract key points from the excerpt below.

STRICT RULES:
- Each point must be a complete informative sentence with actual content
- Do NOT include headings, titles, or topic names as points
- Each point must explain something, not just name something
- Minimum 10 words per point

Respond ONLY with a valid JSON array of strings, no markdown, no extra text:
["Point 1 as a complete sentence.", "Point 2 as a complete sentence."]

DOCUMENT EXCERPT:
${pdfContext}`;

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
                        return []; // skip failed chunk
                    }
                })
            );

            // flatten batch results
            batchResults.forEach(points => chunkSummaries.push(...points));

            // wait between batches, not between every chunk
            if (i + batchSize < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        return res.status(200).json({ summary: chunkSummaries });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}