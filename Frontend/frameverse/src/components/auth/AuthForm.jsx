import { FaEye, FaEyeSlash, FaGoogle, FaGithub, FaEnvelope } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import AnimatedLogo from "../AnimatedLogo";
import {
    signInWithGoogle,
    signInWithGithub,
    registerWithEmail,
    loginWithEmail,
    sendFirebasePasswordReset,
} from "../../hooks/firebase";
import api from "../../services/post.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
    { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
    { label: "Number", test: (pw) => /\d/.test(pw) },
];
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&#^()_\-+=]{8,72}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const firebaseError = (code) => {
    switch (code) {
        case "auth/email-already-in-use": return { field: "email", message: "Email already in use" };
        case "auth/invalid-email": return { field: "email", message: "Invalid email address" };
        case "auth/weak-password": return { field: "password", message: "Password is too weak" };
        case "auth/user-not-found": return { field: "email", message: "No account with this email" };
        case "auth/wrong-password": return { field: "password", message: "Incorrect password" };
        case "auth/invalid-credential": return { field: "password", message: "Invalid email or password" };
        case "auth/too-many-requests": return { field: null, message: "Too many attempts. Try again later." };
        case "auth/user-disabled": return { field: null, message: "This account has been disabled." };
        default: return { field: null, message: "Something went wrong. Please try again." };
    }
};

const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white/5 text-text-primary border border-border-color " +
    "placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all duration-200";

// ─── Sub-components ───────────────────────────────────────────────────────────

