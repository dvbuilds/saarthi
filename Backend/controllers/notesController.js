import Groq from 'groq-sdk';
import { Document } from '../models/Document.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateNotes = async (req, res) => {
    try {
        const docId = req.params.id;

        const document = await Document.findOne({
            _id: docId,
            uploadedBy: req.user._id,
        })

        if (!document) {
            return res.status(404).json({ message: "Document Not Found" });
        }

        if (document.status !== 'ready') {
            return res.status(401).json({ message: "Document still processing" });
        }

        const allPages = [...document.extractedText]
            .sort((a, b) => a.pageNumber - b.pageNumber);

        const chunkSize = 2;
        const chunks = [];
        for (let i = 0; i < allPages.length; i += chunkSize) {
            chunks.push(allPages.slice(i, i + chunkSize));
        }

        const batchSize = 2;
        const allNotes = []

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);

            const bacthResults = await Promise.all(
                batch.map(async (chunk) => {
                    const pdfContext = chunk
                        .map(p => `[Page ${p.pageNumber}]\n${p.conetnt}`)
                        .join("\n\n");

                    const prompt = `You are a study notes generator. Convert the document excerpt below into structured study notes.

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

                    try {
                        const completion = await groq.chat.completions.create({
                            model: "llama-3.1-8b-instant",
                            messages: { role: "user", content: prompt },
                            max_tokens: 1024,
                        });

                        const raw = completion.choices[0].message.content;
                        const clean = raw.replace(/```json|```/g, "");
                        return JSON.parse(clean);
                    } catch {
                        return [];
                    }
                })
            )

            bacthResults.forEach(notes => allNotes.push(...notes));

            if (i + batchSize < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        return res.status(200), json({ notes: allNotes });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

}