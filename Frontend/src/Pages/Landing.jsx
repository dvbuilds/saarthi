import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((p) => (p + 1) % features.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: "💬", label: "Chat with PDF", desc: "Ask questions, get instant answers from your document" },
    { icon: "📝", label: "Smart Quiz", desc: "Auto-generated quizzes to test your understanding" },
    { icon: "🃏", label: "Flashcards", desc: "Study smarter with AI-crafted flashcard decks" },
    { icon: "📊", label: "Summary", desc: "Crisp, structured summaries of any document" },
    { icon: "✨", label: "Generate Notes", desc: "Turn dense PDFs into clean, readable study notes" },
  ];

  const stats = [
    { value: "10x", label: "Faster studying" },
    { value: "5+", label: "AI-powered tools" },
    { value: "100%", label: "Your data, private" },
  ];

  const howItWorks = [
    { step: "01", title: "Upload your PDF", desc: "Drop in any study material, textbook chapter, or research paper in seconds.", icon: "📤" },
    { step: "02", title: "Choose your tool", desc: "Pick from Chat, Quiz, Flashcards, Summary, or Notes — whatever fits your study session.", icon: "🎯" },
    { step: "03", title: "Learn effortlessly", desc: "Saarthi's AI processes your document and delivers exactly what you need.", icon: "🚀" },
  ];

  const testimonials = [
    { name: "Priya Sharma", role: "B.Tech CSE, 3rd Year", text: "Saarthi turned my 80-page research paper into a quiz in under a minute. My exam prep has never been this efficient.", avatar: "PS" },
    { name: "Rahul Verma", role: "MBA Student", text: "The Chat feature is like having a tutor inside my PDF. I ask, it answers. Simple, fast, accurate.", avatar: "RV" },
    { name: "Ananya Roy", role: "Competitive Exam Aspirant", text: "Flashcards from my own study material — exactly what I needed. My retention has improved massively.", avatar: "AR" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#ffffff", color: "#0A1628", overflowX: "hidden" }}>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 5%",
        height: "68px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        boxShadow: scrolled ? "0 1px 20px rgba(10,22,40,0.08)" : "none",
        transition: "all 0.3s ease",
        borderBottom: scrolled ? "1px solid rgba(226,232,240,0.6)" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
          }}>📚</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "22px", color: "#0A1628" }}>
            Saarthi
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {["Features", "How It Works", "Testimonials"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} style={{
              fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 500,
              color: scrolled ? "#475569" : "#475569", textDecoration: "none",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#2563EB"}
              onMouseLeave={e => e.target.style.color = "#475569"}
            >{item}</a>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link to="/login" style={{
            padding: "9px 20px",
            borderRadius: "10px",
            border: "1.5px solid #E2E8F0",
            fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "14px",
            color: "#0A1628", textDecoration: "none",
            transition: "all 0.2s",
            background: "white",
          }}
            onMouseEnter={e => { e.target.style.borderColor = "#2563EB"; e.target.style.color = "#2563EB"; }}
            onMouseLeave={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.color = "#0A1628"; }}
          >Sign in</Link>
          <Link to="/register" style={{
            padding: "9px 20px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "14px",
            color: "white", textDecoration: "none",
            transition: "all 0.25s",
            boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 6px 20px rgba(37,99,235,0.4)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 14px rgba(37,99,235,0.3)"; }}
          >Get Started Free</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0A1628 0%, #0F2044 50%, #0A1628 100%)",
        display: "flex", alignItems: "center",
        padding: "80px 5% 60px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Glow orbs */}
        <div style={{
          position: "absolute", top: "15%", left: "5%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "8%",
          width: 350, height: 350, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: "60px" }}>

          {/* Left content */}
          <div style={{ flex: 1, zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "7px 16px", borderRadius: "100px",
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              marginBottom: "24px",
              animation: "fadeSlideUp 0.6s ease forwards",
            }}>
              <span style={{ fontSize: "12px" }}>✨</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#F59E0B", fontWeight: 500 }}>
                AI-Powered Study Companion
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(40px, 5vw, 68px)",
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.1,
              marginBottom: "24px",
              opacity: 0,
              animation: "fadeSlideUp 0.6s ease 0.1s forwards",
            }}>
              Study smarter,<br />
              <span style={{
                background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>not harder</span>
            </h1>

            <p style={{
              fontSize: "18px", lineHeight: 1.7, color: "#94A3B8",
              maxWidth: 500, marginBottom: "40px",
              opacity: 0,
              animation: "fadeSlideUp 0.6s ease 0.2s forwards",
            }}>
              Upload any PDF and let Saarthi transform it into chats, quizzes, flashcards, summaries, and structured notes — instantly.
            </p>

            <div style={{
              display: "flex", gap: "14px", marginBottom: "56px",
              opacity: 0, animation: "fadeSlideUp 0.6s ease 0.3s forwards",
            }}>
              <Link to="/register" style={{
                padding: "15px 32px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "16px",
                color: "#0A1628", textDecoration: "none",
                boxShadow: "0 8px 32px rgba(245,158,11,0.35)",
                transition: "all 0.25s ease",
              }}
                onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 12px 40px rgba(245,158,11,0.45)"; }}
                onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 32px rgba(245,158,11,0.35)"; }}
              >Start for Free →</Link>
              <a href="#how-it-works" style={{
                padding: "15px 28px",
                borderRadius: "12px",
                border: "1.5px solid rgba(255,255,255,0.15)",
                fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "16px",
                color: "#FFFFFF", textDecoration: "none",
                background: "rgba(255,255,255,0.05)",
                transition: "all 0.25s ease",
              }}
                onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.12)"; }}
                onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.05)"; }}
              >See how it works</a>
            </div>

            {/* Stats */}
            <div style={{
              display: "flex", gap: "40px",
              opacity: 0, animation: "fadeSlideUp 0.6s ease 0.4s forwards",
            }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "#F59E0B" }}>{s.value}</div>
                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Hero visual */}
          <div style={{ flex: 1, position: "relative", minHeight: "520px", zIndex: 1, display: "flex", justifyContent: "center" }}>

            {/* Floating PDF cards */}
            <div style={{
              position: "absolute", top: "8%", left: "5%",
              background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px", padding: "16px 20px",
              width: 200,
              animation: "float 4.5s ease-in-out infinite",
              boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: 32, height: 36, background: "linear-gradient(135deg, #EF4444, #DC2626)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>📄</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "white" }}>Physics.pdf</div>
                  <div style={{ fontSize: "10px", color: "#64748B" }}>Chapter 5 · 42 pages</div>
                </div>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: "75%", height: "100%", background: "linear-gradient(90deg, #2563EB, #3B82F6)", borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: 6 }}>75% processed</div>
            </div>

            {/* Central card */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "24px", padding: "28px",
              width: 280,
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}>
              <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "pulse-ring 1.5s ease-out infinite" }} />
                AI Analyzing...
              </div>
              {features.map((f, i) => (
                <div key={f.label} style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: activeFeature === i ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${activeFeature === i ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.06)"}`,
                  marginBottom: "8px",
                  display: "flex", alignItems: "center", gap: "10px",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }} onClick={() => setActiveFeature(i)}>
                  <span style={{ fontSize: "18px" }}>{f.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "13px", fontWeight: 600, color: activeFeature === i ? "#FFFFFF" : "#94A3B8" }}>{f.label}</div>
                    {activeFeature === i && <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>{f.desc}</div>}
                  </div>
                  {activeFeature === i && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} />}
                </div>
              ))}
            </div>

            {/* Floating chat bubble */}
            <div style={{
              position: "absolute", bottom: "12%", right: "0%",
              background: "rgba(245,158,11,0.12)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "16px", padding: "14px 18px",
              width: 220,
              animation: "float2 5s ease-in-out infinite",
              boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
            }}>
              <div style={{ fontSize: "12px", color: "#F59E0B", marginBottom: "6px", fontWeight: 500 }}>💬 Asked Saarthi</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>"What is Newton's 2nd law?"</div>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "8px", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "8px" }}>
                Force equals mass times acceleration: <strong style={{ color: "white" }}>F = ma</strong>
              </div>
            </div>

            {/* Top right badge */}
            <div style={{
              position: "absolute", top: "5%", right: "3%",
              background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "12px", padding: "12px 16px",
              animation: "float 3.8s ease-in-out infinite 1s",
            }}>
              <div style={{ fontSize: "22px", textAlign: "center", marginBottom: "4px" }}>🃏</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "12px", fontWeight: 700, color: "#F59E0B", textAlign: "center" }}>12 Flashcards</div>
              <div style={{ fontSize: "10px", color: "#64748B", textAlign: "center" }}>Generated just now</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" style={{
        padding: "100px 5%",
        background: "#F8FAFC",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{
              display: "inline-flex", padding: "6px 16px", borderRadius: "100px",
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#2563EB", fontWeight: 500,
              marginBottom: "20px",
            }}>Features</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "42px", fontWeight: 800, color: "#0A1628", marginBottom: "16px" }}>
              Everything you need to{" "}
              <span style={{
                background: "linear-gradient(135deg, #2563EB, #3B82F6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>ace your studies</span>
            </h2>
            <p style={{ fontSize: "17px", color: "#64748B", maxWidth: 500, margin: "0 auto" }}>
              Five powerful AI tools, one simple upload. Transform the way you learn.
            </p>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px",
          }}>
            {[
              { icon: "💬", title: "Chat with PDF", desc: "Have a real conversation with your document. Ask follow-up questions, request clarifications, and extract exactly what you need.", color: "#EFF6FF", accent: "#2563EB" },
              { icon: "📝", title: "Smart Quiz", desc: "Instantly generate a quiz from your uploaded PDF. Test your understanding with MCQs tailored to the content.", color: "#FEF3C7", accent: "#D97706" },
              { icon: "🃏", title: "Flashcards", desc: "Transform key concepts into bite-sized flashcard decks. Review, flip, and master your material efficiently.", color: "#F0FDF4", accent: "#16A34A" },
              { icon: "📊", title: "Summary", desc: "Get a clean, structured summary of any document in seconds. Skip the fluff, get straight to what matters.", color: "#FDF4FF", accent: "#9333EA" },
              { icon: "✨", title: "Generate Notes", desc: "Turn raw PDF text into well-organized, readable notes formatted for your study style.", color: "#FFF7ED", accent: "#EA580C" },
            ].map((f, i) => (
              <div key={f.title} style={{
                background: "white",
                borderRadius: "20px",
                padding: "32px",
                border: "1.5px solid #F1F5F9",
                transition: "all 0.3s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 20px 50px rgba(10,22,40,0.1)";
                  e.currentTarget.style.borderColor = f.accent + "40";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#F1F5F9";
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: "16px",
                  background: f.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "26px", marginBottom: "20px",
                }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: "#0A1628", marginBottom: "12px" }}>{f.title}</h3>
                <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: "100px 5%", background: "#ffffff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{
              display: "inline-flex", padding: "6px 16px", borderRadius: "100px",
              background: "#FEF3C7", border: "1px solid #FDE68A",
              fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#D97706", fontWeight: 500,
              marginBottom: "20px",
            }}>How It Works</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "42px", fontWeight: 800, color: "#0A1628" }}>
              Three steps to smarter studying
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            {howItWorks.map((item, i) => (
              <div key={item.step} style={{ textAlign: "center", padding: "40px 28px", position: "relative" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "24px",
                  background: i === 1 ? "linear-gradient(135deg, #F59E0B, #D97706)" : "linear-gradient(135deg, #0A1628, #1E3A5F)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "32px", margin: "0 auto 24px",
                  boxShadow: i === 1 ? "0 12px 32px rgba(245,158,11,0.3)" : "0 12px 32px rgba(10,22,40,0.2)",
                }}>{item.icon}</div>
                <div style={{
                  fontFamily: "'Syne', sans-serif", fontSize: "13px", fontWeight: 700,
                  color: i === 1 ? "#D97706" : "#2563EB",
                  letterSpacing: "0.1em", marginBottom: "12px",
                }}>STEP {item.step}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 700, color: "#0A1628", marginBottom: "12px" }}>{item.title}</h3>
                <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.7 }}>{item.desc}</p>
                {i < 2 && <div style={{
                  position: "absolute", top: "68px", right: "-16px",
                  fontSize: "24px", color: "#E2E8F0",
                  display: "none",
                }}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{
        padding: "100px 5%",
        background: "linear-gradient(160deg, #0A1628 0%, #0F2044 100%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{
              display: "inline-flex", padding: "6px 16px", borderRadius: "100px",
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#F59E0B", fontWeight: 500,
              marginBottom: "20px",
            }}>Testimonials</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "42px", fontWeight: 800, color: "white" }}>
              Students love Saarthi
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {testimonials.map((t) => (
              <div key={t.name} style={{
                background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px", padding: "32px",
                transition: "all 0.3s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <div style={{ fontSize: "24px", color: "#F59E0B", marginBottom: "16px" }}>★★★★★</div>
                <p style={{ fontSize: "15px", color: "#CBD5E1", lineHeight: 1.75, marginBottom: "24px", fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Syne', sans-serif", fontSize: "14px", fontWeight: 700, color: "white",
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "14px", color: "white" }}>{t.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{
        padding: "100px 5%",
        background: "#ffffff",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "20px",
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px", margin: "0 auto 28px",
            boxShadow: "0 16px 40px rgba(37,99,235,0.3)",
          }}>📚</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "48px", fontWeight: 800, color: "#0A1628", marginBottom: "20px" }}>
            Ready to study smarter?
          </h2>
          <p style={{ fontSize: "18px", color: "#64748B", lineHeight: 1.7, marginBottom: "40px" }}>
            Join thousands of students already using Saarthi to understand their study materials faster and deeper.
          </p>
          <Link to="/register" style={{
            display: "inline-block",
            padding: "18px 48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "18px",
            color: "#0A1628", textDecoration: "none",
            boxShadow: "0 12px 40px rgba(245,158,11,0.35)",
            transition: "all 0.25s ease",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 18px 50px rgba(245,158,11,0.45)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 12px 40px rgba(245,158,11,0.35)"; }}
          >
            Start for Free →
          </Link>
          <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "16px" }}>No credit card required · Free forever plan</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: "#0A1628",
        padding: "48px 5% 32px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "8px",
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px",
            }}>📚</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "20px", color: "#FFFFFF" }}>Saarthi</span>
          </div>
          <p style={{ color: "#475569", fontSize: "14px" }}>© 2025 Saarthi. Built with ❤️ for students.</p>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy", "Terms", "Contact"].map(item => (
              <a key={item} href="#" style={{ color: "#475569", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#F59E0B"}
                onMouseLeave={e => e.target.style.color = "#475569"}
              >{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;