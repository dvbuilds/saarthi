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

        const chunkSummaries = [];

        for (const chunk of chunks) {
            const pdfContext = chunk
                .map(p => `[Page ${p.pageNumber}]\n${p.content}`)
                .join("\n\n");

            const prompt = `You are a document summarizer. Read the following document excerpt and extract the most important points.

                STRICT RULES:
                - Respond ONLY with a raw JSON array of strings
                - No markdown, no backticks, no explanation, no intro text
                - Each string should be one complete, informative sentence
                - Generate between 3 and 5 points

                Example of valid response:
                ["Point one here.", "Point two here.", "Point three here."]

                DOCUMENT EXCERPT:
                ${pdfContext}`;
            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1024,

            })

            const raw = completion.choices[0].message.content;
            const clean = raw.replace(/```json|```/g, "").trim();

            try {
                const points = JSON.parse(clean);
                chunkSummaries.push(...points);
            } catch(e) {
                console.log("Failed chunk parse:", clean);
            }

            await new Promise(resolve => setTimeout(resolve, 1500));

            return res.status(200).json({ summary: chunkSummaries });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}