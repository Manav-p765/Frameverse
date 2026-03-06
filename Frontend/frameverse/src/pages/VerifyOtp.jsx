import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { FaTimes } from "react-icons/fa";
import api from "../services/post.service";

export default function VerifyOtp() {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [otp, setOtp] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [timer, setTimer] = useState(30);

    // Initialize/Handle countdown timer
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Protect route if no email is in state
    useEffect(() => {
        if (!email) {
            navigate("/auth", { replace: true });
        }
    }, [email, navigate]);

    const handleOtpChange = (e) => {
        const value = e.target.value;
        if (/^\d{0,6}$/.test(value)) {
            setOtp(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError("Please enter a 6-digit code.");
            return;
        }

        setStatus("loading");
        setError("");

        try {
            const res = await api.post("/auth/verify-otp", {
                email,
                otp
            });

            // Pass resetToken to the next step
            navigate("/reset-password", {
                state: {
                    email,
                    resetToken: res.data.resetToken
                }
            });
            setMsg("");
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Invalid OTP.");
            setMsg("");
            setStatus("idle");
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setError("");
        setMsg("");
        setStatus("loading");

        try {
            if (!executeRecaptcha) {
                throw new Error("Security check not ready.");
            }
            const recaptchaToken = await executeRecaptcha("FORGOT_PASSWORD");

            await api.post("/auth/forgot-password", {
                email,
                recaptchaToken,
                recaptchaAction: "FORGOT_PASSWORD"
            });

            setMsg("A new code has been sent!");
            setTimer(30);
            setStatus("idle");
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to resend OTP.");
            setStatus("idle");
        }
    };

    if (!email) return null;

    return (
        <div className="dark min-h-screen bg-[#000] flex items-center justify-center p-6 show-recaptcha">
            <div className="bg-[#111] border border-[#333] rounded-xl p-8 w-full max-w-md shadow-2xl relative">

                {/* Cancel/Close Button */}
                <button
                    onClick={() => navigate("/auth")}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 cursor-pointer"
                    aria-label="Cancel"
                >
                    <FaTimes size={18} />
                </button>

                <h2 className="text-white text-2xl font-semibold mb-2">Check your email</h2>
                <p className="text-gray-400 text-sm mb-6 pr-6">
                    We sent a 6-digit code to <span className="text-white font-medium">{email}</span>.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}
                {msg && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm">{msg}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            placeholder="000000"
                            value={otp}
                            onChange={handleOtpChange}
                            required
                            autoFocus
                            className="w-full px-4 py-4 rounded-xl bg-white/5 text-white text-center text-3xl tracking-[1em] font-mono border border-[#333] placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all duration-200"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading" || otp.length !== 6}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-300 to-pink-500 text-black font-semibold text-base hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all duration-200"
                    >
                        {status === "loading" ? "Verifying…" : "Verify Code"}
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={timer > 0 || status === "loading"}
                            className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400"
                        >
                            {timer > 0
                                ? `Resend code in ${timer}s`
                                : "Didn't get the code? Resend"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
