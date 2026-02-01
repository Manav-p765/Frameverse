import Chat from "../models/chat.js";

export default (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // 🔐 SETUP USER
    socket.on("setup", (userId) => {
      if (!userId) return;
      socket.userId = userId;
      socket.join(userId);
      console.log("✅ User setup:", userId);
    });

    // JOIN CHAT
    socket.on("join-chat", async (chatId) => {
      try {
        if (!socket.userId) {
          return socket.emit("join-error", "Not authenticated");
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          return socket.emit("join-error", "Chat not found");
        }

        const isParticipant = chat.users.some(
          (userId) => userId.equals(socket.userId)
        );

        if (!isParticipant) {
          return socket.emit("join-error", "Access denied");
        }

        socket.join(chatId);
        socket.emit("joined-chat", chatId);
        console.log(`✅ ${socket.userId} joined chat ${chatId}`);
      } catch (err) {
        console.error(err);
        socket.emit("join-error", "Server error");
      }
    });

    // TYPING
    socket.on("typing", (chatId) => {
      if (!socket.userId || !chatId) return;
      console.log("⌨️ typing event from", socket.userId, "for chat", chatId);
      socket.to(chatId).emit("typing", {
        chatId,
        userId: socket.userId
      });
    });

    // STOP TYPING
    socket.on("stop-typing", (chatId) => {
      if (!socket.userId || !chatId) return;
      socket.to(chatId).emit("stop-typing", {
        chatId,
        userId: socket.userId
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
