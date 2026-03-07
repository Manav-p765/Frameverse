import axios from "axios";

// Create axios instance with base URL and credentials
const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

// Request interceptor to add Firebase Token if available
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token"); // Matches ProtectedRoute.jsx
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  logout: () => api.post("/user/logout").then((r) => r.data),
  me: () => api.get("/user/auth/me").then((r) => r.data), // Aligned with ProtectedRoute.jsx
  updateProfile: (data) =>
    api.put("/user/profile", data).then((r) => r.data),
  firebaseAuth: (data) =>
    api.post("/user/auth/firebase", data).then((r) => r.data),
  changePassword: (data) =>
    api.post("/user/auth/change-password", data).then((r) => r.data),
  verifyOTP: (data) =>
    api.post("/user/auth/verify-otp", data).then((r) => r.data),
  resetPassword: (data) =>
    api.post("/user/auth/reset-password", data).then((r) => r.data),
};

export const postAPI = {
  create: (formData) =>
    api
      .post("/post", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),
  getFeed: (page = 1) => api.get(`/user/feed?page=${page}`).then((r) => r.data),
  getById: (id) => api.get(`/post/${id}`).then((r) => r.data),
  update: (id, data) => api.put(`/post/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/post/${id}`).then((r) => r.data),
  toggleLike: (id) => api.post(`/post/${id}/like`).then((r) => r.data),
  addComment: (id, text) =>
    api.post(`/post/${id}/comment`, { text }).then((r) => r.data),
  deleteComment: (postId, commentId) =>
    api
      .delete(`/post/${postId}/comment/${commentId}`)
      .then((r) => r.data),
  share: (id) => api.post(`/post/${id}/share`).then((r) => r.data),
};

export const chatAPI = {
  getMyChats: () => api.get("/chats/router").then((r) => r.data),
  getChat: (id) => api.get(`/chats/router/${id}`).then((r) => r.data),
  createChat: (userId) =>
    api.post("/chats/router", { userId }).then((r) => r.data),
  createGroupChat: (data) =>
    api.post("/chats/router/group", data).then((r) => r.data),
  renameGroup: (id, title) =>
    api.put(`/chats/router/group/${id}`, { title }).then((r) => r.data),
  addToGroup: (id, userId) =>
    api.post(`/chats/router/${id}/add-user`, { userId }).then((r) => r.data),
};

export const messageAPI = {
  getMessages: (chatId) =>
    api.get(`/chats/router/messages/${chatId}`).then((r) => r.data),
  sendMessage: (chatId, content, messageType = "text", fileName = null) => {
    if (messageType === "file" || messageType === "image") {
      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("content", content);
      formData.append("messageType", messageType);
      if (fileName) formData.append("fileName", fileName);
      return api.post("/chats/router/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }).then(r => r.data);
    }
    return api.post("/chats/router/messages", { chatId, content, messageType }).then((r) => r.data);
  },
  deleteMessage: (messageId) =>
    api.delete(`/chats/router/messages/${messageId}`).then((r) => r.data),
  markAsRead: (chatId) =>
    api.patch(`/chats/router/messages/${chatId}/read`).then((r) => r.data),
};

export const userAPI = {
  getMe: () => api.get("/user/auth/me").then((r) => r.data),
  getProfile: (id) => api.get(id ? `/user/profile/${id}` : "/user/profile").then((r) => r.data),
  search: (q) => api.get(`/user/search?q=${q}`).then((r) => r.data),
  follow: (id) => api.post(`/user/follow/${id}`).then((r) => r.data),
  unfollow: (id) => api.post(`/user/unfollow/${id}`).then((r) => r.data),
  getFollowers: (id) => api.get(id ? `/user/followers/${id}` : "/user/followers").then((r) => r.data),
  getFollowing: (id) => api.get(id ? `/user/following/${id}` : "/user/following").then((r) => r.data),
};

export const notificationAPI = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`).then((r) => r.data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.put("/notifications/read-all").then((r) => r.data),
  getUnreadCount: () =>
    api.get("/notifications/unread-count").then((r) => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const userAnalyticsAPI = {
  getDashboard: (timeframe) => api.get(`/api/user/analytics/dashboard${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getSummary: (timeframe) => api.get(`/api/user/analytics/summary${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getGrowth: (timeframe) => api.get(`/api/user/analytics/growth${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getEngagement: (timeframe) => api.get(`/api/user/analytics/engagement${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getEngagementHistory: (timeframe) => api.get(`/api/user/analytics/engagement-history${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getTrending: () => api.get("/api/user/analytics/trending").then((r) => r.data),
  getRecentActivity: () => api.get("/api/user/analytics/recent").then((r) => r.data),
  getActiveHours: () => api.get("/api/user/analytics/active-hours").then((r) => r.data),
};

export const adminAnalyticsAPI = {
  getOverview: (timeframe) => api.get(`/api/admin/analytics/overview${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getTrending: () => api.get("/api/admin/analytics/trending").then((r) => r.data),
  getPlatformActivity: (timeframe) => api.get(`/api/admin/analytics/platform-activity${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getUserGrowth: (timeframe) => api.get(`/api/admin/analytics/user-growth${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getMessageActivity: (timeframe) => api.get(`/api/admin/analytics/message-activity${timeframe ? `?timeframe=${timeframe}` : ''}`).then((r) => r.data),
  getTopUsers: () => api.get("/api/admin/analytics/top-users").then((r) => r.data),
  getSystemHealth: () => api.get("/api/admin/analytics/system-health").then((r) => r.data),
};

export default api;