import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/auth" replace />;
};

export const clearUser = () => {
  localStorage.removeItem("user");
};


export default ProtectedRoute;
