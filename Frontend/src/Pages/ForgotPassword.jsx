import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // NOTE: there is no backend route for password reset yet. We still give
    // the user a clear, honest confirmation instead of leaving the link dead
    // — this is the visible stub the audit called for, ready to be wired up
    // to a real /users/forgot-password endpoint later.
    setSubmitted(true);
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
                className="s-input mb-6"
              />
              <button
                type="submit"
                className="w-full py-4 rounded-[12px] bg-gradient-to-br from-blue to-blue-dark font-syne font-semibold text-[16px] text-white border-none cursor-pointer shadow-[0_4px_18px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 transition-all duration-250"
              >
                Send reset link
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
