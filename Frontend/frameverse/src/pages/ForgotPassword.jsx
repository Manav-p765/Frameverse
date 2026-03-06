import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { FaTimes } from "react-icons/fa";
import api from "../services/post.service";

export default function ForgotPassword() {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setStatus("loading");
        setError("");

        try {
            if (!executeRecaptcha) {
                throw new Error("Security check not ready.");
            }
            const recaptchaToken = await executeRecaptcha("FORGOT_PASSWORD");

            // Assuming api is configured with base URL pointing to backend
            await api.post("/auth/forgot-password", {
                email: email.trim(),
                recaptchaToken,
                recaptchaAction: "FORGOT_PASSWORD"
            });

            // Redirect to verify OTP page and pass email in state
            navigate("/verify-otp", { state: { email: email.trim() } });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to send OTP.");
            setStatus("idle");
        }
    };

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

                <h2 className="text-white text-2xl font-semibold mb-2">Forgot password?</h2>
                <p className="text-gray-400 text-sm mb-6 pr-6">Enter your email and we'll send a 6-digit reset code.</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/5 text-white border border-[#333] placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all duration-200"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/auth")}
                            className="flex-1 py-3 rounded-xl border border-[#333] text-gray-400 text-sm font-semibold hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-300 to-pink-500 text-black font-semibold text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all"
                        >
                            {status === "loading" ? "Sending…" : "Send Code"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
