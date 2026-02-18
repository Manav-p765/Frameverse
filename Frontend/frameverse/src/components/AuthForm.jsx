import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";

function AuthForm({ mode, form, serverError, errors, handleChange, handleSubmit, toggleMode, loading, serverFieldError }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    return (
        <>
            {/* RIGHT SIDE - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Logo at top */}
                    <div className="flex items-center gap-3 mb-8">

                        <h1 className="text-xl font-bold text-white tracking-tight">
                            Frameverse
                        </h1>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-semibold text-white mb-3">
                            {mode === "login" ? "Welcome back" : "Create your account"}
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {mode === "login"
                                ? "Sign in to continue your conversations"
                                : "Register to chat, share and connect."}
                        </p>
                    </div>

                    {/* Server Error */}
                    {serverError && (
                        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm text-center">{serverError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username (Register only) */}
                        {mode === "register" && (
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Username*
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="krish12"
                                    value={form.username}
                                    onChange={handleChange}
                                    required={mode === "register"}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 text-white border border-white/10
                           placeholder-gray-500 focus:outline-none focus:border-white/30
                           transition-all duration-200 cursor-text hover:border-white/20"
                                />
                                {(errors.username || serverFieldError.username) && (
                                    <p className="text-red-400 text-xs mt-2">
                                        {errors.username || serverFieldError.username}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                Email address*
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="krish2000@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-lg bg-white/5 text-white border border-white/10
                         placeholder-gray-500 focus:outline-none focus:border-white/30
                         transition-all duration-200 cursor-text hover:border-white/20"
                            />
                            {(errors.email || serverFieldError.email) && (
                                <p className="text-red-400 text-xs mt-2">
                                    {errors.email || serverFieldError.email}
                                </p>
                            )}
                        </div>

                        {/* Password Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Password */}
                            <div className="relative">
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Password*
                                </label>

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 text-white 
               border border-white/10 placeholder-gray-400 
               focus:outline-none focus:border-white/30
               transition-all duration-200 cursor-text hover:border-white/20"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-[70%] -translate-y-1/2 
               text-gray-400 hover:text-white transition"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>

                                {errors.password && (
                                    <p className="text-red-400 text-xs mt-2">{errors.password}</p>
                                )}
                            </div>


                            {/* Confirm Password (Register only) */}
                            {mode === "register" && (
                                <div className="relative">
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Confirm Password*
                                    </label>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        required={mode === "register"}
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 text-white border border-white/10
                             placeholder-gray-400 focus:outline-none focus:border-white/30
                             transition-all duration-200 cursor-text hover:border-white/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-[70%] -translate-y-1/2 
               text-gray-400 hover:text-white transition"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                    </button>
                                    {errors.confirmPassword && (
                                        <p className="text-red-400 text-xs mt-2">
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Security Message (Register only) */}
                        {mode === "register" && (
                            <p className="text-gray-500 text-xs">
                                Your security is our priority. Use a strong password to protect your account.
                            </p>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-lg bg-linear-to-r from-red-300 to-pink-500 
                       text-black font-semibold text-base
                       hover:from-red-400 hover:to-pink-400 
                       active:scale-[0.98] disabled:opacity-50
                       disabled:cursor-not-allowed transition-all duration-200
                       shadow-lg shadow-green-500/20 cursor-pointer mt-2"
                        >
                            {loading
                                ? "Please wait..."
                                : mode === "login"
                                    ? "Sign In"
                                    : "Create Account"}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-5 text-center">
                        <p className="text-gray-400 text-sm">
                            {mode === "login"
                                ? "Don't have an account?"
                                : "Already have an account?"}{" "}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-white font-medium hover:underline transition-all cursor-pointer hover:text-green-400"
                            >
                                {mode === "login" ? "Sign Up" : "Sign In"}
                            </button>
                        </p>
                    </div>

                    {/* Terms (Register only) */}
                    {mode === "register" && (
                        <p className="mt-5 text-center text-gray-500 text-xs">
                            By signing up, you agree to our{" "}
                            <a href="#" className="text-gray-400 hover:text-gray-300 cursor-pointer hover:underline">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="#" className="text-gray-400 hover:text-gray-300 cursor-pointer hover:underline">
                                Privacy Policy
                            </a>
                            .
                        </p>
                    )}
                </div>
            </div>
        </>
    )
}

export default AuthForm;