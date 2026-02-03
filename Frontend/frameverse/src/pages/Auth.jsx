import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../services/post.service";

const Auth = () => {
  const navigate = useNavigate();

  // ===== STATE =====
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
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
    if (mode === "register" && !form.username)
      err.username = "Username is required";
    if (!form.email) err.email = "Email is required";
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
      const url =
        mode === "login"
          ? "/user/login"
          : "/user/register";

      const res = await api.post(url, payload);

      if (res.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      navigate("/feed");

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

  // ===== JSX (minimal, replace freely) =====
  return (
    (
      <div className="animated-bg flex min-h-screen items-center justify-center px-4">
        {/* floating background orbs */}
        <div className="orb blue" />
        <div className="orb purple" />
        <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-xl"> 
          <h2 className="text-2xl font-semibold text-white text-center mb-1">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-400 text-center text-sm mb-6">
            {mode === "login"
              ? "Login to continue"
              : "Register to get started"}
          </p>

          {/* Server Error */}
          {serverError && (
            <p className="text-red-400 text-sm text-center mb-4">
              {serverError}
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username (Register only) */}
            {mode === "register" && (
              <div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md bg-white/10 text-white
                           placeholder-gray-400 focus:outline-none
                           focus:ring-2 focus:ring-blue-500"
                />
                {serverFieldError.username && (
                  <p className="text-red-400 text-sm mt-1">
                    {serverFieldError.username}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-md bg-white/10 text-white
                         placeholder-gray-400 focus:outline-none
                         focus:ring-2 focus:ring-blue-500"
              />
              {serverFieldError.email && (
                <p className="text-red-400 text-sm mt-1">
                  {serverFieldError.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-md bg-white/10 text-white
                         placeholder-gray-400 focus:outline-none
                         focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md bg-blue-600 text-white font-medium
                       hover:bg-blue-700 transition-all duration-300
                       active:scale-95 disabled:opacity-60
                       disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Login"
                  : "Register"}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-gray-400 text-sm mt-6">
            {mode === "login"
              ? "Don’t have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 text-blue-400 hover:underline"
            >
              {mode === "login" ? "Register" : "Login"}
            </button>
          </p>

        </div>
        </div>
    )
  );
};

export default Auth;
