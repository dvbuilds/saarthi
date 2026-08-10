import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api.js";
import { getErrorMessage } from "../utils/getErrorMessage.js";
import { isValidEmail } from "../utils/validation.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/users/forgot-password", { email });
      // Backend always returns the same generic message whether or not the
      // account exists, so we show the confirmation screen either way.
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.10)] p-10 w-full max-w-[440px]">
        <Link to="/" className="flex items-center gap-2.5 no-underline mb-8">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-lg leading-none">📚</div>
          <span className="font-syne font-extrabold text-[22px] text-navy">Saarthi</span>
        </Link>

        {submitted ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl mb-5">✅</div>
            <h1 className="font-syne font-extrabold text-[24px] text-navy mb-2">Check your inbox</h1>
            <p className="font-inter text-[14px] text-slate-500 mb-8 leading-relaxed">
              If an account exists for <strong>{email}</strong>, we'll email you a link to reset your password shortly.
            </p>
            <Link to="/login" className="font-inter text-[14px] text-blue font-semibold no-underline hover:underline">← Back to sign in</Link>
          </>
        ) : (
          <>
            <h1 className="font-syne font-extrabold text-[26px] text-navy mb-2">Reset your password</h1>
            <p className="font-inter text-[14px] text-slate-500 mb-7 leading-relaxed">
              Enter your account email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
              <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">Email address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="s-input mb-3"
              />
              {error && (
                <p className="font-inter text-[13px] text-red-500 mb-3">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-[12px] bg-gradient-to-br from-blue to-blue-dark font-syne font-semibold text-[16px] text-white border-none cursor-pointer shadow-[0_4px_18px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 transition-all duration-250 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="text-center font-inter text-[14px] text-slate-500 mt-7">
              Remembered it after all?{" "}
              <Link to="/login" className="text-blue font-semibold no-underline hover:underline">Sign in →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
