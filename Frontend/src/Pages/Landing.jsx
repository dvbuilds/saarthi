import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_LINKS = ["Features", "How It Works", "Testimonials"];

const FEATURES = [
  { icon:"💬", title:"Chat with PDF",  desc:"Ask anything and get precise answers sourced directly from your document — no hallucinations.",     bg:"bg-blue-50",   },
  { icon:"📝", title:"Smart Quiz",     desc:"Auto-generate MCQs from any chapter. Test yourself before your test tests you.",                     bg:"bg-amber-50",  },
  { icon:"🃏", title:"Flashcards",     desc:"Key concepts distilled into bite-sized cards. Review, flip, retain — without making them by hand.",  bg:"bg-green-50",  },
  { icon:"📊", title:"Summary",        desc:"One upload, one clean summary. Cut through 80 pages of dense text in under 10 seconds.",             bg:"bg-purple-50", },
  { icon:"✨", title:"Generate Notes", desc:"Turn raw PDF text into well-structured, topic-wise notes formatted for your study workflow.",         bg:"bg-orange-50", },
];

const STEPS = [
  { n:"01", icon:"📤", title:"Upload your PDF",    desc:"Drop in any textbook chapter, research paper, or study material — any PDF works.", yellow:false },
  { n:"02", icon:"🎯", title:"Pick your tool",     desc:"Choose Chat, Quiz, Flashcards, Summary, or Notes based on what your study session needs.", yellow:true },
  { n:"03", icon:"🚀", title:"Learn effortlessly", desc:"Saarthi's AI processes your document and delivers exactly what you need, instantly.", yellow:false },
];

const TESTIMONIALS = [
  { init:"PS", name:"Priya Sharma",  role:"B.Tech CSE · 3rd Year",    text:"Saarthi turned my 80-page paper into a quiz under a minute. Exam prep has never felt this easy." },
  { init:"RV", name:"Rahul Verma",   role:"MBA Student",               text:"Chat with PDF is like having a tutor inside my document. I ask, it answers — accurate every time." },
  { init:"AR", name:"Ananya Roy",    role:"Competitive Exam Aspirant", text:"Flashcards from my own material — exactly what I needed. My retention has improved a lot." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeat, setActiveFeat] = useState(0);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 28);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveFeat(p => (p + 1) % FEATURES.length), 2600);
    return () => clearInterval(t);
  }, []);

  // Wait for the auth check to finish before deciding whether to redirect —
  // otherwise a logged-in user briefly sees the landing page flash before bouncing.
  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-white text-navy overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 h-[66px] flex items-center justify-between px-[5%] transition-all duration-300
        ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-[0_1px_20px_rgba(10,22,40,0.07)] border-b border-slate-100" : "bg-transparent"}`}>

        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-lg leading-none">📚</div>
          <span className="font-syne font-extrabold text-[22px] text-navy">Saarthi</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(n => (
            <a key={n} href={`#${n.toLowerCase().replace(/ /g,"-")}`}
               className="font-inter text-[14px] font-medium text-slate-500 no-underline hover:text-blue transition-colors duration-200">
              {n}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login"
                className="px-5 py-2 rounded-[10px] border border-slate-200 font-syne font-semibold text-[14px] text-navy no-underline bg-white hover:border-blue hover:text-blue transition-all duration-200">
            Sign in
          </Link>
          <Link to="/register"
                className="px-5 py-2 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark font-syne font-semibold text-[14px] text-white no-underline shadow-[0_4px_14px_rgba(37,99,235,0.30)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(37,99,235,0.40)] transition-all duration-200">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-[5%] overflow-hidden bg-offwhite dot-bg">

        {/* colour washes */}
        <div className="pointer-events-none absolute top-[-8%] left-[-5%] w-[520px] h-[520px] rounded-full bg-blue/10 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-[-6%] right-[-4%] w-[420px] h-[420px] rounded-full bg-yellow/10 blur-[80px]" />

        {/* Floating PDF pills — top-left */}
        <div className="absolute top-[12%] left-[3%] hidden lg:flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3 shadow-[0_8px_28px_rgba(10,22,40,0.10)] border border-slate-100 animate-float">
          <div className="w-9 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-base leading-none">📄</div>
          <div>
            <p className="font-syne font-semibold text-[13px] text-navy leading-none mb-0.5">Physics.pdf</p>
            <p className="font-inter text-[11px] text-slate-400">42 pages</p>
          </div>
        </div>

        {/* Floating PDF pill — top-right area (Today's Tasks widget) */}
        <div className="absolute top-[13%] right-[17%] hidden xl:block bg-white rounded-2xl px-5 py-4 shadow-[0_8px_28px_rgba(10,22,40,0.10)] border border-slate-100 animate-float-alt"
             style={{animationDelay:"0.8s"}}>
          <p className="font-syne font-bold text-[11px] text-slate-400 mb-2.5 tracking-wider">TODAY'S TASKS</p>
          {[["💬 Chat with PDF","87%","bg-blue"],["📝 Generate Quiz","62%","bg-yellow"]].map(([lbl,pct,col])=>(
            <div key={lbl} className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="font-inter text-[12px] text-navy">{lbl}</span>
                <span className="font-inter text-[11px] text-slate-400">{pct}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-[180px]">
                <div className={`h-full ${col} rounded-full`} style={{width:pct}} />
              </div>
            </div>
          ))}
        </div>

        {/* Floating flashcard badge — bottom-left */}
        <div className="absolute bottom-[22%] left-[14%] hidden xl:block bg-white rounded-2xl px-4 py-3 shadow-[0_8px_28px_rgba(10,22,40,0.10)] border border-slate-100 animate-float"
             style={{animationDelay:"1.5s"}}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg leading-none">🃏</span>
            <span className="font-syne font-bold text-[13px] text-navy">12 Flashcards</span>
          </div>
          <p className="font-inter text-[11px] text-slate-400">Generated just now</p>
        </div>

        {/* Powered-by badge — bottom-right */}
        <div className="absolute bottom-[20%] right-[13%] hidden xl:flex flex-col items-center gap-2 bg-white rounded-2xl px-5 py-4 shadow-[0_8px_28px_rgba(10,22,40,0.10)] border border-slate-100 animate-float-alt"
             style={{animationDelay:"0.3s"}}>
          <p className="font-syne font-bold text-[11px] text-slate-400 tracking-wider">POWERED BY</p>
          <div className="flex gap-2 text-2xl">🤖✨📡</div>
          <p className="font-inter text-[11px] text-slate-500">Google Gemini AI</p>
        </div>

        {/* Central text */}
        <div className="relative z-10 text-center max-w-[760px]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow/10 border border-yellow/30 mb-7 animate-fade-up">
            <span className="text-[12px]">✨</span>
            <span className="font-inter text-[13px] font-medium text-yellow-dark">AI-Powered Study Companion</span>
          </div>

          <h1 className="font-syne font-extrabold leading-[1.08] mb-6 animate-fade-up delay-1"
              style={{fontSize:"clamp(42px,7vw,80px)"}}>
            Upload, ask,{" "}
            <span className="text-slate-300">and ace</span>
            <br />
            <span className="bg-gradient-to-r from-blue to-blue-dark bg-clip-text text-transparent">
              every exam
            </span>
          </h1>

          <p className="font-inter  text-[18px] leading-relaxed text-slate-500 max-w-[600px] mx-auto mb-10 animate-fade-up delay-2 translate-x-20">
            Turn any PDF into quizzes, flashcards, summaries, notes, and a smart chat — all in one place.
          </p>

          <div className="flex items-center justify-center gap-4 mb-14 animate-fade-up delay-3">
            <Link to="/register"
                  className="px-8 py-4 rounded-[13px] bg-gradient-to-br from-yellow to-yellow-dark font-syne font-bold text-[16px] text-navy no-underline shadow-[0_8px_28px_rgba(245,158,11,0.32)] hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(245,158,11,0.42)] transition-all duration-250">
              Get free demo →
            </Link>
            <a href="#how-it-works"
               className="px-7 py-4 rounded-[13px] border-2 border-slate-200 font-syne font-semibold text-[16px] text-slate-600 no-underline bg-white hover:border-blue hover:text-blue transition-all duration-200">
              How it works
            </a>
          </div>

          <div className="flex justify-center gap-12 animate-fade-up delay-4">
            {[["10×","Faster studying"],["5+","AI-powered tools"],["100%","Your data, private"]].map(([v,l])=>(
              <div key={l} className="text-center">
                <p className="font-syne font-extrabold text-[28px] text-blue">{v}</p>
                <p className="font-inter text-[13px] text-slate-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-[5%] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 font-inter text-[13px] text-blue font-medium mb-5">
              Features
            </div>
            <h2 className="font-syne font-extrabold text-[42px] text-navy mb-4">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-blue to-blue-dark bg-clip-text text-transparent">ace your studies</span>
            </h2>
            <p className="font-inter text-[17px] text-slate-500 max-w-[480px] mx-auto">
              Five powerful AI tools. One simple upload.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                   className="group bg-white rounded-[20px] p-8 border-[1.5px] border-slate-100 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(10,22,40,0.09)] hover:border-blue-100 transition-all duration-300 cursor-default">
                <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center text-2xl mb-5`}>{f.icon}</div>
                <h3 className="font-syne font-bold text-[20px] text-navy mb-3">{f.title}</h3>
                <p className="font-inter text-[15px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 px-[5%] bg-slate-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex px-4 py-1.5 rounded-full bg-yellow/10 border border-yellow/30 font-inter text-[13px] text-yellow-dark font-medium mb-5">
              How It Works
            </div>
            <h2 className="font-syne font-extrabold text-[42px] text-navy">
              Three steps to smarter studying
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s,i) => (
              <div key={s.n} className="text-center px-6 py-10">
                <div className={`w-20 h-20 rounded-[22px] mx-auto mb-6 flex items-center justify-center text-[32px]
                  ${s.yellow
                    ? "bg-gradient-to-br from-yellow to-yellow-dark shadow-[0_12px_32px_rgba(245,158,11,0.28)]"
                    : "bg-gradient-to-br from-navy to-navy-mid shadow-[0_12px_32px_rgba(10,22,40,0.20)]"
                  }`}>{s.icon}</div>
                <p className={`font-syne text-[12px] font-bold tracking-widest mb-3 ${s.yellow ? "text-yellow" : "text-blue"}`}>
                  STEP {s.n}
                </p>
                <h3 className="font-syne font-bold text-[22px] text-navy mb-3">{s.title}</h3>
                <p className="font-inter text-[15px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-28 px-[5%] bg-navy">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex px-4 py-1.5 rounded-full bg-yellow/10 border border-yellow/30 font-inter text-[13px] text-yellow font-medium mb-5">
              Testimonials
            </div>
            <h2 className="font-syne font-extrabold text-[42px] text-white">Students love Saarthi</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name}
                   className="glass rounded-[20px] p-8 hover:bg-white/[0.09] hover:border-yellow/30 transition-all duration-300">
                <p className="text-yellow text-[22px] mb-4">★★★★★</p>
                <p className="font-inter text-[15px] text-slate-300 leading-[1.75] mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center font-syne font-bold text-[14px] text-white">
                    {t.init}
                  </div>
                  <div>
                    <p className="font-syne font-semibold text-[14px] text-white">{t.name}</p>
                    <p className="font-inter text-[12px] text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-[5%] bg-white text-center">
        <div className="max-w-[640px] mx-auto">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-[32px] mx-auto mb-7 shadow-[0_16px_40px_rgba(37,99,235,0.28)] leading-none">📚</div>
          <h2 className="font-syne font-extrabold text-[48px] text-navy mb-5">Ready to study smarter?</h2>
          <p className="font-inter text-[18px] text-slate-500 leading-relaxed mb-10">
            Join thousands of students using Saarthi to understand study material faster and deeper.
          </p>
          <Link to="/register"
                className="inline-block px-12 py-5 rounded-[14px] bg-gradient-to-br from-yellow to-yellow-dark font-syne font-bold text-[18px] text-navy no-underline shadow-[0_12px_36px_rgba(245,158,11,0.32)] hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(245,158,11,0.42)] transition-all duration-250">
            Start for Free →
          </Link>
          <p className="font-inter text-[13px] text-slate-400 mt-4">No credit card required · Free forever plan</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy border-t border-white/[0.06] px-[5%] py-12">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-base leading-none">📚</div>
            <span className="font-syne font-extrabold text-[20px] text-white">Saarthi</span>
          </div>
          <p className="font-inter text-[14px] text-slate-500">© 2025 Saarthi · Built with ❤️ for students</p>
          <div className="flex gap-6">
            {["Privacy","Terms","Contact"].map(l=>(
              <a key={l} href="#" className="font-inter text-[14px] text-slate-500 no-underline hover:text-yellow transition-colors duration-200">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}