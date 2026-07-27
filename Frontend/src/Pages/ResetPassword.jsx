import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../services/api.js";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await API.post(`/users/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "This reset link is invalid or has expired.");
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

        {done ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl mb-5">✅</div>
            <h1 className="font-syne font-extrabold text-[24px] text-navy mb-2">Password reset</h1>
            <p className="font-inter text-[14px] text-slate-500 mb-2 leading-relaxed">
              Redirecting you to sign in…
            </p>
          </>
        ) : (
          <>
            <h1 className="font-syne font-extrabold text-[26px] text-navy mb-2">Set a new password</h1>
            <p className="font-inter text-[14px] text-slate-500 mb-7 leading-relaxed">
              Choose a new password for your account.
            </p>
            <form onSubmit={handleSubmit}>
              <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">New password</label>
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="s-input mb-4"
              />
              <label className="block font-inter text-[13px] font-semibold text-slate-700 mb-2">Confirm password</label>
              <input
                type="password"
                required
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
