import { Document } from "../models/Document.js";
import Groq from 'groq-sdk';
import { handleServerError } from "../utils/handleServerError.js";

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

        if (document.status !== 'ready') {
            return res.status(400).json({ message: "File is still processing" });
        }

        const allPages = [...document.extractedText]
            .sort((a, b) => a.pageNumber - b.pageNumber);

        const chunkSize = 3;
        const chunks = [];
        for (let i = 0; i < allPages.length; i += chunkSize) {
            chunks.push(allPages.slice(i, i + chunkSize)); // ✅ allPages.slice not just slice
        }

        const questionsPerChunk = Math.max(1, Math.ceil(count / chunks.length));
        const allQuestions = [];

        for (const chunk of chunks) { // ✅ const chunk, not just chunk
            const pdfContext = chunk
                .map(p => `[Page ${p.pageNumber}]\n${p.content.slice(0, 800)}`)
                .join("\n\n");

            // ✅ prompt and completion must be INSIDE the loop
            const prompt = `You are a quiz generator. Based on the excerpt below, generate exactly ${questionsPerChunk} multiple choice questions.

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Include a brief explanation for why the answer is correct
- Cover different topics across the document

Respond ONLY with a valid JSON array, no markdown, no extra text:
[
  {
    "question": "Question text here?",
    "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
    "answer": "A",
    "explanation": "Brief explanation why A is correct"
  }
]

DOCUMENT EXCERPT:
${pdfContext}`;

            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1024, // ✅ 1024 not 4096, keeps each chunk small
            });

            const raw = completion.choices[0].message.content;
            const clean = raw.replace(/```json|```/g, "").trim();

            try {
                const questions = JSON.parse(clean);
                allQuestions.push(...questions);
            } catch {
                // skip bad chunk
            }
        }

        const shuffled = allQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, count);

        return res.status(200).json({ questions: shuffled }); // ✅ shuffled not questions
    } catch (error) {
        return handleServerError(res, error, "Couldn't generate content. Please try again");
    }
}