function PasswordStrength({ password }) {
    if (!password) return null;
    const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
    const percent = (passed / PASSWORD_RULES.length) * 100;
    const color = percent <= 40 ? "bg-red-500" : percent <= 79 ? "bg-yellow-400" : "bg-green-500";
    return (
        <div className="mt-2 space-y-1">
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${percent}%` }} />
            </div>
            <ul className="space-y-0.5">
                {PASSWORD_RULES.map((r) => (
                    <li key={r.label} className={`text-xs flex items-center gap-1 ${r.test(password) ? "text-green-400" : "text-text-secondary/60"}`}>
                        <span>{r.test(password) ? "✓" : "○"}</span> {r.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Email Form ───────────────────────────────────────────────────────────────

function EmailForm({ mode, onBack, onExchangeToken, onNavigate }) {
    const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        setErrors((p) => ({ ...p, [name]: "" }));
        setServerError("");
    };

    const validate = () => {
        const err = {};
        if (mode === "register") {
            if (!form.username.trim()) err.username = "Username is required";
            else if (form.username.trim().length < 3) err.username = "At least 3 characters";
            else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) err.username = "Letters, numbers, underscores only";
            if (!form.confirmPassword) err.confirmPassword = "Please confirm your password";
            else if (form.password !== form.confirmPassword) err.confirmPassword = "Passwords do not match";
        }
        if (!form.email.trim()) err.email = "Email is required";
        else if (!EMAIL_REGEX.test(form.email)) err.email = "Enter a valid email";
        if (!form.password) err.password = "Password is required";
        else if (mode === "register" && !PASSWORD_REGEX.test(form.password))
            err.password = "Must be 8–72 chars with a lowercase letter and number";
        return err;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (Object.keys(err).length > 0) { setErrors(err); return; }
        setLoading(true);
        setServerError("");
        try {
            const idToken = mode === "register"
                ? await registerWithEmail(form.email.trim().toLowerCase(), form.password)
                : await loginWithEmail(form.email.trim().toLowerCase(), form.password);
            await onExchangeToken(idToken, mode === "register" ? form.username.trim().toLowerCase() : undefined);
        } catch (err) {
            if (err.code) {
                const { field, message } = firebaseError(err.code);
                if (field) setErrors({ [field]: message });
                else setServerError(message);
            } else {
                const data = err.response?.data;
                if (data?.field) setErrors({ [data.field]: data.message });
                else setServerError(data?.message || err.message || "Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {serverError && (
                <div className="mb-4 p-3 bg-brand-pink/10 border border-red-500/30 rounded-lg">
                    <p className="text-brand-pink text-sm text-center">{serverError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {mode === "register" && (
                    <div>
                        <label className="block text-text-secondary text-sm font-medium mb-2">Username*</label>
                        <input type="text" name="username" placeholder="krish12" value={form.username} onChange={handleChange} autoComplete="username" className={inputClass} />
                        {errors.username && <p className="text-brand-pink text-xs mt-2">{errors.username}</p>}
                    </div>
                )}

                <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">Email address*</label>
                    <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" className={inputClass} />
                    {errors.email && <p className="text-brand-pink text-xs mt-2">{errors.email}</p>}
                </div>

                <div className={`grid grid-cols-1 gap-4 ${mode === "register" ? "sm:grid-cols-2" : ""}`}>
                    <div>
                        <label className="block text-text-secondary text-sm font-medium mb-2">Password*</label>
                        <div className="relative">
                            <input type={showPw ? "text" : "password"} name="password" placeholder="••••••••" value={form.password} onChange={handleChange} autoComplete={mode === "login" ? "current-password" : "new-password"} className={inputClass + " pr-12"} />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition">
                                {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-brand-pink text-xs mt-2">{errors.password}</p>}
                        {mode === "register" && <PasswordStrength password={form.password} />}
                    </div>

                    {mode === "register" && (
                        <div>
                            <label className="block text-text-secondary text-sm font-medium mb-2">Confirm Password*</label>
                            <div className="relative">
                                <input type={showCf ? "text" : "password"} name="confirmPassword" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" className={inputClass + " pr-12"} />
                                <button type="button" onClick={() => setShowCf(!showCf)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition">
                                    {showCf ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-brand-pink text-xs mt-2">{errors.confirmPassword}</p>}
                        </div>
                    )}
                </div>

                {mode === "login" && (
                    <div className="text-right -mt-1">
                        <button type="button" onClick={() => onNavigate("/forgot-password")} className="text-text-secondary text-xs hover:text-text-primary hover:underline transition cursor-pointer">
                            Forgot password?
                        </button>
                    </div>
                )}

                <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-linear-to-r from-red-300 to-pink-500 text-black font-semibold text-base
                     hover:from-red-400 hover:to-pink-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 cursor-pointer mt-1">
                    {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
                </button>
            </form>

            <button type="button" onClick={onBack}
                className="w-full mt-3 py-2 text-text-secondary text-sm hover:text-text-primary transition cursor-pointer flex items-center justify-center gap-2">
                ← Other sign in options
            </button>
        </>
    );
}

// ─── Username Selection Modal ────────────────────────────────────────────────

function UsernameModal({ suggested, onConfirm, loading, error }) {
    const [username, setUsername] = useState(suggested || "");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) onConfirm(username.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-bg-secondary border border-border-color rounded-2xl p-8 shadow-2xl animate-slide-down">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-brand-purple/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">🎭</span>
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary tracking-tight">One last thing!</h3>
                    <p className="text-text-secondary mt-2">Pick a unique username to complete your profile.</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-brand-pink/10 border border-brand-pink/20 rounded-xl">
                        <p className="text-brand-pink text-sm text-center font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-text-secondary text-xs font-bold uppercase tracking-widest mb-2 ml-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                            placeholder="e.g. creative_mind"
                            className={inputClass}
                            autoFocus
                        />
                        <p className="text-[10px] text-text-secondary/60 mt-2 ml-1 lowercase italic">
                            Letters, numbers, and underscores only.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username.trim()}
                        className="w-full py-4 rounded-xl bg-linear-to-r from-brand-purple to-brand-pink text-white font-bold
                                 hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)] active:scale-[0.98] 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {loading ? "Creating Account..." : "Complete Sign Up"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AuthForm({ mode, toggleMode, onNavigate }) {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [showEmail, setShowEmail] = useState(false);
    const [socialLoading, setSocialLoading] = useState(null);
    const [socialError, setSocialError] = useState("");
    const [pendingIdToken, setPendingIdToken] = useState(null);
    const [suggestedUsername, setSuggestedUsername] = useState("");
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [usernameError, setUsernameError] = useState("");

    const handleToggle = () => {
        setShowEmail(false);
        setSocialError("");
        toggleMode();
    };

    const exchangeToken = async (idToken, username) => {
        if (!executeRecaptcha) {
            console.error("Execute recaptcha not yet available");
            throw new Error("Security check not ready. Please try again.");
        }

        let recaptchaToken;
        try {
            recaptchaToken = await executeRecaptcha('LOGIN');
        } catch (err) {
            throw new Error("Security check failed. Please try again.");
        }

        const res = await api.post("/user/auth/firebase", {
            idToken,
            username,
            recaptchaToken,
            recaptchaAction: 'LOGIN'
        });

        if (res.data.needsUsername) {
            setPendingIdToken(idToken);
            setSuggestedUsername(res.data.suggestedUsername ?? "");
            return;
        }
        if (res.data.token) localStorage.setItem("token", res.data.token);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
        onNavigate("/");
    };

    const handleSocialLogin = async (provider) => {
        setSocialError("");
        setSocialLoading(provider);
        try {
            const idToken = provider === "google" ? await signInWithGoogle() : await signInWithGithub();
            await exchangeToken(idToken);
        } catch (err) {
            if (err.message && err.message.startsWith("Security check")) {
                setSocialError(err.message);
            } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
                // silent
            } else if (err.code === "auth/account-exists-with-different-credential") {
                setSocialError("An account with this email already exists. Sign in with email/password.");
            } else if (err.code) {
                setSocialError(firebaseError(err.code).message);
            } else {
                setSocialError(err.response?.data?.message || err.message || "Sign in failed. Please try again.");
            }
        } finally {
            setSocialLoading(null);
        }
    };

    const handleUsernameConfirm = async (username) => {
        setUsernameLoading(true);
        setUsernameError("");
        try {
            await exchangeToken(pendingIdToken, username);
        } catch (err) {
            setUsernameError(err.response?.data?.message || "Could not create account. Try again.");
        } finally {
            setUsernameLoading(false);
        }
    };

    return (
        <>
            {pendingIdToken && (
                <UsernameModal suggested={suggestedUsername} onConfirm={handleUsernameConfirm} loading={usernameLoading} error={usernameError} />
            )}

            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 h-screen overflow-y-auto">
                <div className="w-full max-w-sm py-8">

                    {/* Logo */}
                    <div className="mb-8">
                        <AnimatedLogo className="w-48 md:w-56" />
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold text-text-primary mb-2">
                            {mode === "login" ? "Welcome back" : "Create account"}
                        </h2>
                        <p className="text-text-secondary text-sm">
                            {mode === "login" ? "Sign in to continue" : "Join to chat, share and connect."}
                        </p>
                    </div>

                    {/* ── Options view (Google, GitHub, Email buttons) ── */}
                    {!showEmail && (
                        <div className="space-y-3">

                            <button type="button" onClick={() => handleSocialLogin("google")} disabled={!!socialLoading}
                                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white/5 border border-border-color
                           text-text-primary text-sm font-medium hover:bg-white/10 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer">
                                {socialLoading === "google"
                                    ? <span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                                    : <FaGoogle size={15} />}
                                Continue with Google
                            </button>

                            <button type="button" onClick={() => handleSocialLogin("github")} disabled={!!socialLoading}
                                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white/5 border border-border-color
                           text-text-primary text-sm font-medium hover:bg-white/10 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer">
                                {socialLoading === "github"
                                    ? <span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                                    : <FaGithub size={15} />}
                                Continue with GitHub
                            </button>

                            <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 h-px bg-border-color" />
                                <span className="text-text-secondary text-xs">or</span>
                                <div className="flex-1 h-px bg-border-color" />
                            </div>

                            <button type="button" onClick={() => { setShowEmail(true); setSocialError(""); }} disabled={!!socialLoading}
                                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white/5 border border-border-color
                           text-text-primary text-sm font-medium hover:bg-white/10 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer">
                                <FaEnvelope size={14} />
                                Continue with Email
                            </button>

                            {socialError && (
                                <div className="p-3 bg-brand-pink/10 border border-red-500/30 rounded-lg">
                                    <p className="text-brand-pink text-sm text-center">{socialError}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Email form (replaces buttons, same space) ── */}
                    {showEmail && (
                        <EmailForm
                            mode={mode}
                            onBack={() => setShowEmail(false)}
                            onExchangeToken={exchangeToken}
                            onNavigate={onNavigate}
                        />
                    )}

                    {/* Toggle login / register */}
                    <div className="mt-7 text-center">
                        <p className="text-text-secondary text-sm">
                            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                            <button type="button" onClick={handleToggle} className="text-text-primary font-medium hover:underline transition-all cursor-pointer hover:text-green-400">
                                {mode === "login" ? "Sign Up" : "Sign In"}
                            </button>
                        </p>
                    </div>

                    {mode === "register" && (
                        <p className="mt-4 text-center text-text-secondary text-xs">
                            By signing up, you agree to our{" "}
                            <Link
                                to="/terms"
                                className="hover:text-text-primary hover:underline"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                to="/privacy"
                                className="hover:text-text-primary hover:underline"
                            >
                                Privacy Policy
                            </Link>.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

export default AuthForm;