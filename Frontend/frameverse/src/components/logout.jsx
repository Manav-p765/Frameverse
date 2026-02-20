import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/post.service";


const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await api.post("/user/logout");
      } catch (err) {
        console.error("Logout failed", err);
      } finally {
        localStorage.removeItem("token"); // ⭐ MISSING PIECE
        localStorage.removeItem("user");
        navigate("/auth", { replace: true });
      }
    };

    handleLogout();
  }, [navigate]);

  return <p>Logging you out...</p>;
};

export default Logout;
