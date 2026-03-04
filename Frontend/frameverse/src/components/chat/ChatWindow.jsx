import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import { messageAPI } from "../../services/api";
import { useSocketEvent, getSocket } from "../../hooks/useSocket";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import MessageRow from "./Messagerow";

const formatDateDivider = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric" });
};

export default function ChatWindow({
  chat,
  currentUserId,
  onInfoClick,
  onBack,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const seenIds = useRef(new Set());
  const sendingRef = useRef(false);
  const virtuosoRef = useRef(null);
  

  // Join socket room when chat changes
  useEffect(() => {
    if (!chat?._id) return;
    getSocket()?.emit("join-chat", chat._id);
  }, [chat?._id]);

  // Initial fetch
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


  // Socket: new message
  useSocketEvent("new-message", (msg) => {
    const msgChatId = msg.chat?._id ?? msg.chat;
    if (msgChatId !== chat?._id) return;
    if (seenIds.current.has(msg._id)) return;

    const senderId = msg.sender?._id ?? msg.sender;

    // ignore own echo
    if (senderId === currentUserId) {
      seenIds.current.add(msg._id);
      return;
    }

    seenIds.current.add(msg._id);
    setMessages((prev) => [...prev, msg]);
    messageAPI.markAsRead(chat._id).catch(() => {});
  });

  // Socket: delete
  useSocketEvent("message-deleted", ({ messageId }) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  });

  // Socket: typing
  useSocketEvent("typing", ({ chatId, userId }) => {
    if (chatId !== chat?._id || userId === currentUserId) return;
    setTypingUsers((prev) =>
      prev.includes(userId) ? prev : [...prev, userId]
    );
  });

  useSocketEvent("stop-typing", ({ chatId, userId }) => {
    if (chatId !== chat?._id) return;
    setTypingUsers((prev) => prev.filter((id) => id !== userId));
  });

  // Socket: read receipts
  useSocketEvent("messages-read", ({ chatId, userId }) => {
    if (chatId !== chat?._id) return;

    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        readBy: m.readBy?.includes(userId)
          ? m.readBy
          : [...(m.readBy || []), userId],
      }))
    );
  });

  // Optimistic send
  const handleSend = useCallback(
    async (content, messageType = "text", fileName = null) => {
      if (!chat?._id || sendingRef.current) return;

      const optimisticId = `optimistic-${Date.now()}`;

      const optimistic = {
        _id: optimisticId,
        chat: chat._id,
        content: messageType === "text" ? content : null,
        messageType,
        fileName,
        sender: { _id: currentUserId, username: "You" },
        readBy: [currentUserId],
        createdAt: new Date().toISOString(),
        optimistic: true,
        uploading: messageType !== "text",
      };

      seenIds.current.add(optimisticId);
      setMessages((prev) => [...prev, optimistic]);

      sendingRef.current = true;
      setSending(true);

      try {
        const real = await messageAPI.sendMessage(
          chat._id,
          content,
          messageType,
          fileName
        );

        seenIds.current.add(real._id);

        setMessages((prev) => {
          const alreadyReal = prev.find((m) => m._id === real._id);
          if (alreadyReal)
            return prev.filter((m) => m._id !== optimisticId);
          return prev.map((m) => (m._id === optimisticId ? real : m));
        });
      } catch {
        setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
        seenIds.current.delete(optimisticId);
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [chat?._id, currentUserId]
  );

  const handleDelete = useCallback(
    async (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      try {
        await messageAPI.deleteMessage(messageId);
      } catch {
        messageAPI.getMessages(chat._id).then(setMessages).catch(() => {});
      }
    },
    [chat?._id]
  );

  const handleCopy = useCallback((content) => {
    navigator.clipboard.writeText(content || "").catch(() => {});
  }, []);

  // Group by date
  const grouped = useMemo(() => {
    const groups = [];
    let lastDate = null;

    messages.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();

      if (date !== lastDate) {
        groups.push({
          type: "divider",
          label: formatDateDivider(msg.createdAt),
          key: date,
        });
        lastDate = date;
      }

      groups.push({ type: "message", msg });
    });



    return groups;
  }, [messages]);

  
  useEffect(() => {
  if (!loading && grouped.length) {
    virtuosoRef.current?.scrollToIndex({
      index: grouped.length - 1,
      behavior: "auto",
    });
  }
}, [loading, grouped.length]);


  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <p className="text-[#5a5a6a] text-sm">Select a conversation</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="shrink-0 z-10">
        <ChatHeader
          chat={chat}
          currentUserId={currentUserId}
          typingUsers={typingUsers}
          onInfoClick={onInfoClick}
          onBack={onBack}
        />
      </div>

      {/* Virtualized Messages */}

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#5a5a6a] text-sm">
            Loading messages…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-brand-pink text-sm">
            {error}
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            className="h-full"
            data={grouped}
            initialTopMostItemIndex={grouped.length - 1}
            followOutput={(isAtBottom) => (isAtBottom ? "smooth" : false)}
            itemContent={(index, item) => {
              if (item.type === "divider") {
                return (
                  <div className="flex items-center gap-3 py-3 px-4">
                    <div className="flex-1 h-px bg-bg-secondary" />
                    <span className="text-[#5a5a6a] text-xs">
                      {item.label}
                    </span>
                    <div className="flex-1 h-px bg-bg-secondary" />
                  </div>
                );
              }

              const msg = item.msg;
              const isOwn =
                msg.sender?._id === currentUserId ||
                msg.sender === currentUserId;

              return (
                <div className="px-4 py-0.5">
                  <MessageRow
                    msg={msg}
                    isOwn={isOwn}
                    currentUserId={currentUserId}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                  />
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 z-10">
        <ChatInput chatId={chat._id} onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}