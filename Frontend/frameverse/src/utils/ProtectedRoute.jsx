import { Navigate, Outlet } from "react-router-dom";
import MainLayout from "../components/mainlayout";

const ProtectedRoute = () => {
  const isAuthenticated = !!localStorage.getItem("user");

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <MainLayout>{Outlet}</MainLayout>;
};

export const clearUser = () => {
  localStorage.removeItem("user");
};


export default ProtectedRoute;
