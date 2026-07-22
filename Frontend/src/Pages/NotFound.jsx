import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.10)] p-10 w-full max-w-[440px] text-center">
        <Link to="/" className="flex items-center justify-center gap-2.5 no-underline mb-8">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-lg leading-none">📚</div>
          <span className="font-syne font-extrabold text-[22px] text-navy">Saarthi</span>
        </Link>
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-6">
          🧭
        </div>
        <h1 className="font-syne font-extrabold text-[26px] text-navy mb-2">Page not found</h1>
        <p className="font-inter text-[14px] text-slate-500 mb-8 leading-relaxed">
          Lost? This page doesn't exist — but your study material is still right where you left it.
        </p>
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="inline-block w-full py-4 rounded-[12px] bg-gradient-to-br from-blue to-blue-dark font-syne font-bold text-[15px] text-white no-underline shadow-[0_4px_14px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 transition-all duration-200"
        >
          ← Head back to {isAuthenticated ? "your dashboard" : "the homepage"}
        </Link>
      </div>
    </div>
  );
}
