
import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/post.service";
import Lottie from "lottie-react";
import animationData from "../assests/authanimation.json";
import AuthForm from "../components/AuthForm";


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
      if (!form.username.trim()) err.username = "Username is required";
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

        <AuthForm mode={mode} form={form}
          serverError={serverError}
          errors={errors}
          serverFieldError={serverFieldError}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          toggleMode={toggleMode}
          loading={loading}
        />
     
    </div>
  );
};

export default Auth;