import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api.js";
import { getErrorMessage } from "../utils/getErrorMessage.js";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const [form,     setForm]     = useState({ email:"", password:"" });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const navigate = useNavigate();

  const handleChange = e => { setForm({...form, [e.target.name]: e.target.value}); setError(""); };

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }

    // Basic client-side email sanity check — catches typos before hitting the server
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) { setError("Please enter a valid email address."); return; }

    setLoading(true); setError("");
    try {
      await API.post("/users/login", form);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, {
        400: "Please enter both your email and password.",
        401: "Incorrect email or password. Please try again.",
        404: "No account found with this email. Check the address or sign up.",
        429: "Too many login attempts. Please wait a moment and try again.",
      }));
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
          <a href="#" className="font-inter text-[13px] text-blue font-medium no-underline hover:underline">Forgot password?</a>
        </div>

        <button onClick={handleSubmit} disabled={loading}
                className={`w-full py-4 rounded-[12px] bg-gradient-to-br from-blue to-blue-dark font-syne font-semibold text-[16px] text-white border-none cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_18px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:shadow-[0_8px_26px_rgba(37,99,235,0.38)] transition-all duration-250 ${loading?"opacity-75":""}`}>
          {loading
            ? <><div className="w-[18px] h-[18px] rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />Signing in...</>
            : "Sign In →"}
        </button>

        <div className="flex items-center gap-4 my-7">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="font-inter text-[13px] text-slate-400">or continue with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button className="w-full py-3.5 rounded-[12px] border-[1.5px] border-slate-200 bg-white flex items-center justify-center gap-2.5 font-inter text-[15px] font-medium text-slate-700 cursor-pointer hover:border-slate-400 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all duration-200">
          <GoogleIcon />
          Continue with Google
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
              "Saarthi helped me prepare for my semester exam in half the time. The quiz feature is amazing!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center font-syne font-bold text-[13px] text-white">PS</div>
              <div>
                <p className="font-syne font-semibold text-[13px] text-white">Priya Sharma</p>
                <p className="font-inter text-[11px] text-slate-500">B.Tech CSE · 3rd Year</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}