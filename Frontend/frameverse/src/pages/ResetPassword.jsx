import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter",       test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter",       test: (pw) => /[a-z]/.test(pw) },
  { label: "Number",                 test: (pw) => /\d/.test(pw) },
  { label: "Special character",      test: (pw) => /[@$!%*?&#^()_\-+=]/.test(pw) },
];

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,72}$/;

export default function ResetPassword() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();

  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [error, setError]         = useState("");
  const [status, setStatus]       = useState("idle"); // idle | loading | success

  useEffect(() => {
    if (!token || !email) navigate("/auth", { replace: true });
  }, [token, email, navigate]);

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Reset failed. The link may have expired.");
        setStatus("idle");
        return;
      }

      // Optionally auto-login
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user)  localStorage.setItem("user", JSON.stringify(data.user));

      setStatus("success");
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "success") {
    return (
      <div className="dark min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="text-5xl">✓</div>
          <h2 className="text-text-primary text-2xl font-semibold">Password reset!</h2>
          <p className="text-text-secondary text-sm">Redirecting you home…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h2 className="text-text-primary text-2xl font-semibold mb-2">Set new password</h2>
        <p className="text-text-secondary text-sm mb-6">
          Choose a strong password for <span className="text-text-primary">{email}</span>.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* New Password */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              New password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 text-text-primary
                           border border-border-color placeholder-gray-500
                           focus:outline-none focus:border-white/30 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>

            {/* Strength indicators */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      PASSWORD_RULES.filter((r) => r.test(password)).length <= 2
                        ? "bg-red-500"
                        : PASSWORD_RULES.filter((r) => r.test(password)).length <= 4
                        ? "bg-yellow-400"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${(PASSWORD_RULES.filter((r) => r.test(password)).length / PASSWORD_RULES.length) * 100}%`,
                    }}
                  />
                </div>
                <ul className="space-y-0.5">
                  {PASSWORD_RULES.map((r) => (
                    <li
                      key={r.label}
                      className={`text-xs flex items-center gap-1 ${
                        r.test(password) ? "text-green-400" : "text-text-secondary/60"
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
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showCf ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 text-text-primary
                           border border-border-color placeholder-gray-500
                           focus:outline-none focus:border-white/30 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowCf(!showCf)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
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
            disabled={status === "loading"}
            className="w-full py-3.5 rounded-lg bg-linear-to-r from-red-300 to-pink-500
                       text-black font-semibold text-base
                       hover:from-red-400 hover:to-pink-400
                       active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 cursor-pointer"
          >
            {status === "loading" ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
