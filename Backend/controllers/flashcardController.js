import { Document } from "../models/Document.js";
import Groq from "groq-sdk";
import { handleServerError } from "../utils/handleServerError.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateFlashcards = async (req, res) => {
    try {
        const docId = req.params.id;

        const document = await Document.findOne({
            _id: docId,
            uploadedBy: req.user._id,
        });

        if (!document) {
            return res.status(404).json({ message: "Document Not Found" });
        }

        if (document.status !== 'ready') {
            return res.status(400).json({ message: "Document still processing" });
        }

        const allPages = [...document.extractedText]
            .sort((a, b) => a.pageNumber - b.pageNumber);

        const chunkSize = 3;
        const chunks = [];
        for (let i = 0; i < allPages.length; i += chunkSize) {
            chunks.push(allPages.slice(i, i + chunkSize));
        }

        const allFlashcards = [];

        for (const chunk of chunks) {
            const pdfContext = chunk
                .map(p => `[Page ${p.pageNumber}]\n${p.content.slice(0, 800)}`)
                .join("\n\n");

            const prompt = `You are a flashcard generator. Based on the document excerpt below, generate 3 flashcards covering key concepts.

            Respond ONLY with a valid JSON array, no markdown, no extra text:
            [
            {
                "front": "Question or concept here?",
                "back": "Answer or explanation here"
            }
            ]

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
                const cards = JSON.parse(clean);
                allFlashcards.push(...cards);
            } catch {

            }
        }

        return res.status(200).json({ flashcards: allFlashcards })

    } catch (error) {
        return handleServerError(res, error, "Couldn't generate content. Please try again.")
    }

};