/**
 * Socket.IO Client (Singleton)
 *
 * Provides a single shared Socket.IO connection for the entire app.
 * Exports:
 *   - initSocket(userId)      — connect & authenticate
 *   - disconnectSocket()      — clean disconnect
 *   - getSocket()             — access the raw socket instance
 *   - useSocketEvent(event)   — React hook to listen to socket events
 *   - useChatRoom(chatId)     — React hook to join a chat room
 *   - emitTyping/emitStopTyping — typing indicator emitters
 *
 * useSocketEvent handles 3 timing cases:
 *   1. Socket already connected → attach listener immediately
 *   2. Socket exists but still connecting → wait for "connect"
 *   3. Socket not created yet → queue via socketReadyListeners
 */

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// ─── Singleton ────────────────────────────────────────────────────────────────

let socketInstance = null;
const socketReadyListeners = new Set();
let activeUsersList = []; // Local cache for debugging

export const getSocket = () => socketInstance;

export const initSocket = (userId) => {
  if (socketInstance?.connected) {
    socketInstance.emit("setup", userId);
    return socketInstance;
  }

  const token = localStorage.getItem("token");

  socketInstance = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL, {
    transports: ["polling", "websocket"], // Allow polling fallback for aggressive production proxies
    auth: { token, userId },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
  });

  // Track active users for debugging (restricted access)
  socketInstance.on("presence_sync_full", (list) => {
    activeUsersList = list; // array of { userId, username }
  });
  socketInstance.on("user_online", ({ userId, username }) => {
    if (!activeUsersList.some(u => u.userId === userId)) {
      activeUsersList.push({ userId, username });
    }
  });
  socketInstance.on("user_offline", ({ userId }) => {
    activeUsersList = activeUsersList.filter(u => u.userId !== userId);
  });

  window.printActiveUsers = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.email !== "manavparihar2000@gmail.com") {
      console.warn("Unauthorized: This command is restricted to the administrator.");
      return;
    }
    console.log("Current Active Users (IDs):", activeUsersList);
  };

  socketInstance.on("connect", () => {
    console.log("🟢 Socket connected:", socketInstance?.id);
    if (socketInstance) {
      socketInstance.emit("setup", userId);
      socketInstance.emit("sync_presence"); // Fetch active users list right away
    }
    socketReadyListeners.forEach((cb) => cb(socketInstance));
    socketReadyListeners.clear();
  });

  socketInstance.io.on("reconnect", () => {
    console.log("🔄 Socket reconnected! Syncing presence.");
    if (socketInstance) {
      socketInstance.emit("setup", userId);
      socketInstance.emit("sync_presence");
      // Could also trigger a global data refetch here if needed
    }
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("Socket connect error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason);
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useSocketEvent = (event, handler) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const fn = (...args) => handlerRef.current(...args);

    // ── Case 1: already connected — attach immediately ──
    if (socketInstance?.connected) {
      const instance = socketInstance; // capture so cleanup is safe if nulled later
      instance.on(event, fn);
      return () => instance?.off(event, fn);
    }

    // ── Case 2: socket exists but still connecting ──
    if (socketInstance) {
      const instance = socketInstance;
      const onConnect = () => instance.on(event, fn);
      instance.once("connect", onConnect);
      return () => {
        instance?.off("connect", onConnect);
        instance?.off(event, fn);
      };
    }

    // ── Case 3: socket not created yet ──
    let boundSocket = null;
    const onReady = (socket) => {
      boundSocket = socket;
      socket.on(event, fn);
    };
    socketReadyListeners.add(onReady);

    return () => {
      socketReadyListeners.delete(onReady);
      boundSocket?.off(event, fn); // safe — only defined if socket was bound
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
};

export const useChatRoom = (chatId) => {
  useEffect(() => {
    if (!chatId || !socketInstance) return;
    socketInstance.emit("join-chat", chatId);
  }, [chatId]);
};

// ─── Emitters ─────────────────────────────────────────────────────────────────

export const emitTyping = (chatId) => socketInstance?.emit("typing_start", chatId);
export const emitStopTyping = (chatId) => socketInstance?.emit("typing_stop", chatId);