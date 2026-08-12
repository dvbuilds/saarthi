// Quiz answers/explanations must never reach the client ahead of time — a
// student reading the raw network response (poll or stream) shouldn't be
// able to see the answer key before answering. Correctness is checked
// server-side instead, via POST /jobs/:jobId/quiz-answer.
//
// Pulled out as a shared helper so the same stripping applies everywhere
// a quiz result can reach the client: the poll endpoint (getJobStatus),
// the SSE snapshot/done events, and each live "item" event as questions
// stream in (jobController.js).
export const sanitizeQuizItem = ({ question, options }) => ({ question, options });

export const sanitizeGenerationResult = (type, result) => {
    if (type === "quiz" && Array.isArray(result)) {
        return result.map(sanitizeQuizItem);
    }
    return result;
};
