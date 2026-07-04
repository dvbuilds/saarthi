import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api.js";
import { getErrorMessage } from "../utils/getErrorMessage.js";

// ── Icons ─────────────────────────────────────────────────────────────────────
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
function CountSelector({ onStart, loading }) {
  const [count, setCount] = useState(10);

  return (
    <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(10,22,40,0.10)] border border-slate-100 p-10 w-full max-w-[440px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl mx-auto mb-6">📝</div>
        <h1 className="font-syne font-extrabold text-[26px] text-navy mb-2">Smart Quiz</h1>
        <p className="font-inter text-[14px] text-slate-500 mb-8 leading-relaxed">
          AI will generate MCQs from your document. Choose how many questions you want.
        </p>

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
function QuizScreen({ questions, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]); // { selected, correct, explanation }
  const [confirmed, setConfirmed] = useState(false);

  const q = questions[current];
  const total = questions.length;
  const progress = ((current) / total) * 100;

  // Defensive guard — if a question in the array is malformed (missing
  // options/answer), don't crash the whole quiz. Skip forward instead.
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

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, {
      question: q.question,
      selected,
      correct: q.answer,
      explanation: q.explanation,
      options: q.options,
    }];
    setAnswers(newAnswers);

    if (current + 1 >= total) {
      onFinish(newAnswers);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  const isCorrect = selected === q.answer;

  return (
    <div className="min-h-screen bg-offwhite dot-bg px-4 py-10">
      <div className="max-w-[680px] mx-auto">

        {/* Progress */}
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

        {/* Question card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_32px_rgba(10,22,40,0.08)] p-8 mb-5">
          <p className="font-inter text-[11px] font-semibold text-amber-500 tracking-widest uppercase mb-3">
            Question {current + 1}
          </p>
          <h2 className="font-syne font-bold text-[20px] text-navy leading-snug mb-7">
            {q.question}
          </h2>

          <div className="flex flex-col gap-3">
            {q.options.map((opt) => {
              const letter = opt.charAt(0); // "A", "B", "C", "D"
              const isSelected = selected === letter;
              const isCorrectOpt = confirmed && letter === q.answer;
              const isWrongOpt = confirmed && isSelected && letter !== q.answer;

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

        {/* Explanation (shown after confirming) */}
        {confirmed && (
          <div className={`rounded-2xl px-6 py-4 mb-5 border ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className={`font-syne font-bold text-[13px] mb-1 ${isCorrect ? "text-green-700" : "text-red-700"}`}>
              {isCorrect ? "✅ Correct!" : `❌ Wrong — Correct answer is ${q.answer}`}
            </p>
            <p className="font-inter text-[13.5px] text-slate-700 leading-relaxed">{q.explanation}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {!confirmed ? (
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="flex-1 py-4 rounded-[12px] bg-gradient-to-br from-amber-400 to-amber-500 font-syne font-bold text-[15px] text-navy border-none cursor-pointer shadow-[0_4px_14px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Confirm Answer
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

        {/* Score card */}
        <div className={`rounded-3xl border ${grade.border} ${grade.bg} p-8 text-center mb-8`}>
          <p className="font-inter text-[13px] font-semibold text-slate-500 tracking-widest uppercase mb-3">Quiz Complete</p>
          <div className="text-[64px] font-syne font-extrabold text-navy leading-none mb-2">{pct}%</div>
          <p className={`font-syne font-bold text-[20px] ${grade.color} mb-1`}>{grade.label}</p>
          <p className="font-inter text-[14px] text-slate-500">
            You got <strong>{score}</strong> out of <strong>{total}</strong> questions correct
          </p>
        </div>

        {/* Review */}
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

        {/* Actions */}
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
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async (count) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post(`/quiz/${id}`, { count });
      const generated = res.data.questions || [];

      // Guard against the API succeeding but returning no usable questions —
      // without this, moving to "quiz" stage would crash on questions[0].
      if (generated.length === 0) {
        setError("Couldn't generate quiz questions from this document. It may be too short or unreadable.");
        return;
      }

      setQuestions(generated);
      setStage("quiz");
    } catch (err) {
      setError(getErrorMessage(err, {
        404: "This document couldn't be found. It may have been deleted.",
        422: "Couldn't generate a quiz from this document — it may be too short or unreadable.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = (finalAnswers) => {
    setAnswers(finalAnswers);
    setStage("results");
  };

  const handleRetry = () => {
    setQuestions([]);
    setAnswers([]);
    setStage("select");
  };

  if (stage === "select") {
    return (
      <>
        {/* Back button */}
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
        <CountSelector onStart={handleStart} loading={loading} />
      </>
    );
  }

  if (stage === "quiz") {
    // Extra safety net in case state gets out of sync somehow
    if (questions.length === 0) {
      setStage("select");
      return null;
    }
    return <QuizScreen questions={questions} onFinish={handleFinish} />;
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