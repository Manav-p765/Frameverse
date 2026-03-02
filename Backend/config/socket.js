import Chat from "../models/chat.js";

// Keep track of which users are currently in a call to prevent race conditions and "ghost calls"
// Map of userId string -> true
const activeCalls = new Map();

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

    // --- WEBRTC CALLING CONFIGURATION ---

    // 1. INITIATING A CALL
    socket.on("call-user", ({ userToCall, from, offer, callType }) => {
      if (!socket.userId) return;

      // GUARD: Check if the target user is already in another call
      if (activeCalls.get(userToCall.toString())) {
        return socket.emit("user-busy", { to: userToCall });
      }

      console.log(`📞 Call initiated from ${from.username} to ${userToCall} (${callType})`);
      io.to(userToCall).emit("incoming-call", {
        from,
        offer,
        callType,
      });
    });

    // 2. ACCEPTING A CALL
    socket.on("call-accepted", ({ to, answer }) => {
      if (!socket.userId) return;

      // Lock both users into an active call state
      activeCalls.set(socket.userId.toString(), true);
      activeCalls.set(to.toString(), true);

      console.log(`✅ Call accepted by ${socket.userId}, notifying ${to}`);
      io.to(to).emit("call-accepted", { answer });
    });

    // 3. REJECTING A CALL
    socket.on("call-rejected", ({ to }) => {
      console.log(`❌ Call rejected by ${socket.userId}, notifying ${to}`);
      io.to(to).emit("call-rejected", { reason: "declined" });
    });

    // 4. ICE CANDIDATES EXCHANGES
    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { candidate });
    });

    // 5. ENDING A CALL
    socket.on("end-call", ({ to }) => {
      if (!socket.userId) return;

      console.log(`🔚 Call ended by ${socket.userId}`);

      // Cleanup the busy guards
      activeCalls.delete(socket.userId.toString());
      if (to) {
        activeCalls.delete(to.toString());
        io.to(to).emit("end-call", { from: socket.userId });
      }
    });

    // ------------------------------------

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);

      // If the user drops connection mid-call, free up their busy state
      if (socket.userId && activeCalls.has(socket.userId.toString())) {
        activeCalls.delete(socket.userId.toString());
        // We ideally want to notify the peer they dropped, but doing so requires
        // keeping track of who is calling who in a Map. For now, the frontend
        // ICE connection state usually detects this drop via WebRTC disconnected state.
      }
    });

  });
};
