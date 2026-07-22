import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/getErrorMessage.js";

export default function LoginPage() {
  const [form,     setForm]     = useState({ email:"", password:"" });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = e => { setForm({...form, [e.target.name]: e.target.value}); setError(""); };

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }

    // Basic client-side email sanity check — catches typos before hitting the server
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) { setError("Please enter a valid email address."); return; }

    setLoading(true); setError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === 'AUTH_SYNC_ERROR') {
        setError(err.message);
      } else {
        setError(getErrorMessage(err, {
          400: "Please enter both your email and password.",
          401: "Incorrect email or password. Please try again.",
          404: "No account found with this email. Check the address or sign up.",
          429: "Too many login attempts. Please wait a moment and try again.",
        }));
      }
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT — Form ── */}
      <div className="w-full lg:w-[480px] shrink-0 bg-white flex flex-col justify-center px-12 py-14 relative z-10 shadow-[4px_0_32px_rgba(10,22,40,0.07)]">

        <Link to="/" className="flex items-center gap-2.5 no-underline mb-12">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-lg leading-none">📚</div>
          <span className="font-syne font-extrabold text-[22px] text-navy">Saarthi</span>
        </Link>

        <h1 className="font-syne font-extrabold text-[34px] text-navy mb-2">Welcome back!</h1>
        <p className="font-inter text-[15px] text-slate-500 leading-relaxed mb-8">
          Sign in to continue your AI-powered study session.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <span className="text-base">⚠️</span>
            <span className="font-inter text-[14px] text-red-600">{error}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">Email address</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">✉️</span>
            <input type="email" name="email" placeholder="you@example.com"
                   value={form.email} onChange={handleChange}
                   onKeyDown={e => e.key==="Enter" && handleSubmit()}
                   className="s-input" />
          </div>
        </div>

        <div className="mb-2">
          <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">Password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">🔑</span>
            <input type={showPass?"text":"password"} name="password" placeholder="Enter your password"
                   value={form.password} onChange={handleChange}
                   onKeyDown={e => e.key==="Enter" && handleSubmit()}
                   className="s-input pr-12" />
            <button onClick={()=>setShowPass(p=>!p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base opacity-50 hover:opacity-80 transition-opacity p-0">
              {showPass?"🙈":"👁️"}
            </button>
          </div>
        </div>

        <div className="text-right mb-7">
          <Link to="/forgot-password" className="font-inter text-[13px] text-blue font-medium no-underline hover:underline">Forgot password?</Link>
        </div>

        <button onClick={handleSubmit} disabled={loading}
                className={`w-full py-4 rounded-[12px] bg-gradient-to-br from-blue to-blue-dark font-syne font-semibold text-[16px] text-white border-none cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_18px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:shadow-[0_8px_26px_rgba(37,99,235,0.38)] transition-all duration-250 ${loading?"opacity-75":""}`}>
          {loading
            ? <><div className="w-[18px] h-[18px] rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />Signing in...</>
            : "Sign In →"}
        </button>

        <p className="text-center font-inter text-[14px] text-slate-500 mt-7">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue font-semibold no-underline hover:underline">Create one free →</Link>
        </p>
      </div>

      {/* ── RIGHT — Dark Visual Panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center bg-gradient-to-br from-navy via-navy-mid to-navy">

        {/* dot grid */}
        <div className="absolute inset-0 dot-bg opacity-60" />

        {/* glow orbs */}
        <div className="absolute top-[15%] left-[15%] w-[320px] h-[320px] rounded-full bg-blue/15 blur-[60px] pointer-events-none" />
        <div className="absolute bottom-[12%] right-[12%] w-[280px] h-[280px] rounded-full bg-yellow/12 blur-[60px] pointer-events-none" />

        {/* Floating PDF pills */}
        {[
          {label:"Physics.pdf",  pages:"42 pages", cls:"top-[10%] left-[8%]",     delay:"0s"  },
          {label:"Math Notes",   pages:"28 pages", cls:"top-[30%] right-[6%]",    delay:"1.2s"},
          {label:"History.pdf",  pages:"65 pages", cls:"bottom-[24%] left-[7%]",  delay:"2s"  },
          {label:"Biology.pdf",  pages:"53 pages", cls:"bottom-[10%] right-[5%]", delay:"0.6s"},
        ].map((d,i)=>(
          <div key={i} style={{animationDelay:d.delay}}
               className={`absolute ${d.cls} glass rounded-2xl px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.28)] animate-float flex items-center gap-2.5`}>
            <div className="w-9 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-base leading-none">📄</div>
            <div>
              <p className="font-syne font-semibold text-[12px] text-white leading-none mb-0.5">{d.label}</p>
              <p className="font-inter text-[10px] text-slate-400">{d.pages}</p>
            </div>
          </div>
        ))}

        {/* Central content */}
        <div className="relative z-10 text-center px-12 max-w-[420px]">
          <div className="w-[88px] h-[88px] rounded-[24px] bg-gradient-to-br from-yellow to-yellow-dark flex items-center justify-center text-[40px] mx-auto mb-8 shadow-[0_20px_48px_rgba(245,158,11,0.35)] leading-none">📚</div>
          <h2 className="font-syne font-extrabold text-[32px] text-white leading-[1.2] mb-4">
            Your AI study<br />companion awaits
          </h2>
          <p className="font-inter text-[16px] text-slate-400 leading-relaxed mb-8">
            Upload any PDF and get quizzes, flashcards, summaries, and a smart chat — all powered by AI.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5 mb-9">
            {["💬 Chat","🃏 Flashcards","📝 Quiz","📊 Summary","✨ Notes"].map(f=>(
              <span key={f} className="px-4 py-2 rounded-full bg-white/[0.08] border border-white/[0.12] font-inter text-[13px] text-slate-300">
                {f}
              </span>
            ))}
          </div>

          <div className="glass rounded-2xl px-6 py-5 text-left">
            <p className="font-inter text-[14px] text-slate-300 italic leading-relaxed mb-4">
              "Chat with PDF is like having a tutor inside my document. I ask, it answers — accurate every time."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center font-syne font-bold text-[13px] text-white">RV</div>
              <div>
                <p className="font-syne font-semibold text-[13px] text-white">Rahul Verma</p>
                <p className="font-inter text-[11px] text-slate-500">MBA Student</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}