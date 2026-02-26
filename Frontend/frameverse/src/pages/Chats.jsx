/**
 * pages/Chats.jsx
 *
 * Root problem that was fixed:
 *   useParams() only works when the component is rendered INSIDE a <Route path=":chatId">.
 *   ChatsInner was rendered by the Chats root (which lives at /chats/*) so useParams()
 *   always returned undefined for chatId.
 *
 * Solution:
 *   Parse chatId directly from useLocation().pathname — always accurate, no Route needed.
 *   URL stays in sync via navigate(). Desktop and mobile share the exact same chatId state.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ChatList      from "../components/chat/ChatList";
import ChatWindow    from "../components/chat/ChatWindow";
import ChatInfoPanel from "../components/chat/ChatInfoPanel";
import FollowingList from "../components/chat/FollowingList";

import { chatAPI, userAPI } from "../services/api";
import { initSocket, disconnectSocket, useSocketEvent } from "../hooks/useSocket";

// ─── Parse chatId from pathname ───────────────────────────────────────────────
//
//  /chats           → null
//  /chats/new       → null  (special route)
//  /chats/<id>      → "<id>"
//  /chats/<id>/info → "<id>"
//
const parseChatId = (pathname) => {
  const parts = pathname.replace(/^\/chats\/?/, "").split("/");
  const segment = parts[0];
  if (!segment || segment === "new") return null;
  return segment;
};

const parseView = (pathname) => {
  // "new"  → show FollowingList
  // "info" → show info panel (mobile)
  // ""     → default
  const parts = pathname.replace(/^\/chats\/?/, "").split("/");
  if (parts[0] === "new") return "new";
  if (parts[1] === "info") return "info";
  return "chat";
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Chats() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derived from URL — single source of truth
  const chatId      = parseChatId(location.pathname);
  const currentView = parseView(location.pathname);

  const [currentUser,  setCurrentUser]  = useState(null);
  const [chats,        setChats]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeChat,   setActiveChat]   = useState(null);
  const [showInfo,     setShowInfo]     = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  // ── 1. Auth: fetch current user, init socket ──────────────────────────────
  useEffect(() => {
    userAPI
      .getMe()
      .then((user) => {
        setCurrentUser(user);
        initSocket(user._id);
      })
      .catch(() => {
        localStorage.removeItem("token");
        window.location.href = "/auth";
      });

    return () => disconnectSocket();
  }, []);

  // ── 2. Fetch all chats once user is ready ─────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    chatAPI
      .getMyChats()
      .then((data) => setChats(data))
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  // ── 3. Resolve activeChat whenever chatId or chats list changes ───────────
  useEffect(() => {
    if (!chatId) {
      setActiveChat(null);
      return;
    }

    // Instant — try local list first
    const found = chats.find((c) => c._id === chatId);
    if (found) {
      setActiveChat(found);
      return;
    }

    // Not in list yet (direct URL visit) — fetch it
    if (!currentUser) return; // wait for auth
    chatAPI
      .getChat(chatId)
      .then((chat) => {
        setActiveChat(chat);
        setChats((prev) =>
          prev.find((c) => c._id === chat._id) ? prev : [chat, ...prev]
        );
      })
      .catch(() => navigate("/chats", { replace: true }));

  // chats.length as dep so we retry once the list loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, chats.length, currentUser]);

  // ── 4. Clear unread when opening a chat ───────────────────────────────────
  useEffect(() => {
    if (chatId) {
      setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
    }
  }, [chatId]);

  // ── 5. Close info panel when switching chats ──────────────────────────────
  useEffect(() => {
    setShowInfo(false);
  }, [chatId]);

  // ── Socket: incoming message ───────────────────────────────────────────────
  useSocketEvent("new-message", useCallback((msg) => {
    const cId = msg.chat?._id ?? msg.chat;

    setChats((prev) => {
      const updated = prev.map((c) =>
        c._id === cId
          ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt }
          : c
      );
      return [...updated].sort(
        (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
      );
    });

    if (cId !== chatId && msg.sender?._id !== currentUser?._id) {
      setUnreadCounts((prev) => ({ ...prev, [cId]: (prev[cId] || 0) + 1 }));
    }
  }, [chatId, currentUser?._id]));

  // ── Socket: chat metadata updated ─────────────────────────────────────────
  useSocketEvent("chat-updated", useCallback(({ chatId: cId, lastMessage, lastMessageAt }) => {
    setChats((prev) => {
      const updated = prev.map((c) =>
        c._id === cId ? { ...c, lastMessage, lastMessageAt } : c
      );
      return [...updated].sort(
        (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
      );
    });
  }, []));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChatSelect = useCallback((id) => {
    setShowInfo(false);
    navigate(`/chats/${id}`);
  }, [navigate]);

  const handleNewChatOpen = useCallback((id) => {
    setShowInfo(false);
    navigate(`/chats/${id}`);
  }, [navigate]);

  const handleBack = useCallback(() => {
    setActiveChat(null);
    setShowInfo(false);
    navigate("/chats");
  }, [navigate]);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="h-screen bg-[#18181c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#5a5a6a] text-sm">Loading chats...</p>
        </div>
      </div>
    );
  }

  // ── Shared prop bags ──────────────────────────────────────────────────────
  const listProps = {
    chats,
    loading,
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

  // ──────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══════════════ DESKTOP (md+) ═══════════════ */}
      {/*
        -m-4 escapes MainLayout's p-4.
        h-[calc(100vh-0px)] with overflow-hidden keeps everything locked
        to the viewport — no page-level scroll possible.
      */}
      <div className="hidden md:flex -m-4 bg-[#18181c] overflow-hidden"
           style={{ height: "100vh" }}>

        {/* Left — list or new-chat picker. Header fixed, list scrolls inside. */}
        <div className="w-[320px] flex-shrink-0 border-r border-[#2a2a30] flex flex-col overflow-hidden">
          {currentView === "new" ? (
            <FollowingList onChatOpen={handleNewChatOpen} />
          ) : (
            <ChatList {...listProps} />
          )}
        </div>

        {/* Middle — chat window. Header + input fixed, messages scroll. */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <ChatWindow {...windowProps} />
        </div>

        {/* Right — info panel. Header fixed, content scrolls inside. */}
        {showInfo && activeChat && (
          <div className="w-[280px] flex-shrink-0 border-l border-[#2a2a30] flex flex-col overflow-hidden">
            <ChatInfoPanel {...infoProps} />
          </div>
        )}
      </div>

      {/* ═══════════════ MOBILE ═══════════════ */}
      <div className="md:hidden -m-4 bg-[#18181c] overflow-hidden"
           style={{ height: "100vh" }}>
        {currentView === "new" && (
          <div className="h-full flex flex-col overflow-hidden">
            <FollowingList onChatOpen={handleNewChatOpen} />
          </div>
        )}

        {currentView === "chat" && !chatId && (
          <div className="h-full flex flex-col overflow-hidden">
            <ChatList {...listProps} />
          </div>
        )}

        {currentView === "chat" && chatId && (
          <div className="h-full flex flex-col overflow-hidden">
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