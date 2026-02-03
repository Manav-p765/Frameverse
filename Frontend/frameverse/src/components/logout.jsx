import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/post.service";
import { clearUser } from "../utils/ProtectedRoute";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        await api.post("/user/logout");
      } catch (err) {
        console.error("Logout failed", err);
      } finally {
        clearUser(); // localStorage cleanup
        navigate("/auth", { replace: true });
      }
    };

    logout();
  }, [navigate]);

  return <p>Logging you out...</p>;
};

export default Logout;
