import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGenerationStream } from "../hooks/useGenerationStream.js";
import API from "../services/api.js";

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ── Count Selector Screen ─────────────────────────────────────────────────────
// While generating, this also renders a live, read-only preview of
// questions as they stream in — one at a time, question text only (no
// options/answers) — via `questions`/`progress`. The interactive
// quiz-taking screen itself only opens once generation is fully done: the
// backend shuffles and trims the question set right at completion (see
// startWorkers.js) and answer grading is index-based against that final,
// stable list — starting the quiz mid-shuffle would risk a student's
// answered question silently pointing at a different one once the
// generating list gets its final reorder. Streaming the preview here
// keeps content appearing in real time without touching that guarantee.
function CountSelector({ onStart, loading, questions, progress }) {
  const [count, setCount] = useState(10);
  const streamedCount = questions.length;

  return (
    <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(10,22,40,0.10)] border border-slate-100 p-10 w-full max-w-[440px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl mx-auto mb-6">📝</div>
        <h1 className="font-syne font-extrabold text-[26px] text-navy mb-2">Smart Quiz</h1>
        <p className="font-inter text-[14px] text-slate-500 mb-8 leading-relaxed">
          AI will generate MCQs from your document. Choose how many questions you want.
        </p>

        {!loading && (
          <div className="mb-8">
            <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-3 text-left">
              Number of questions
            </label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`py-3 rounded-xl font-syne font-bold text-[15px] border-[1.5px] transition-all duration-200
                    ${count === n
                      ? "bg-amber-400 border-amber-400 text-navy shadow-[0_4px_14px_rgba(245,158,11,0.3)]"
                      : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="font-inter text-[13px] text-slate-500 shrink-0">Custom:</label>
              <input
                type="number"
                min={1}
                max={30}
                value={count}
                onChange={e => setCount(Math.min(30, Math.max(1, Number(e.target.value))))}
                className="flex-1 px-4 py-2.5 rounded-xl border-[1.5px] border-slate-200 font-inter text-[14px] text-navy focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-8 text-left">
            <div className="flex items-center justify-center gap-2 mb-4">
              <SpinnerIcon />
              <p className="font-inter text-[13px] text-slate-500">
                {progress.total > 0
                  ? `Processing section ${progress.completed} of ${progress.total}…`
                  : "Warming up…"}
              </p>
            </div>

            {streamedCount > 0 && (
              <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1">
                {questions.map((q, i) => (
                  <div
                    key={i}
                    className="flex gap-2.5 items-start bg-amber-50/60 border border-amber-100 rounded-xl px-3.5 py-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center font-syne font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="font-inter text-[12.5px] text-navy leading-snug line-clamp-2">{q.question}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="font-inter text-[12px] text-slate-400 text-center mt-3">
              {streamedCount > 0 ? `${streamedCount} question${streamedCount === 1 ? "" : "s"} generated so far…` : "This can take a bit longer for larger documents"}
            </p>
          </div>
        )}

        <button
          onClick={() => onStart(count)}
          disabled={loading}
          className="w-full py-4 rounded-[12px] bg-gradient-to-br from-amber-400 to-amber-500 font-syne font-bold text-[16px] text-navy border-none cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_18px_rgba(245,158,11,0.28)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(245,158,11,0.38)] transition-all duration-250 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading ? <><SpinnerIcon />Generating Quiz…</> : "Generate Quiz →"}
        </button>
      </div>
    </div>
  );
}

// ── Quiz Screen ───────────────────────────────────────────────────────────────
// Correctness now comes from the server (POST /jobs/:jobId/quiz-answer),
// never from the client-side question data — the answer key was stripped
// from `questions` on the backend, so q.answer/q.explanation no longer
// exist here at all.
function QuizScreen({ questions, jobId, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState(null); // { correct, correctAnswer, explanation }
  const [submitting, setSubmitting] = useState(false);

  const q = questions[current];
  const total = questions.length;
  const progress = ((current) / total) * 100;

  if (!q || !Array.isArray(q.options)) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.10)] p-10 w-full max-w-[440px] text-center">
          <p className="text-red-500 font-inter text-[14px] mb-6">⚠️ This question couldn't be loaded properly.</p>
          {current + 1 < total ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="w-full py-4 rounded-[12px] bg-gradient-to-br from-amber-400 to-amber-500 font-syne font-bold text-[15px] text-navy border-none cursor-pointer shadow-[0_4px_14px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 transition-all duration-200"
            >
              Skip to Next Question →
            </button>
          ) : (
            <button
              onClick={() => onFinish(answers)}
              className="w-full py-4 rounded-[12px] bg-gradient-to-br from-blue to-blue-dark font-syne font-bold text-[15px] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 transition-all duration-200"
            >
              See Results →
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSelect = (letter) => {
    if (confirmed) return;
    setSelected(letter);
  };

  const handleConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const res = await API.post(`/jobs/${jobId}/quiz-answer`, {
        questionIndex: current,
        selectedAnswer: selected,
      });
      setFeedback(res.data);
      setConfirmed(true);
    } catch (err) {
      // Degrade gracefully rather than getting stuck — student still sees
      // *something*, just without a confirmed correct answer highlighted.
      setFeedback({ correct: false, correctAnswer: null, explanation: "Couldn't check this answer right now." });
      setConfirmed(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const newAnswers = [...answers, {
      question: q.question,
      selected,
      correct: feedback?.correctAnswer,
      explanation: feedback?.explanation,
      options: q.options,
    }];
    setAnswers(newAnswers);

    if (current + 1 >= total) {
      onFinish(newAnswers);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setConfirmed(false);
      setFeedback(null);
    }
  };

  const isCorrect = feedback?.correct;

  return (
    <div className="min-h-screen bg-offwhite dot-bg px-4 py-10">
      <div className="max-w-[680px] mx-auto">

        <div className="mb-8">
          <div className="flex justify-between font-inter text-[13px] text-slate-500 mb-2">
            <span>Question {current + 1} of {total}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_32px_rgba(10,22,40,0.08)] p-8 mb-5">
          <p className="font-inter text-[11px] font-semibold text-amber-500 tracking-widest uppercase mb-3">
            Question {current + 1}
          </p>
          <h2 className="font-syne font-bold text-[20px] text-navy leading-snug mb-7">
            {q.question}
          </h2>

          <div className="flex flex-col gap-3">
            {q.options.map((opt) => {
              const letter = opt.charAt(0);
              const isSelected = selected === letter;
              const isCorrectOpt = confirmed && letter === feedback?.correctAnswer;
              const isWrongOpt = confirmed && isSelected && letter !== feedback?.correctAnswer;

              return (
                <button
                  key={letter}
                  onClick={() => handleSelect(letter)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-[1.5px] text-left font-inter text-[14.5px] transition-all duration-200
                    ${isCorrectOpt
                      ? "border-green-400 bg-green-50 text-green-800"
                      : isWrongOpt
                        ? "border-red-400 bg-red-50 text-red-700"
                        : isSelected
                          ? "border-amber-400 bg-amber-50 text-navy shadow-[0_4px_14px_rgba(245,158,11,0.15)]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/40"
                    } ${confirmed ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-syne font-bold text-[13px] shrink-0
                    ${isCorrectOpt ? "bg-green-400 text-white" :
                      isWrongOpt ? "bg-red-400 text-white" :
                      isSelected ? "bg-amber-400 text-navy" : "bg-slate-100 text-slate-500"}`}>
                    {letter}
                  </span>
                  <span>{opt.slice(3)}</span>
                  {isCorrectOpt && <span className="ml-auto text-green-500 text-lg">✓</span>}
                  {isWrongOpt && <span className="ml-auto text-red-400 text-lg">✗</span>}
                </button>
              );
            })}
          </div>
        </div>

        {confirmed && (
          <div className={`rounded-2xl px-6 py-4 mb-5 border ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className={`font-syne font-bold text-[13px] mb-1 ${isCorrect ? "text-green-700" : "text-red-700"}`}>
              {isCorrect ? "✅ Correct!" : `❌ Wrong — Correct answer is ${feedback?.correctAnswer ?? "unavailable"}`}
            </p>
            <p className="font-inter text-[13.5px] text-slate-700 leading-relaxed">{feedback?.explanation}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!confirmed ? (
            <button
              onClick={handleConfirm}
              disabled={!selected || submitting}
              className="flex-1 py-4 rounded-[12px] bg-gradient-to-br from-amber-400 to-amber-500 font-syne font-bold text-[15px] text-navy border-none cursor-pointer shadow-[0_4px_14px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {submitting ? "Checking…" : "Confirm Answer"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-4 rounded-[12px] bg-gradient-to-br from-blue to-blue-dark font-syne font-bold text-[15px] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 transition-all duration-200"
            >
              {current + 1 >= total ? "See Results →" : "Next Question →"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────
// Unchanged — a.correct/a.explanation now originate from the server-graded
// feedback instead of the (now-stripped) raw job data, but the shape
// QuizScreen hands off is identical, so nothing here needs to change.
function ResultsScreen({ answers, onRetry, onDashboard }) {
  const [expanded, setExpanded] = useState(null);
  const score = answers.filter(a => a.selected === a.correct).length;
  const total = answers.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const grade =
    pct >= 90 ? { label: "Excellent!", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" } :
    pct >= 70 ? { label: "Good Job!", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" } :
    pct >= 50 ? { label: "Keep Practicing", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" } :
                { label: "Needs Work", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };

  return (
    <div className="min-h-screen bg-offwhite dot-bg px-4 py-10">
      <div className="max-w-[680px] mx-auto">

        <div className={`rounded-3xl border ${grade.border} ${grade.bg} p-8 text-center mb-8`}>
          <p className="font-inter text-[13px] font-semibold text-slate-500 tracking-widest uppercase mb-3">Quiz Complete</p>
          <div className="text-[64px] font-syne font-extrabold text-navy leading-none mb-2">{pct}%</div>
          <p className={`font-syne font-bold text-[20px] ${grade.color} mb-1`}>{grade.label}</p>
          <p className="font-inter text-[14px] text-slate-500">
            You got <strong>{score}</strong> out of <strong>{total}</strong> questions correct
          </p>
        </div>

        <h2 className="font-syne font-bold text-[16px] text-navy mb-4">Review All Questions</h2>
        <div className="flex flex-col gap-3 mb-8">
          {answers.map((a, i) => {
            const correct = a.selected === a.correct;
            const open = expanded === i;
            return (
              <div key={i} className={`rounded-2xl border bg-white overflow-hidden transition-all duration-200 ${correct ? "border-green-200" : "border-red-200"}`}>
                <button
                  onClick={() => setExpanded(open ? null : i)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left"
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 ${correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {correct ? "✓" : "✗"}
                  </span>
                  <span className="flex-1 font-inter text-[13.5px] text-navy font-medium line-clamp-1">{a.question}</span>
                  <span className="text-slate-400 text-sm shrink-0">{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    <div className="flex flex-col gap-2 mb-4">
                      {(a.options || []).map(opt => {
                        const letter = opt.charAt(0);
                        const isCorrect = letter === a.correct;
                        const isYours = letter === a.selected;
                        return (
                          <div key={letter} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-inter
                            ${isCorrect ? "bg-green-50 text-green-800 font-semibold" :
                              isYours && !isCorrect ? "bg-red-50 text-red-700" :
                              "text-slate-500"}`}>
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0
                              ${isCorrect ? "bg-green-400 text-white" :
                                isYours ? "bg-red-400 text-white" : "bg-slate-100 text-slate-400"}`}>
                              {letter}
                            </span>
                            {opt.slice(3)}
                            {isCorrect && <span className="ml-auto">✓</span>}
                            {isYours && !isCorrect && <span className="ml-auto">✗ your answer</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="font-inter text-[12px] font-semibold text-blue-600 mb-1">Explanation</p>
                      <p className="font-inter text-[13px] text-slate-700 leading-relaxed">{a.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-4 rounded-[12px] bg-gradient-to-br from-amber-400 to-amber-500 font-syne font-bold text-[15px] text-navy border-none cursor-pointer shadow-[0_4px_14px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 transition-all duration-200"
          >
            Try Again
          </button>
          <button
            onClick={onDashboard}
            className="flex-1 py-4 rounded-[12px] border-[1.5px] border-slate-200 bg-white font-syne font-bold text-[15px] text-navy cursor-pointer hover:border-blue-300 hover:text-blue transition-all duration-200"
          >
            ← Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState("select"); // "select" | "quiz" | "results"
  const [answers, setAnswers] = useState([]);

  // autoStart: false — generation only begins once the user picks a count and hits Generate
  const { result, loading, error, start, jobId, progress } = useGenerationStream(`/quiz/${id}`, { autoStart: false });
  const questions = result || [];

  const handleStart = async (count) => {
    await start({ count });
  };

  // Once the job completes with actual questions, move to the quiz stage
  if (stage === "select" && !loading && !error && questions.length > 0) {
    setStage("quiz");
  }

  const handleFinish = (finalAnswers) => {
    setAnswers(finalAnswers);
    setStage("results");
  };

  const handleRetry = () => {
    setAnswers([]);
    setStage("select");
  };

  if (stage === "select") {
    return (
      <>
        <div className="fixed top-5 left-5 z-50">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 font-inter text-[13px] text-slate-600 hover:text-navy hover:border-slate-300 shadow-sm transition-all duration-200"
          >
            <BackIcon /> Dashboard
          </button>
        </div>
        {error && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 font-inter text-[13px] px-5 py-3 rounded-2xl shadow max-w-[90vw] text-center">
            ⚠️ {error}
          </div>
        )}
        {!loading && !error && result !== null && questions.length === 0 && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-700 font-inter text-[13px] px-5 py-3 rounded-2xl shadow max-w-[90vw] text-center">
            ⚠️ Couldn't generate quiz questions from this document — it may be too short or unreadable.
          </div>
        )}
        <CountSelector onStart={handleStart} loading={loading} questions={questions} progress={progress} />
      </>
    );
  }

  if (stage === "quiz") {
    if (questions.length === 0) {
      setStage("select");
      return null;
    }
    return <QuizScreen questions={questions} jobId={jobId} onFinish={handleFinish} />;
  }

  if (stage === "results") {
    return (
      <ResultsScreen
        answers={answers}
        onRetry={handleRetry}
        onDashboard={() => navigate("/dashboard")}
      />
    );
  }
}