import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/auth/AuthForm";

/* ─────────────────────────────────────────────
   Animated Background Component
───────────────────────────────────────────── */

const AnimatedBackground = lazy(() =>
  import("../components/auth/AnimatedBG")
);
/* ─────────────────────────────────────────────
   Auth Page
───────────────────────────────────────────── */

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");

  const toggleMode = () =>
    setMode((m) => (m === "login" ? "register" : "login"));

  return (
    <div className="dark h-screen overflow-hidden bg-black flex show-recaptcha">

      {/* Decorative animation (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        <Suspense fallback={<div className="w-full h-screen bg-black animate-pulse" />}>
          <AnimatedBackground />
        </Suspense>
      </div>

      {/* Authentication form */}

      <AuthForm
        mode={mode}
        toggleMode={toggleMode}
        onNavigate={navigate}
      />

    </div>
  );
};

export default Auth;