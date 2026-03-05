import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import animationData from "../assests/authanimation.json";
import AuthForm from "../components/auth/AuthForm";

const AnimatedBackground = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="min-h-screen w-full flex justify-center bg-black items-center ml-5">
        <div className="w-[95%] h-[92vh] overflow-hidden bg-black rounded-xl">
          <Lottie animationData={animationData} loop className="absolute inset-0 w-full h-full pointer-events-none" />
        </div>
      </div>
    ),
  })
);

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");

  const toggleMode = () => setMode((m) => (m === "login" ? "register" : "login"));

  return (
    <div className="dark h-screen overflow-hidden bg-black flex">
      {/* Left — decorative (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        <Suspense fallback={<div className="min-h-screen w-full bg-black animate-pulse" />}>
          <AnimatedBackground />
        </Suspense>
      </div>

      <AuthForm
        mode={mode}
        toggleMode={toggleMode}
        onNavigate={navigate}
      />
    </div>
  );
};

export default Auth;