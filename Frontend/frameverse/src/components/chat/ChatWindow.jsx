import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { messageAPI } from "../../services/api";
import { useSocketEvent, getSocket } from "../../hooks/useSocket";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";

const Avatar = ({ src, name, size = "w-7 h-7" }) => (
  <div className={`${size} rounded-full overflow-hidden flex-shrink-0 bg-[#2a2a30] flex items-center justify-center`}>
    {src ? (
      <img src={src} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-[#9a9aaa] text-xs font-medium">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    )}
  </div>
);

const formatMsgTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDateDivider = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric" });
};

const SkeletonMsg = ({ right }) => (
  <div className={`flex gap-2 animate-pulse ${right ? "justify-end" : "justify-start"}`}>
    {!right && <div className="w-7 h-7 rounded-full bg-[#2a2a30] flex-shrink-0" />}
    <div className={`h-9 rounded-2xl bg-[#2a2a30] ${right ? "w-40" : "w-52"}`} />
  </div>
);

const ReadReceipt = ({ message, currentUserId, chatUsers }) => {
  const readByOthers = (message.readBy || []).filter((id) => {
    const uid = typeof id === "object" ? id._id || id.toString() : id;
    return uid !== currentUserId;
  });
  if (readByOthers.length === 0) return (
    <span className="text-[#5a5a6a]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
  return (
    <span className="text-blue-400">
      <svg width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" /><polyline points="16 6 9 13" />
      </svg>
    </span>
  );
};

export default function ChatWindow({ chat, currentUserId, onInfoClick, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());

  // Join chat room when chatId changes
  useEffect(() => {
    if (!chat?._id) return;
    const socket = getSocket();
    if (socket) socket.emit("join-chat", chat._id);
  }, [chat?._id]);

  // Fetch messages
  useEffect(() => {
    if (!chat?._id) return;
    setLoading(true);
    setError(null);
    seenIds.current.clear();

    messageAPI
      .getMessages(chat._id)
      .then((msgs) => {
        msgs.forEach((m) => seenIds.current.add(m._id));
        setMessages(msgs);
        messageAPI.markAsRead(chat._id).catch(() => {});
      })
      .catch(() => setError("Failed to load messages"))
      .finally(() => setLoading(false));
  }, [chat?._id]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Socket: new message
  useSocketEvent("new-message", useCallback((msg) => {
    if (msg.chat?._id !== chat?._id && msg.chat !== chat?._id) return;
    if (seenIds.current.has(msg._id)) return;
    seenIds.current.add(msg._id);
    setMessages((prev) => [...prev, msg]);
    messageAPI.markAsRead(chat._id).catch(() => {});
  }, [chat?._id]));

  // Socket: typing
  useSocketEvent("typing", useCallback(({ chatId, userId }) => {
    if (chatId !== chat?._id || userId === currentUserId) return;
    setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  }, [chat?._id, currentUserId]));

  useSocketEvent("stop-typing", useCallback(({ chatId, userId }) => {
    if (chatId !== chat?._id) return;
    setTypingUsers((prev) => prev.filter((id) => id !== userId));
  }, [chat?._id]));

  // Socket: messages read
  useSocketEvent("messages-read", useCallback(({ chatId, userId }) => {
    if (chatId !== chat?._id) return;
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        readBy: m.readBy?.includes(userId) ? m.readBy : [...(m.readBy || []), userId],
      }))
    );
  }, [chat?._id]));

  const handleSend = useCallback(async (content) => {
    if (!chat?._id || sending) return;

    // Optimistic
    const optimistic = {
      _id: `optimistic-${Date.now()}`,
      chat: chat._id,
      content,
      messageType: "text",
      sender: { _id: currentUserId, username: "You" },
      readBy: [currentUserId],
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    seenIds.current.add(optimistic._id);
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);

    try {
      const real = await messageAPI.sendMessage(chat._id, content);
      seenIds.current.add(real._id);
      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? real : m))
      );
    } catch {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      seenIds.current.delete(optimistic._id);
    } finally {
      setSending(false);
    }
  }, [chat?._id, currentUserId, sending]);

  // Group messages by date
  const grouped = useMemo(() => {
    const groups = [];
    let lastDate = null;
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (date !== lastDate) {
        groups.push({ type: "divider", label: formatDateDivider(msg.createdAt), key: date });
        lastDate = date;
      }
      groups.push({ type: "message", msg });
    });
    return groups;
  }, [messages]);

  if (!chat) return (
    <div className="flex-1 flex items-center justify-center bg-[#18181c]">
      <div className="text-center">
        <svg className="mx-auto mb-3 text-[#3a3a44]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p className="text-[#5a5a6a] text-sm">Select a conversation</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#18181c]">
      <ChatHeader
        chat={chat}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        onInfoClick={onInfoClick}
        onBack={onBack}
      />

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="space-y-3 pt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonMsg key={i} right={i % 3 === 0} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-[#5a5a6a] text-sm">No messages yet.</p>
            <p className="text-[#3a3a44] text-xs">Say hello 👋</p>
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === "divider") return (
              <div key={item.key} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-[#2a2a30]" />
                <span className="text-[#5a5a6a] text-xs">{item.label}</span>
                <div className="flex-1 h-px bg-[#2a2a30]" />
              </div>
            );

            const { msg } = item;
            const isOwn = msg.sender?._id === currentUserId || msg.sender === currentUserId;
            const showAvatar = !isOwn && (
              i === grouped.length - 1 ||
              grouped[i + 1]?.type === "divider" ||
              grouped[i + 1]?.msg?.sender?._id !== msg.sender?._id
            );

            return (
              <div key={msg._id} className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"} group`}>
                {!isOwn && (
                  <div className="w-7 flex-shrink-0 self-end">
                    {showAvatar && <Avatar src={msg.sender?.profilePic} name={msg.sender?.username} />}
                  </div>
                )}
                <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {msg.messageType === "image" ? (
                    <img
                      src={msg.content}
                      alt="sent"
                      className="rounded-2xl max-w-full max-h-60 object-cover"
                    />
                  ) : (
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isOwn
                          ? `bg-blue-500 text-white rounded-br-sm ${msg.optimistic ? "opacity-70" : ""}`
                          : "bg-[#2a2a30] text-white rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <span className="text-[#5a5a6a] text-[10px]">
                      {formatMsgTime(msg.createdAt)}
                    </span>
                    {isOwn && !msg.optimistic && (
                      <ReadReceipt message={msg} currentUserId={currentUserId} chatUsers={chat.users} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2">
            <div className="w-7" />
            <div className="bg-[#2a2a30] px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#9a9aaa] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput chatId={chat._id} onSend={handleSend} disabled={sending} />
    </div>
  );
}