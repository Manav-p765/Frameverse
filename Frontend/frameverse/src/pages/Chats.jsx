import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInfoPanel from "../components/chat/ChatInfoPanel";

import { chatAPI, userAPI } from "../services/api";
import { useSocketEvent } from "../hooks/useSocket";

const parseChatId = (pathname) => {
  const parts = pathname.replace(/^\/chats\/?/, "").split("/");
  const segment = parts[0];
  if (!segment) return null;
  return segment;
};

const parseView = (pathname) => {
  const parts = pathname.replace(/^\/chats\/?/, "").split("/");
  if (parts[1] === "info") return "info";
  return "chat";
};

export default function Chats() {
  const location = useLocation();
  const navigate = useNavigate();

  const chatId = parseChatId(location.pathname);
  const currentView = parseView(location.pathname);

  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("unreadCounts") || "{}"); }
    catch { return {}; }
  });

  // ── 1. Auth ───────────────────────────────────────────────────────────────
  useEffect(() => {
    userAPI
      .getMe()
      .then((user) => {
        setCurrentUser(user);
      })
      .catch((err) => {
        console.error("Failed to fetch user in Chats page:", err);
      });
  }, []);

  // ── 2. Fetch chats ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    chatAPI
      .getMyChats()
      .then((data) => setChats(data))
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  // ── 3. Resolve activeChat ─────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId) { setActiveChat(null); return; }
    const found = chats.find((c) => c._id === chatId);
    if (found) { setActiveChat(found); return; }
    if (!currentUser) return;
    chatAPI
      .getChat(chatId)
      .then((chat) => {
        setActiveChat(chat);
        setChats((prev) => prev.find((c) => c._id === chat._id) ? prev : [chat, ...prev]);
      })
      .catch(() => navigate("/chats", { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, chats.length, currentUser]);

  // ── 4. Clear unread on open ───────────────────────────────────────────────
  useEffect(() => {
    if (chatId) setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
  }, [chatId]);

  useEffect(() => {
    localStorage.setItem("unreadCounts", JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  // ── 5. Close info on chat switch ──────────────────────────────────────────
  useEffect(() => { setShowInfo(false); }, [chatId]);


  useSocketEvent("chat-updated", ({ chatId: cId, lastMessage, lastMessageAt, newMessage }) => {
    setChats((prev) => {
      const updated = prev.map((c) =>
        c._id === cId ? { ...c, lastMessage, lastMessageAt } : c
      );
      return [...updated].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    });

    if (newMessage && cId !== chatId && newMessage.sender?._id?.toString() !== currentUser?._id?.toString()) {
      setUnreadCounts((prev) => ({ ...prev, [cId]: (prev[cId] || 0) + 1 }));
    }
  });

  // ── Socket: new-message (fallback for local updates on send) ───────────────
  useSocketEvent("new-message", (msg) => {
    const msgChatId = msg.chat?._id ?? msg.chat;
    setChats((prev) => {
      const chatExists = prev.find((c) => c._id === msgChatId);
      if (!chatExists) return prev; // handled by fetch or chat-updated if brand new

      const updated = prev.map((c) => {
        if (c._id === msgChatId) {
          // Only update if this message is newer than the current lastMessageAt
          const msgTime = new Date(msg.createdAt).getTime();
          const chatTime = new Date(c.lastMessageAt || 0).getTime();
          if (msgTime >= chatTime) {
            return {
              ...c,
              lastMessage: msg,
              lastMessageAt: msg.createdAt,
            };
          }
        }
        return c;
      });
      return [...updated].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    });
  });


  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChatSelect = useCallback((id) => {
    setShowInfo(false);
    navigate(`/chats/${id}`);
  }, [navigate]);

  const handleBack = useCallback(() => {
    setActiveChat(null);
    setShowInfo(false);
    navigate("/chats");
  }, [navigate]);

  if (!currentUser) {
    return (
      <div className="h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#5a5a6a] text-sm">Loading chats...</p>
        </div>
      </div>
    );
  }

  const listProps = {
    chats, loading,
    activeChatId: chatId,
    currentUserId: currentUser._id,
    onChatSelect: handleChatSelect,
    unreadCounts,
  };

  const windowProps = {
    chat: activeChat,
    currentUserId: currentUser._id,
    onInfoClick: () => setShowInfo((v) => !v),
    onBack: handleBack,
  };

  const infoProps = {
    chat: activeChat,
    currentUserId: currentUser._id,
    onClose: () => setShowInfo(false),
  };

  return (
    <>
      {/* ═══ DESKTOP (md+) ═══════════════════════════════════════════════════ */}
      <div className="hidden md:flex bg-bg-primary overflow-hidden h-full">
        <div className="w-[320px] shrink-0 border-r border-border-color flex flex-col overflow-hidden">
          <ChatList {...listProps} />
        </div>

        {/* Middle — relative so ChatWindow's absolute inset-0 is scoped here */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <ChatWindow {...windowProps} />
        </div>

        {showInfo && activeChat && (
          <div className="w-70 shrink-0 border-l border-border-color flex flex-col overflow-hidden">
            <ChatInfoPanel {...infoProps} />
          </div>
        )}
      </div>

      {/* ═══ MOBILE ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden bg-bg-primary h-full flex flex-col overflow-hidden">

        {currentView === "chat" && !chatId && (
          <div className="h-full flex flex-col overflow-hidden">
            <ChatList {...listProps} />
          </div>
        )}

        {/* KEY FIX: relative + overflow-hidden so ChatWindow's absolute inset-0 works */}
        {currentView === "chat" && chatId && (
          <div className="h-full relative overflow-hidden">
            <ChatWindow
              {...windowProps}
              onInfoClick={() => navigate(`/chats/${chatId}/info`)}
            />
          </div>
        )}

        {currentView === "info" && (
          <div className="h-full flex flex-col overflow-hidden">
            <ChatInfoPanel
              {...infoProps}
              onClose={() => navigate(`/chats/${chatId}`)}
            />
          </div>
        )}
      </div>
    </>
  );
}