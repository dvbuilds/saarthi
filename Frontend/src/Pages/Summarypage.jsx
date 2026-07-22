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

export default function SummaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { result, loading, error } = useJobPolling(`/summary/${id}`);
  const summary = result || [];

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = summary.map((p, i) => `${i + 1}. ${p}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center"><SpinnerIcon /></div>
          <p className="font-inter text-[14px] text-slate-500">Summarizing your document…</p>
          <p className="font-inter text-[12px] text-slate-400">This can take a bit longer for larger documents</p>
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

  // ── Empty result ──────────────────────────────────────────────────────────
  if (summary.length === 0) {
    return (
      <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.10)] p-10 w-full max-w-[440px] text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-3xl mx-auto mb-6">📊</div>
          <h2 className="font-syne font-extrabold text-[20px] text-navy mb-2">No summary generated</h2>
          <p className="font-inter text-[14px] text-slate-500 mb-8 leading-relaxed">
            We couldn't summarize this document. It may be too short, image-only, or missing readable text.
          </p>
          <button onClick={() => navigate("/dashboard")}
            className="w-full py-4 rounded-[12px] border-[1.5px] border-slate-200 bg-white font-syne font-bold text-[15px] text-navy cursor-pointer hover:border-blue-300 hover:text-blue transition-all duration-200">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-offwhite dot-bg flex flex-col">

      <nav className="sticky top-0 z-50 h-[66px] flex items-center justify-between px-[5%] bg-white/95 backdrop-blur-xl shadow-[0_1px_20px_rgba(10,22,40,0.07)] border-b border-slate-100">
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-slate-500 hover:text-navy font-inter text-[13px] transition-colors">
          <BackIcon /> Dashboard
        </button>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-100">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span className="font-inter text-[12.5px] text-purple-700 font-medium">
            {summary.length} key points
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white font-inter text-[13px] text-slate-600 hover:border-purple-300 hover:text-purple-700 transition-all duration-200"
        >
          <CopyIcon />
          {copied ? "Copied!" : "Copy all"}
        </button>
      </nav>

      <div className="px-[5%] pt-8 pb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl mx-auto mb-3">📊</div>
        <h1 className="font-syne font-extrabold text-[24px] text-navy">Document Summary</h1>
        <p className="font-inter text-[13px] text-slate-500 mt-1">Key points extracted from your PDF</p>
      </div>

      <div className="px-[5%] pb-12">
        <div className="max-w-[720px] mx-auto flex flex-col gap-4">
          {summary.map((point, i) => (
            <div
              key={i}
              className="flex gap-4 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(10,22,40,0.06)] px-6 py-5 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,22,40,0.09)] transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center font-syne font-bold text-[13px] text-purple-600 shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="font-inter text-[15px] text-navy leading-relaxed">{point}</p>
            </div>
          ))}
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