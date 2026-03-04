import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// ─── Singleton ────────────────────────────────────────────────────────────────

let socketInstance = null;
const socketReadyListeners = new Set();

export const getSocket = () => socketInstance;

export const initSocket = (userId) => {
  if (socketInstance?.connected) {
    socketInstance.emit("setup", userId);
    return socketInstance;
  }

  const token = localStorage.getItem("token");

  socketInstance = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL, {
    transports: ["polling", "websocket"], // Allow polling fallback for aggressive production proxies
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
  });

  socketInstance.on("connect", () => {
    console.log("🟢 Socket connected:", socketInstance?.id);
    if (socketInstance) {
      socketInstance.emit("setup", userId);
    }
    socketReadyListeners.forEach((cb) => cb(socketInstance));
    socketReadyListeners.clear();
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

export const emitTyping = (chatId) => socketInstance?.emit("typing", chatId);
export const emitStopTyping = (chatId) => socketInstance?.emit("stop-typing", chatId);