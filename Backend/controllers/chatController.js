import Groq from 'groq-sdk';
import {Document} from '../models/Document.js';
import { handleServerError } from '../utils/handleServerError.js';
import { buildChatContext } from '../services/retrieveRelevantContext.js';
import { logger } from '../utils/logger.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Defensive cap even though the frontend already trims to the last 10
// turns — never trust the client alone for something that feeds directly
// into token usage.
const MAX_HISTORY_TURNS = 10;
const MAX_HISTORY_MESSAGE_CHARS = 2000;

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

        // For large documents, this returns only the most relevant chunks
        // (local TF-IDF retrieval) instead of the entire extracted text —
        // see retrieveRelevantContext.js for why. Small documents still
        // get the full text, unchanged from before.
        const { context: pdfContext, usedRetrieval, chunksUsed, totalChunks } = buildChatContext(document, message, history);

        if (usedRetrieval) {
            logger.info(
                { documentId: docId, chunksUsed, totalChunks },
                "Chat using retrieved context (large document)"
            );
        }

        const trimmedHistory = history
            .slice(-MAX_HISTORY_TURNS)
            .map(h => ({
                role: h.role,
                content: typeof h.content === "string" ? h.content.slice(0, MAX_HISTORY_MESSAGE_CHARS) : "",
            }));

        const promptMessages = [
            {
                role: "system",
                content: `You are Saarthi, an AI study assistant. Answer question strictly based on the pdf content below. If the answer isn't in the document, say so clearly and tell the user a little context of it. Always mention the page number when referencing specific content.${usedRetrieval ? " Note: this is a large document, so you're seeing the most relevant excerpts rather than the full text — if the user's question seems to be about a different part of the document, say so rather than guessing." : ""}
            PDF CONTENT: ${pdfContext}`,

            },
            ...trimmedHistory.map(h => ({
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

        document.chatHistory.push(
            { role: "user", content: message },
            { role: "assistant", content: reply },
        )

        await document.save();

        return res.status(200).json({ reply });
    } catch (error) {
        return handleServerError(res, error, "Couldn't start chat. Please try again.")
    }
}