import { Document } from "../models/Document.js";
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateQuiz = async (req, res) => {
    try {
        const { count = 10 } = req.body;
        const docId = req.params.id;

        const document = await Document.findOne({
            _id: docId,
            uploadedBy: req.user._id,
        });

        if (!document) {
            return res.status(404).json({ message: "File not found" });
        }

        if (document.status === 'ready') {
            return res.status(400).json({ message: "File is still processing" });
        }

        const pdfContext = document.extractedText
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map(p => `[Page ${p.pageNumber}]\n${p.content}`)
            .join("\n\n");

        const prompt = `You are a quiz generator. Based on the document below, generate exactly ${count} multiple choice questions.
    DOCUMENT: 
    ${pdfContext}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4096,
        });

        const raw = completion.choices[0].message.content;
        const clean = raw.replace(/```json|```/g, "").trim();
        const questions = JSON.parse(clean);

        return res.status(200).json({ questions });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}