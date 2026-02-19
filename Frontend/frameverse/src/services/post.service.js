import axios from "axios";

const api = axios.create({
  baseURL: "https://frameverse.onrender.com",
  withCredentials: true,
});

/* RESPONSE INTERCEPTOR */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

export default api;
