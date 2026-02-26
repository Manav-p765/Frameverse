import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const Avatar = ({ src, name, size = "w-11 h-11" }) => (
  <div className={`${size} rounded-full overflow-hidden flex-shrink-0 bg-[#2a2a30] flex items-center justify-center`}>
    {src ? (
      <img src={src} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-[#9a9aaa] text-sm font-medium">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    )}
  </div>
);

const SkeletonItem = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-[#2a2a30] flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-[#2a2a30] rounded w-1/3" />
      <div className="h-3 bg-[#2a2a30] rounded w-2/3" />
    </div>
  </div>
);

export default function ChatList({ chats, loading, activeChatId, currentUserId, onChatSelect, unreadCounts = {} }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter((c) => {
      const name = c.isGroup
        ? c.title
        : c.users.find((u) => u._id !== currentUserId)?.username || "";
      return name.toLowerCase().includes(q);
    });
  }, [chats, search, currentUserId]);

  const getChatName = useCallback(
    (chat) => {
      if (chat.isGroup) return chat.title || "Group Chat";
      const other = chat.users.find((u) => u._id !== currentUserId);
      return other?.username || "Unknown";
    },
    [currentUserId]
  );

  const getChatAvatar = useCallback(
    (chat) => {
      if (chat.isGroup) return chat.image;
      const other = chat.users.find((u) => u._id !== currentUserId);
      return other?.profilePic;
    },
    [currentUserId]
  );

  const getLastMessage = (chat) => {
    if (!chat.lastMessage) return "No messages yet";
    const { content, messageType, sender } = chat.lastMessage;
    const prefix = sender?._id === currentUserId ? "You: " : "";
    if (messageType === "image") return `${prefix}📷 Photo`;
    if (messageType === "file") return `${prefix}📎 File`;
    return `${prefix}${content || ""}`;
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#18181c]">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-[#2a2a30]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-semibold tracking-tight">Messages</h1>
          <button
            onClick={() => navigate("/chats/new")}
            className="w-8 h-8 rounded-full bg-[#2a2a30] flex items-center justify-center text-[#9a9aaa] hover:bg-[#34343c] hover:text-white transition-colors"
            aria-label="New chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6a]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full bg-[#2a2a30] text-white text-sm pl-9 pr-3 py-2 rounded-xl border border-transparent focus:border-[#3a3a44] focus:outline-none placeholder-[#5a5a6a] transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5a5a6a" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-[#5a5a6a] text-sm">{search ? "No results" : "No conversations yet"}</p>
          </div>
        ) : (
          filtered.map((chat) => {
            const name = getChatName(chat);
            const avatar = getChatAvatar(chat);
            const unread = unreadCounts[chat._id] || 0;
            const isActive = chat._id === activeChatId;

            return (
              <button
                key={chat._id}
                onClick={() => onChatSelect(chat._id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isActive ? "bg-[#2a2a30]" : "hover:bg-[#222226]"
                }`}
              >
                <div className="relative">
                  <Avatar src={avatar} name={name} />
                  {/* Online dot placeholder */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white text-sm font-medium truncate">{name}</span>
                    <span className="text-[#5a5a6a] text-xs flex-shrink-0">
                      {formatTime(chat.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={`text-xs truncate ${unread > 0 ? "text-white" : "text-[#5a5a6a]"}`}>
                      {getLastMessage(chat)}
                    </span>
                    {unread > 0 && (
                      <span className="flex-shrink-0 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}