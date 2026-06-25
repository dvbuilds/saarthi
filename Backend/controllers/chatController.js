import Groq from 'groq-sdk';
import {Document} from '../models/Document.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const chatWithPDF = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        const docId = req.params.id;

        if (!docId || !message ) {
            return res.status(400).json({ message: "Fill Required Fields" });
        }

        const document = await Document.findOne({
            _id: docId,
            uploadedBy: req.user._id,
        });

        if (!document) {
            return res.status(404).json({ message: "Document Not Found" });
        }

        if (document.status !== 'ready') {
            return res.status(400).json({ message: "Document is still processing" });
        }

        const pdfContext = document.extractedText
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map(p => `[Page ${p.pageNumber}]\n${p.content}`)
            .join("\n\n");

        const promptMessages = [
            {
                role: "system",
                content: `You are Saarthi, an AI study assistant. Answer question strictly based on the pdf content below. If the answer isn't in the document, say so clearly and tell the user a little context of it. Always mention the page number when referencing specific content.
            PDF CONTENT: ${pdfContext}`,

            },
            ...history.map(h => ({
                role: h.role,
                content: h.content,
            })),
            {
                role: "user",
                content: message,
            },
        ];

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: promptMessages,
            max_tokens: 1024,
        });

        const reply = completion.choices[0].message.content;

        return res.status(200).json({ reply });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}