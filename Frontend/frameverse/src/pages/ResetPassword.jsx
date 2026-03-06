import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import api from "../services/post.service";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Number", test: (pw) => /\d/.test(pw) },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&#^()_\-+=]{8,72}$/;

export default function ResetPassword() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email ?? "";
  const resetToken = location.state?.resetToken ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!resetToken || !email) {
      navigate("/auth", { replace: true });
    }
  }, [resetToken, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!PASSWORD_REGEX.test(password)) {
      setError("Password doesn't meet the requirements below.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      if (!executeRecaptcha) {
        throw new Error("Security check not ready.");
      }
      const recaptchaToken = await executeRecaptcha("RESET_PASSWORD");

      await api.post("/auth/reset-password", {
        email,
        resetToken,
        newPassword: password,
        recaptchaToken,
        recaptchaAction: "RESET_PASSWORD"
      });

      setStatus("success");
      setTimeout(() => navigate("/auth", { replace: true }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Reset failed. The token may have expired.");
      setStatus("idle");
    }
  };

  if (!email || !resetToken) return null;

  if (status === "success") {
    return (
      <div className="dark min-h-screen bg-[#000] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="text-5xl text-green-500">✓</div>
          <h2 className="text-white text-2xl font-semibold">Password reset!</h2>
          <p className="text-gray-400 text-sm">Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-[#000] flex items-center justify-center p-6 show-recaptcha">
      <div className="bg-[#111] border border-[#333] rounded-xl p-8 w-full max-w-sm shadow-2xl relative">

        {/* Cancel/Close Button */}
        <button
          onClick={() => navigate("/auth")}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 cursor-pointer"
          aria-label="Cancel"
        >
          <FaTimes size={18} />
        </button>

        <h2 className="text-white text-2xl font-semibold mb-2 pr-6">Set new password</h2>
        <p className="text-gray-400 text-sm mb-6">
          Choose a strong password for <span className="text-white font-medium">{email}</span>.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* New Password */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              New password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 text-white border border-[#333] placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>

            {/* Strength indicators */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${PASSWORD_RULES.filter((r) => r.test(password)).length <= 1
                      ? "bg-red-500"
                      : PASSWORD_RULES.filter((r) => r.test(password)).length <= 2
                        ? "bg-yellow-400"
                        : "bg-green-500"
                      }`}
                    style={{
                      width: `${(PASSWORD_RULES.filter((r) => r.test(password)).length / PASSWORD_RULES.length) * 100}%`,
                    }}
                  />
                </div>
                <ul className="space-y-0.5 mt-2">
                  {PASSWORD_RULES.map((r) => (
                    <li
                      key={r.label}
                      className={`text-xs flex items-center gap-1 ${r.test(password) ? "text-green-400" : "text-gray-500"
                        }`}
                    >
                      <span>{r.test(password) ? "✓" : "○"}</span> {r.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showCf ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 text-white border border-[#333] placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowCf(!showCf)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showCf ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {confirm && confirm !== password && (
              <p className="text-red-400 text-xs mt-2">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !password || password !== confirm}
            className="w-full py-3.5 mt-2 rounded-lg bg-gradient-to-r from-red-300 to-pink-500 text-black font-semibold text-base hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all duration-200"
          >
            {status === "loading" ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
