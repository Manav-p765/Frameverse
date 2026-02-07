
import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/post.service";
import Lottie from "lottie-react";
import animationData from "../assests/authanimation.json";

// Lazy load animation component
const AnimatedBackground = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="min-h-screen w-full flex justify-center bg-black items-center ml-5">
        <div className=" w-[95%] h-[92vh] overflow-hidden  rounded-xl">
          <Lottie
            animationData={animationData}
            loop
            className="bsolute inset-0 w-full h-full pointer-events-none"
          />
        </div>
      </div>
    )
  })
);

const Auth = () => {
  const navigate = useNavigate();

  // ===== STATE =====
  const [mode, setMode] = useState("register"); // login | register
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverFieldError, setServerFieldError] = useState({});

  // ===== HANDLERS =====
  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setErrors({});
    setServerError("");
    setServerFieldError({});
    setForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerFieldError({
      ...serverFieldError,
      [e.target.name]: "",
    });
  };

  const validate = () => {
    let err = {};
    if (mode === "register") {
      if (!form.username.trim()) err.username = "Full name is required";
      if (!form.confirmPassword)
        err.confirmPassword = "Please confirm your password";
      if (form.password && form.confirmPassword && form.password !== form.confirmPassword)
        err.confirmPassword = "Passwords do not match";
    }
    if (!form.email.trim()) err.email = "Email address is required";
    if (!form.password) err.password = "Password is required";

    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    setLoading(true);
    setServerError("");

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    try {
      const url = mode === "login" ? "/user/login" : "/user/register";
      const res = await api.post(url, payload);

      if (res.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      navigate("/");
    } catch (err) {
      const data = err.response?.data;

      if (data?.field) {
        setServerFieldError({
          [data.field]: data.message,
        });
      } else {
        setServerError(data?.message || "Something went wrong");
      }
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-black flex">
      {/* LEFT SIDE - Decorative Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Suspense fallback={
          <div className="min-h-screen w-full flex justify-center bg-black items-center ml-5 animate-pulse"></div>
        }>
          <AnimatedBackground />
        </Suspense>
      </div>

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
                : "Experience next-generation artificial intelligence tools designed to boost productivity and automate tasks"}
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
                  Full name*
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Andrew Gonzalis"
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
                placeholder="andrew.gonzalis@example.com"
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
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Password*
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 text-white border border-white/10
                           placeholder-gray-400 focus:outline-none focus:border-white/30
                           transition-all duration-200 cursor-text hover:border-white/20"
                />
                {errors.password && (
                  <p className="text-red-400 text-xs mt-2">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password (Register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Confirm Password*
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required={mode === "register"}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 text-white border border-white/10
                             placeholder-gray-400 focus:outline-none focus:border-white/30
                             transition-all duration-200 cursor-text hover:border-white/20"
                  />
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
              className="w-full py-3.5 rounded-lg bg-gradient-to-r from-red-300 to-pink-500 
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

      {/* Custom CSS for windmill animation */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Auth;