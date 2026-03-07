import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/post.service";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const handleLogout = async () => {
      try {
        await api.post("/user/logout");
      } catch (err) {
        console.error("Logout failed:", err?.response?.data || err.message);
      } finally {
        // Clear all local auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Optional: clear any cached axios headers
        delete api.defaults.headers.common["Authorization"];

        if (isMounted) {
          navigate("/", { replace: true });
        }
      }
    };

    handleLogout();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-text-secondary">
      Logging you out...
    </div>
  );
};

export default Logout;