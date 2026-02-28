import api from "./post.service";

// ─── Post ─────────────────────────────────────────────────────────────────────

export const postAPI = {
  /** GET /post/explore?limit=30  →  { posts: [...] } */
  getExplorePosts: (limit = 30) =>
    api.get(`/post/explore?limit=${limit}`).then((r) => r.data),
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export const chatAPI = {
  /** GET /chats/router  →  all chats for the logged-in user, sorted by lastMessageAt */
  getMyChats: () => api.get("/chats/router").then((r) => r.data),

  /** GET /chats/router/:chatId  →  single chat */
  getChat: (chatId) => api.get(`/chats/router/${chatId}`).then((r) => r.data),

  /** POST /chats/router  →  create or return existing 1v1 chat */
  createChat: (otherUserId) =>
    api.post("/chats/router", { otherUserId }).then((r) => r.data),

  /** POST /chats/router/group  →  create group chat */
  createGroup: (title, usersId) =>
    api.post("/chats/router/group", { title, usersId }).then((r) => r.data),

  /** POST /chats/router/:chatId/add-user */
  addUser: (chatId, userId) =>
    api.post(`/chats/router/${chatId}/add-user`, { userId }).then((r) => r.data),

  /** GET /chats/router/:chatId/media  →  shared images & files */
  getChatMedia: (chatId) =>
    api.get(`/chats/router/${chatId}/media`).then((r) => r.data),
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messageAPI = {
  /** GET /chats/router/messages/:chatId?page=n  →  paginated messages (oldest→newest) */
  getMessages: (chatId, page = 1) =>
    api.get(`/chats/router/messages/${chatId}?page=${page}`).then((r) => r.data),

  /** POST /chats/router/messages  →  send a message */
  sendMessage: (chatId, content, messageType, fileName = null) =>
    api.post("/chats/router/messages", { chatId, content, messageType, fileName })
      .then((r) => r.data),

  /** PATCH /chats/router/messages/:chatId/read  →  mark all messages as read */
  markAsRead: (chatId) =>
    api.patch(`/chats/router/messages/${chatId}/read`).then((r) => r.data),

  deleteMessage: (messageId) =>
    api.delete(`/chats/router/messages/${messageId}`).then((r) => r.data),
};


// ─── Users ────────────────────────────────────────────────────────────────────

export const userAPI = {
  /**
   * GET /user/auth/me  →  { _id, username, avatar, email, ... }
   * Reuses the same endpoint ProtectedRoute already calls — no extra request
   * if you pass the user down via context (see Chats.jsx notes).
   */
  getMe: () => api.get("/user/auth/me").then((r) => r.data),

  /**
   * GET /users/following  →  [{ _id, username, profilePic, bio }]
   * Returns the users the logged-in user follows.
   */
  getFollowing: () => api.get("/user/following").then((r) => r.data),

  /** GET /user/search?q=<query>  →  [{ _id, username, profilePic, bio, ... }] */
  searchUsers: (query) =>
    api.get(`/user/search?q=${encodeURIComponent(query)}`).then((r) => r.data),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationAPI = {
  /** GET /notifications?page=n  →  { notifications, unreadCount, page, totalPages } */
  getNotifications: (page = 1) =>
    api.get(`/notifications?page=${page}`).then((r) => r.data),

  /** PATCH /notifications/read  →  mark all as read */
  markAllRead: () =>
    api.patch("/notifications/read").then((r) => r.data),

  /** GET /notifications/unread-count  →  { count } */
  getUnreadCount: () =>
    api.get("/notifications/unread-count").then((r) => r.data),
};