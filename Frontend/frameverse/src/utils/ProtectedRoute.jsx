import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import MainLayout from "../components/mainlayout";
import api from "../services/post.service";
import { initSocket, disconnectSocket } from "../hooks/useSocket";

const AUTH_TIMEOUT_MS = 12000; // 12s — fail gracefully if API is unreachable

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // ⭐ FAST FAIL — no token means not logged in
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    let timedOut = false;

    // Safety timeout — if API is unreachable, don't hang forever
    const timeout = setTimeout(() => {
      timedOut = true;
      console.warn("⚠️ Auth check timed out — redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setLoading(false);
    }, AUTH_TIMEOUT_MS);

    const checkAuth = async () => {
      try {
        const { data } = await api.get("/user/auth/me");
        if (!timedOut) {
          setIsAuthenticated(true);
          // Initialize socket as soon as user is authenticated
          initSocket(data._id);
        }
      } catch {
        if (!timedOut) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        }
      } finally {
        if (!timedOut) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Disconnect socket when user leaves the app / logs out
    return () => {
      clearTimeout(timeout);
      disconnectSocket();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-border-color border-t-white rounded-full animate-spin" />
          <p className="text-text-primary/50 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

export default ProtectedRoute;
