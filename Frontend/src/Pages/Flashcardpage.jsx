import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
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

// ── Flashcard (flip animation) ────────────────────────────────────────────────
function Flashcard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false); // reset flip on card change
  }, [index]);

  // Defensive guard — should never happen if the parent checks bounds first,
  // but prevents a crash on card.front if it ever does.
  if (!card) return null;

  return (
    <div className="w-full max-w-[560px] mx-auto" style={{ perspective: "1200px" }}>
      {/* counter */}
      <p className="text-center font-inter text-[13px] text-slate-500 mb-4">
        Card {index + 1} of {total}
      </p>

      {/* card */}
      <div
        onClick={() => setFlipped(f => !f)}
        className="relative w-full cursor-pointer"
        style={{ height: "280px" }}
      >
        {/* inner wrapper — flips */}
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 rounded-3xl border-[1.5px] border-green-200 bg-white shadow-[0_8px_32px_rgba(10,22,40,0.09)] flex flex-col items-center justify-center px-10 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-[11px] font-syne font-bold tracking-widest text-green-500 uppercase mb-4">Question</span>
            <p className="font-syne font-bold text-[20px] text-navy leading-snug">{card.front}</p>
            <p className="font-inter text-[12px] text-slate-400 mt-6">Tap to reveal answer</p>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 rounded-3xl border-[1.5px] border-blue-200 bg-blue-50 shadow-[0_8px_32px_rgba(37,99,235,0.10)] flex flex-col items-center justify-center px-10 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-[11px] font-syne font-bold tracking-widest text-blue-500 uppercase mb-4">Answer</span>
            <p className="font-inter text-[16px] text-navy leading-relaxed">{card.back}</p>
            <p className="font-inter text-[12px] text-slate-400 mt-6">Tap to flip back</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const res = await API.post(`/flashcards/${id}`);
        setFlashcards(res.data.flashcards || []);
      } catch (err) {
        setError(getErrorMessage(err, {
          404: "This document couldn't be found. It may have been deleted.",
          422: "Couldn't generate flashcards from this document — it may be too short or unreadable.",
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcards();
  }, [id]);

  const handlePrev = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  const handleNext = () => {
    if (current < flashcards.length - 1) {
      setCurrent(c => c + 1);
    } else {
      setDone(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setDone(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center"><SpinnerIcon /></div>
          <p className="font-inter text-[14px] text-slate-500">Generating flashcards from your document…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-inter text-[14px]">⚠️ {error}</p>
          <button onClick={() => navigate("/dashboard")}
            className="text-blue font-inter text-[13px] underline">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Empty result — API succeeded but produced no cards. Without this
  // guard, the component below would crash trying to render flashcards[0]. ──
  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.10)] p-10 w-full max-w-[440px] text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl mx-auto mb-6">🃏</div>
          <h2 className="font-syne font-extrabold text-[20px] text-navy mb-2">No flashcards generated</h2>
          <p className="font-inter text-[14px] text-slate-500 mb-8 leading-relaxed">
            We couldn't create flashcards from this document. It may be too short, image-only, or missing readable text.
          </p>
          <button onClick={() => navigate("/dashboard")}
            className="w-full py-4 rounded-[12px] border-[1.5px] border-slate-200 bg-white font-syne font-bold text-[15px] text-navy cursor-pointer hover:border-blue-300 hover:text-blue transition-all duration-200">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.10)] p-10 w-full max-w-[440px] text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl mx-auto mb-6">🎉</div>
          <h2 className="font-syne font-extrabold text-[24px] text-navy mb-2">All done!</h2>
          <p className="font-inter text-[14px] text-slate-500 mb-8">
            You've reviewed all <strong>{flashcards.length}</strong> flashcards.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleRestart}
              className="w-full py-4 rounded-[12px] bg-gradient-to-br from-green-400 to-green-500 font-syne font-bold text-[15px] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(34,197,94,0.25)] hover:-translate-y-0.5 transition-all duration-200">
              Review Again
            </button>
            <button onClick={() => navigate("/dashboard")}
              className="w-full py-4 rounded-[12px] border-[1.5px] border-slate-200 bg-white font-syne font-bold text-[15px] text-navy cursor-pointer hover:border-blue-300 hover:text-blue transition-all duration-200">
              ← Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-offwhite dot-bg flex flex-col">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-[66px] flex items-center justify-between px-[5%] bg-white/95 backdrop-blur-xl shadow-[0_1px_20px_rgba(10,22,40,0.07)] border-b border-slate-100">
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-slate-500 hover:text-navy font-inter text-[13px] transition-colors">
          <BackIcon /> Dashboard
        </button>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-50 border border-green-100">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="font-inter text-[12.5px] text-green-700 font-medium">
            {flashcards.length} flashcards
          </span>
        </div>
        <div className="w-20" /> {/* spacer */}
      </nav>

      {/* Header */}
      <div className="px-[5%] pt-8 pb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl mx-auto mb-3">🃏</div>
        <h1 className="font-syne font-extrabold text-[24px] text-navy">Flashcards</h1>
        <p className="font-inter text-[13px] text-slate-500 mt-1">Tap a card to flip it</p>
      </div>

      {/* Progress bar */}
      <div className="px-[5%] mb-8">
        <div className="max-w-[560px] mx-auto h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / flashcards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-[5%]">
        <Flashcard
          card={flashcards[current]}
          index={current}
          total={flashcards.length}
        />
      </div>

      {/* Navigation buttons */}
      <div className="px-[5%] py-8">
        <div className="max-w-[560px] mx-auto flex gap-3">
          <button
            onClick={handlePrev}
            disabled={current === 0}
            className="flex-1 py-4 rounded-[12px] border-[1.5px] border-slate-200 bg-white font-syne font-bold text-[15px] text-navy cursor-pointer hover:border-slate-300 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-4 rounded-[12px] bg-gradient-to-br from-green-400 to-green-500 font-syne font-bold text-[15px] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(34,197,94,0.25)] hover:-translate-y-0.5 transition-all duration-200"
          >
            {current === flashcards.length - 1 ? "Finish 🎉" : "Next →"}
          </button>
        </div>
      </div>

    </div>
  );
}