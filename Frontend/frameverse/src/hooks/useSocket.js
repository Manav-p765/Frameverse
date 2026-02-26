
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// ─── Singleton ────────────────────────────────────────────────────────────────

let socketInstance = null;

export const getSocket = () => socketInstance;

/**
 * Creates the socket connection and emits "setup" with the userId.
 * Safe to call multiple times — re-uses the existing connection if already open.
 */
export const initSocket = (userId) => {
  if (socketInstance?.connected) {
    // Already connected, just re-emit setup in case of re-mount
    socketInstance.emit("setup", userId);
    return socketInstance;
  }

  const token = localStorage.getItem("token");

  socketInstance = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL, {
    transports: ["websocket"],
    auth: { token }, // passed to socket.io handshake — optional on server side
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
  });

  socketInstance.on("connect", () => {
    console.log("🟢 Socket connected:", socketInstance.id);
    socketInstance.emit("setup", userId);
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("Socket connect error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason);
  });

  return socketInstance;
};

/** Hard disconnect — call on logout */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Subscribe to a socket event inside a component.
 * Automatically cleans up the listener on unmount or dependency change.
 *
 * @param {string}   event    Socket event name
 * @param {Function} handler  Callback — always uses latest ref, no stale closure
 */
export const useSocketEvent = (event, handler) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = socketInstance;
    if (!socket) return;

    const fn = (...args) => handlerRef.current(...args);
    socket.on(event, fn);

    return () => {
      socket.off(event, fn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
};

/**
 * Join a chat room when chatId changes.
 * The server validates the user is a participant before allowing the join.
 */
export const useChatRoom = (chatId) => {
  useEffect(() => {
    if (!chatId || !socketInstance) return;
    socketInstance.emit("join-chat", chatId);
  }, [chatId]);
};

// ─── Emitters ─────────────────────────────────────────────────────────────────

export const emitTyping = (chatId) => socketInstance?.emit("typing", chatId);
export const emitStopTyping = (chatId) => socketInstance?.emit("stop-typing", chatId);


