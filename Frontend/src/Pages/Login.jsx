import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const floatingDocs = [
    { top: "8%", left: "5%", label: "Physics.pdf", pages: "42 pages", emoji: "⚛️", delay: "0s" },
    { top: "30%", right: "4%", label: "Math Notes.pdf", pages: "28 pages", emoji: "📐", delay: "1.2s" },
    { bottom: "25%", left: "8%", label: "History.pdf", pages: "65 pages", emoji: "📜", delay: "2.1s" },
    { bottom: "8%", right: "6%", label: "Biology.pdf", pages: "53 pages", emoji: "🧬", delay: "0.6s" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* LEFT PANEL — Form */}
      <div style={{
        flex: "0 0 480px",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px 52px",
        position: "relative",
        zIndex: 2,
        boxShadow: "4px 0 32px rgba(10,22,40,0.08)",
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "52px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
          }}>📚</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "22px", color: "#0A1628" }}>Saarthi</span>
        </Link>

        {/* Heading */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "34px", fontWeight: 800, color: "#0A1628", marginBottom: "10px" }}>
            Welcome back!
          </h1>
          <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.6 }}>
            Sign in to continue your AI-powered study session with Saarthi.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: "10px", padding: "12px 16px",
            display: "flex", alignItems: "center", gap: "8px",
            marginBottom: "20px",
          }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
          </div>
        )}

        {/* Form fields */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Email address</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none" }}>✉️</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="saarthi-input"
              style={{ paddingLeft: "44px" }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Password</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none" }}>🔑</span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="saarthi-input"
              style={{ paddingLeft: "44px", paddingRight: "44px" }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: "16px", opacity: 0.5,
              }}
            >{showPassword ? "🙈" : "👁️"}</button>
          </div>
        </div>

        <div style={{ textAlign: "right", marginBottom: "28px" }}>
          <a href="#" style={{ fontSize: "13px", color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>Forgot password?</a>
        </div>

        {/* Login button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
          style={{
            width: "100%", padding: "15px",
            fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                animation: "spin 0.7s linear infinite",
              }} />
              Signing in...
            </>
          ) : "Sign In →"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "28px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          <span style={{ fontSize: "13px", color: "#94A3B8" }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
        </div>

        {/* Google OAuth */}
        <button style={{
          width: "100%", padding: "13px",
          borderRadius: "12px", border: "1.5px solid #E2E8F0",
          background: "white", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 500, color: "#374151",
          transition: "all 0.2s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#94A3B8"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Register link */}
        <p style={{ textAlign: "center", fontSize: "14px", color: "#64748B", marginTop: "28px" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
            Create one free →
          </Link>
        </p>
      </div>

      {/* RIGHT PANEL — Visual */}
      <div style={{
        flex: 1,
        background: "linear-gradient(160deg, #0A1628 0%, #0F2044 60%, #0A1628 100%)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }} />

        {/* Glow blobs */}
        <div style={{
          position: "absolute", top: "20%", left: "20%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "15%",
          width: 260, height: 260, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />

        {/* Floating doc cards */}
        {floatingDocs.map((doc, i) => (
          <div key={i} style={{
            position: "absolute",
            top: doc.top, left: doc.left, right: doc.right, bottom: doc.bottom,
            background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px", padding: "14px 18px",
            width: 180,
            animation: `float ${3.5 + i * 0.4}s ease-in-out ${doc.delay} infinite`,
            boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: 36, height: 40, background: "linear-gradient(135deg, #EF4444, #DC2626)",
                borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
              }}>📄</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "white" }}>{doc.label}</div>
                <div style={{ fontSize: "10px", color: "#64748B" }}>{doc.pages}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Central message */}
        <div style={{ textAlign: "center", zIndex: 1, padding: "0 48px" }}>
          <div style={{
            width: 88, height: 88, borderRadius: "24px",
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "40px", margin: "0 auto 32px",
            boxShadow: "0 20px 50px rgba(245,158,11,0.35)",
          }}>📚</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: 800, color: "white", marginBottom: "16px", lineHeight: 1.2 }}>
            Your AI study<br />companion awaits
          </h2>
          <p style={{ fontSize: "16px", color: "#64748B", lineHeight: 1.7, maxWidth: 360 }}>
            Upload any PDF and get quizzes, flashcards, summaries, and a smart chat — all powered by AI.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginTop: "32px" }}>
            {["💬 Chat with PDF", "🃏 Flashcards", "📝 Quiz", "📊 Summary", "✨ Notes"].map(f => (
              <div key={f} style={{
                padding: "8px 16px", borderRadius: "100px",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                fontSize: "13px", color: "#CBD5E1",
              }}>{f}</div>
            ))}
          </div>

          {/* Testimonial snippet */}
          <div style={{
            marginTop: "40px",
            background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px", padding: "20px 24px",
            textAlign: "left",
          }}>
            <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: 1.7, fontStyle: "italic", marginBottom: "12px" }}>
              "Saarthi helped me prepare for my semester exam in half the time. The quiz feature is amazing!"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontSize: "13px", fontWeight: 700, color: "white",
              }}>PS</div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "13px", color: "white" }}>Priya Sharma</div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>B.Tech CSE, 3rd Year</div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoginPage;