import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import MainLayout from "../components/mainlayout";
import api from "../services/post.service";
import { initSocket, disconnectSocket } from "../hooks/useSocket";

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // ⭐ FAST FAIL (important)
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const { data } = await api.get("/user/auth/me");
        setIsAuthenticated(true);
        // Initialize socket as soon as user is authenticated
        initSocket(data._id);
      } catch {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Disconnect socket when user leaves the app / logs out
    return () => disconnectSocket();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

export default ProtectedRoute;
