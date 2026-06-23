import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api.js";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.password || !form.confirm) { setError("Please fill in all fields."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      await API.post("/users/register", {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT — Light visual panel (mirrors landing hero) ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center bg-offwhite dot-bg">

        {/* colour washes */}
        <div className="absolute top-[-8%] left-[-5%] w-[420px] h-[420px] rounded-full bg-blue/10 blur-[70px] pointer-events-none" />
        <div className="absolute bottom-[-6%] right-[-4%] w-[340px] h-[340px] rounded-full bg-yellow/10 blur-[70px] pointer-events-none" />

        {/* Floating feature cards */}
        {[
          { icon: "💬", title: "Chat with PDF", desc: "Ask questions, get precise answers.", cls: "top-[12%] left-[6%]", delay: "0s" },
          { icon: "🃏", title: "Flashcards", desc: "AI-crafted cards from your study material.", cls: "top-[14%] right-[8%]", delay: "1s" },
          { icon: "📝", title: "Smart Quiz", desc: "Auto-generated MCQs to test your knowledge.", cls: "bottom-[22%] left-[5%]", delay: "1.8s" },
          { icon: "📊", title: "Summary", desc: "Dense PDFs turned into clean summaries.", cls: "bottom-[15%] right-[6%]", delay: "0.7s" },
        ].map((c, i) => (
          <div key={i} style={{ animationDelay: c.delay }}
            className={`absolute ${c.cls} bg-white rounded-2xl px-4 py-3.5 w-[200px] border border-slate-100 shadow-[0_8px_28px_rgba(10,22,40,0.09)] animate-float`}>
            <div className="text-2xl mb-1.5 leading-none">{c.icon}</div>
            <p className="font-syne font-bold text-[13px] text-navy mb-1">{c.title}</p>
            <p className="font-inter text-[11px] text-slate-500 leading-snug">{c.desc}</p>
          </div>
        ))}

        {/* Central illustration */}
        <div className="relative z-10 text-center px-12 max-w-[400px]">
          <div className="w-[96px] h-[96px] rounded-[26px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-[44px] mx-auto mb-8 shadow-[0_20px_50px_rgba(37,99,235,0.28)] leading-none">🎓</div>
          <h2 className="font-syne font-extrabold text-[32px] text-navy leading-[1.2] mb-4">
            Start learning<br />smarter today
          </h2>
          <p className="font-inter text-[16px] text-slate-500 leading-relaxed mb-8">
            Join thousands of students who already use Saarthi to study faster and remember more.
          </p>

          <div className="flex justify-center gap-8 mb-9">
            {[["10×", "Faster studying"], ["5+", "AI tools"], ["Free", "Forever plan"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="font-syne font-extrabold text-[24px] text-blue">{v}</p>
                <p className="font-inter text-[12px] text-slate-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          {/* Progress mini-card */}
          <div className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-[0_6px_20px_rgba(10,22,40,0.07)] text-left">
            <p className="font-syne font-bold text-[11px] text-slate-400 tracking-wider mb-3">STUDY PROGRESS</p>
            {[["💬 Chat with PDF", "78%", "bg-blue"], ["🃏 Flashcards", "55%", "bg-yellow"], ["📝 Quiz", "91%", "bg-green-500"]].map(([lbl, pct, col]) => (
              <div key={lbl} className="mb-2.5">
                <div className="flex justify-between mb-1">
                  <span className="font-inter text-[12px] text-navy">{lbl}</span>
                  <span className="font-inter text-[11px] text-slate-400">{pct}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${col} rounded-full`} style={{ width: pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form ── */}
      <div className="w-full lg:w-[500px] shrink-0 bg-white flex flex-col justify-center px-12 py-10 relative z-10 shadow-[-4px_0_32px_rgba(10,22,40,0.07)]">

        <Link to="/" className="flex items-center gap-2.5 no-underline mb-8">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-lg leading-none">📚</div>
          <span className="font-syne font-extrabold text-[22px] text-navy">Saarthi</span>
        </Link>

        <h1 className="font-syne font-extrabold text-[32px] text-navy mb-2">Create your account</h1>
        <p className="font-inter text-[15px] text-slate-500 leading-relaxed mb-7">
          Free forever. Start learning smarter in under a minute.
        </p>

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
            <span className="text-base">✅</span>
            <span className="font-inter text-[14px] text-green-700">Account created! Redirecting to sign in…</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <span className="text-base">⚠️</span>
            <span className="font-inter text-[14px] text-red-600">{error}</span>
          </div>
        )}

        {/* Full name */}
        <div className="mb-4">
          <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">Full name</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">👤</span>
            <input type="text" name="fullName" placeholder="Priya Sharma"
              value={form.fullName} onChange={handleChange} className="s-input" />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">Email address</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">✉️</span>
            <input type="email" name="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} className="s-input" />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">Password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">🔑</span>
            <input type={showPass ? "text" : "password"} name="password" placeholder="Min. 6 characters"
              value={form.password} onChange={handleChange} className="s-input pr-12" />
            <button onClick={() => setShowPass(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base opacity-50 hover:opacity-80 transition-opacity p-0">
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Confirm */}
        <div className="mb-7">
          <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">Confirm password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">🔒</span>
            <input type={showPass ? "text" : "password"} name="confirm" placeholder="Repeat your password"
              value={form.confirm} onChange={handleChange}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} className="s-input" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || success}
          className={`w-full py-4 rounded-[12px] bg-gradient-to-br from-yellow to-yellow-dark font-syne font-bold text-[16px] text-navy border-none cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_18px_rgba(245,158,11,0.28)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(245,158,11,0.38)] transition-all duration-250 ${loading || success ? "opacity-75 cursor-not-allowed" : ""}`}>
          {loading
            ? <><div className="w-[18px] h-[18px] rounded-full border-2 border-navy/30 border-t-navy animate-spin-slow" />Creating account...</>
            : "Create Account →"}
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="font-inter text-[13px] text-slate-400">or sign up with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button className="w-full py-3.5 rounded-[12px] border-[1.5px] border-slate-200 bg-white flex items-center justify-center gap-2.5 font-inter text-[15px] font-medium text-slate-700 cursor-pointer hover:border-slate-400 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all duration-200">
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="text-center font-inter text-[14px] text-slate-500 mt-7">
          Already have an account?{" "}
          <Link to="/login" className="text-blue font-semibold no-underline hover:underline">Sign in →</Link>
        </p>
        <p className="text-center font-inter text-[12px] text-slate-400 mt-4 leading-relaxed">
          By creating an account you agree to our{" "}
          <a href="#" className="text-blue no-underline hover:underline">Terms</a> and{" "}
          <a href="#" className="text-blue no-underline hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}