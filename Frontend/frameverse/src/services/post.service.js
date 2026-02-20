import axios from "axios";

const api = axios.create({
  // baseURL: "https://frameverse.onrender.com",
  baseURL: "http://localhost:8080",
});

/* REQUEST INTERCEPTOR */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* RESPONSE INTERCEPTOR */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);



export default api;