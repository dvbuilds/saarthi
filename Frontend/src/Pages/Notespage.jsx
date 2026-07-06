import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJobPolling } from "../hooks/useJobPolling.js";

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
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function TopicCard({ topic, points, index, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    const text = `${topic}\n${points.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(10,22,40,0.06)] overflow-hidden transition-all duration-200 hover:shadow-[0_8px_24px_rgba(10,22,40,0.09)]`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left"
      >
        <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center font-syne font-bold text-[13px] text-orange-600 shrink-0">
          {index + 1}
        </div>
        <h3 className="flex-1 font-syne font-bold text-[16px] text-navy">{topic}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-inter text-[11px] text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-all duration-200 flex items-center gap-1"
          >
            <CopyIcon />
            {copied ? "Copied!" : "Copy"}
          </button>
          <span className="text-[11px] font-inter text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            {points.length} pts
          </span>
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="px-6 pb-5 border-t border-slate-100 pt-4 flex flex-col gap-2.5">
          {points.map((point, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center font-syne font-bold text-[10px] text-orange-600 shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="font-inter text-[14px] text-slate-700 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { result, loading, error, progress } = useJobPolling(`/notes/${id}`);
  const notes = result || [];
  const isStillGenerating = loading && notes.length > 0;

  const [search, setSearch] = useState("");
  const [allExpanded, setAllExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredNotes = notes.filter(n =>
    n.topic.toLowerCase().includes(search.toLowerCase()) ||
    n.points.some(p => p.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCopyAll = () => {
    const text = notes.map((n, i) =>
      `${i + 1}. ${n.topic}\n${n.points.map((p, j) => `   ${j + 1}. ${p}`).join("\n")}`
    ).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading (nothing generated yet) ────────────────────────────────────────
  // Only show the full-page spinner before the FIRST batch of notes lands.
  // Once notes start streaming in, we fall through to the Main view below.
  if (loading && notes.length === 0) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center"><SpinnerIcon /></div>
          <p className="font-inter text-[14px] text-slate-500">Generating structured notes…</p>
          <p className="font-inter text-[12px] text-slate-400">
            {progress.total > 0
              ? `Processing section ${progress.completed} of ${progress.total}…`
              : "This can take a bit longer for larger documents"}
          </p>
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

  // ── Empty result (job finished but produced nothing) ───────────────────────
  if (!loading && notes.length === 0) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.10)] p-10 w-full max-w-[440px] text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl mx-auto mb-6">✨</div>
          <h2 className="font-syne font-extrabold text-[20px] text-navy mb-2">No notes generated</h2>
          <p className="font-inter text-[14px] text-slate-500 mb-8 leading-relaxed">
            We couldn't create notes from this document. It may be too short, image-only, or missing readable text.
          </p>
          <button onClick={() => navigate("/dashboard")}
            className="w-full py-4 rounded-[12px] border-[1.5px] border-slate-200 bg-white font-syne font-bold text-[15px] text-navy cursor-pointer hover:border-blue-300 hover:text-blue transition-all duration-200">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main (renders as soon as we have any notes, even mid-generation) ───────
  return (
    <div className="min-h-screen bg-offwhite dot-bg flex flex-col">

      <nav className="sticky top-0 z-50 h-[66px] flex items-center justify-between px-[5%] bg-white/95 backdrop-blur-xl shadow-[0_1px_20px_rgba(10,22,40,0.07)] border-b border-slate-100">
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-slate-500 hover:text-navy font-inter text-[13px] transition-colors">
          <BackIcon /> Dashboard
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100">
          <span className={`w-1.5 h-1.5 rounded-full bg-orange-500 ${isStillGenerating ? "animate-pulse" : ""}`} />
          <span className="font-inter text-[12.5px] text-orange-700 font-medium">
            {isStillGenerating
              ? `${notes.length} topics so far…`
              : `${notes.length} topics`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAllExpanded(e => !e)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-inter text-[12px] text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-all duration-200"
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white font-inter text-[12px] text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-all duration-200"
          >
            <CopyIcon />
            {copied ? "Copied!" : "Copy all"}
          </button>
        </div>
      </nav>

      <div className="px-[5%] pt-8 pb-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl mx-auto mb-3">✨</div>
        <h1 className="font-syne font-extrabold text-[24px] text-navy">Study Notes</h1>
        <p className="font-inter text-[13px] text-slate-500 mt-1">Topic-wise notes generated from your PDF</p>

        {isStillGenerating && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <SpinnerIcon />
            <p className="font-inter text-[12.5px] text-slate-400">
              {progress.total > 0
                ? `Still generating — section ${progress.completed} of ${progress.total}`
                : "More topics on the way…"}
            </p>
          </div>
        )}
      </div>

      <div className="px-[5%] mb-6">
        <div className="max-w-[720px] mx-auto relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics or points…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border-[1.5px] border-slate-200 bg-white font-inter text-[14px] text-navy placeholder:text-slate-400 focus:outline-none focus:border-orange-400 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-[5%] pb-12">
        <div className="max-w-[720px] mx-auto flex flex-col gap-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-inter text-[14px]">
              No topics match "{search}"
            </div>
          ) : (
            filteredNotes.map((note, i) => (
              <TopicCard
                key={i}
                index={i}
                topic={note.topic}
                points={note.points}
                defaultOpen={allExpanded || i === 0}
              />
            ))
          )}
        </div>
      </div>

      <div className="sticky bottom-0 px-[5%] py-5 bg-white/90 backdrop-blur-xl border-t border-slate-100">
        <div className="max-w-[720px] mx-auto flex gap-3">
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="flex-1 py-3.5 rounded-[12px] border-[1.5px] border-blue-200 bg-blue-50 font-syne font-semibold text-[14px] text-blue hover:bg-blue-100 transition-all duration-200"
          >
            💬 Ask questions about this doc
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 py-3.5 rounded-[12px] border-[1.5px] border-slate-200 bg-white font-syne font-semibold text-[14px] text-navy hover:border-slate-300 transition-all duration-200"
          >
            ← Dashboard
          </button>
        </div>
      </div>

    </div>
  );
}