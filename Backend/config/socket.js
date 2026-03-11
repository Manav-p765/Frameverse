import Chat from "../models/chat.js";
import { registerCallHandlers } from "../controllers/callSignaling.js";
import { registerPresenceEvents } from "../controllers/socket/presenceEvents.js";
import { registerTypingEvents } from "../controllers/socket/typingEvents.js";
import { registerChatEvents } from "../controllers/socket/chatEvents.js";
/**
 * Socket.IO Initialization
 *
 * Initializes socket connections, authenticates users via JWT,
 * manages user presence (online/offline status), joins users to
 * chat rooms, and registers call signaling handlers.
 */
import jwt from "jsonwebtoken";

// ─── Shared state ───────────────────────────────────────────────────────────
// activeCalls: Map<callId, CallRecord>  — full call lifecycle tracking
// userCallMap: Map<userId, callId>      — fast reverse lookup for busy checks
const activeCalls = new Map();
const userCallMap = new Map();
const onlineUsers = new Map(); // Map<userId, { socketId, tabCount, lastSeen }>

export default (io) => {
  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.error("Socket Auth Error:", err.message);
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // 🔐 SETUP USER
    if (socket.userId) {
      socket.join(socket.userId);
    }

    // ─── Modular Event Handlers ──────────────────────────────────────────────
    registerPresenceEvents(io, socket, onlineUsers);
    registerTypingEvents(io, socket);
    registerChatEvents(io, socket, onlineUsers);

    // ─── WebRTC Call Signaling (production module) ───────────────────────────
    registerCallHandlers(io, socket, activeCalls, userCallMap);
  });
};
