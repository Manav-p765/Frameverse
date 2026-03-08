import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketEvent } from "../../hooks/useSocket";
import { userAPI, chatAPI } from "../../services/api";

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
  <div className={`${size} rounded-full overflow-hidden shrink-0 bg-bg-secondary flex items-center justify-center`}>
    {src ? (
      <img src={src} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-text-secondary text-sm font-medium">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    )}
  </div>
);

const SkeletonItem = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-bg-secondary shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-bg-secondary rounded w-1/3" />
      <div className="h-3 bg-bg-secondary rounded w-2/3" />
    </div>
  </div>
);

export default function ChatList({ chats, loading, activeChatId, currentUserId, onChatSelect, unreadCounts = {}, onNewMessage }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [creatingChatId, setCreatingChatId] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch following list so we can search it
  useEffect(() => {
    userAPI
      .getFollowing()
      .then(setFollowing)
      .catch((err) => console.error("Failed to load following list", err));
  }, []);

  // Sort by lastMessageAt descending, then filter by search
  const filteredChats = useMemo(() => {
    if (isSearchFocused && !search.trim()) return [];

    const sorted = [...chats].sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((c) => {
      const name = c.isGroup
        ? c.title
        : c.users.find((u) => u._id.toString() !== currentUserId.toString())?.username || "";
      return name.toLowerCase().includes(q);
    });
  }, [chats, search, currentUserId, isSearchFocused]);

  // Filter following users who matching the search AND who don't already have a 1-on-1 chat
  const filteredFollowing = useMemo(() => {
    if (!search.trim() && !isSearchFocused) return [];

    // Find IDs of users we already have 1-on-1 chats with
    const existingChatUserIds = new Set();
    chats.forEach(chat => {
      if (!chat.isGroup && chat.users.length === 2) {
        const otherUser = chat.users.find(u => u._id.toString() !== currentUserId.toString());
        if (otherUser) existingChatUserIds.add(otherUser._id.toString());
      }
    });

    const q = search.toLowerCase();
    return following.filter((u) => {
      const matchesSearch = u.username.toLowerCase().includes(q);
      const notInExistingChat = search.trim() ? !existingChatUserIds.has(u._id.toString()) : true;
      return matchesSearch && notInExistingChat;
    });
  }, [following, search, chats, currentUserId, isSearchFocused]);

  const handleStartNewChat = async (userId) => {
    if (creatingChatId) return;
    setCreatingChatId(userId);
    try {
      const chat = await chatAPI.createChat(userId);
      onChatSelect(chat._id);
    } catch (e) {
      console.error("Failed to create chat", e);
    } finally {
      setCreatingChatId(null);
      setSearch(""); // Clear search after successful creation
    }
  };

  const getChatName = useCallback(
    (chat) => {
      if (chat.isGroup) return chat.title || "Group Chat";
      const other = chat.users.find((u) => u._id.toString() !== currentUserId.toString());
      return other?.username || "Unknown";
    },
    [currentUserId]
  );

  const getChatAvatar = useCallback(
    (chat) => {
      if (chat.isGroup) return chat.image;
      const other = chat.users.find((u) => u._id.toString() !== currentUserId.toString());
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

  useSocketEvent("new-message", (message) => {
    onNewMessage?.(message); // bubble up to parent
  });

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-bg-primary">

      {/* Header — flex-shrink-0 keeps it fixed, list scrolls below */}
      {/* Added `md:pt-24` to prevent collision with the global Frameverse logo on desktop */}
      <div className="px-4 pt-5 md:pt-24 pb-3 border-b border-border-color shrink-0 bg-brand-purple/10 dark:bg-bg-primary transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-text-primary text-xl font-semibold tracking-tight">Messages</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6a]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Search or start new chat"
            className="w-full bg-bg-secondary text-text-primary text-sm pl-9 pr-3 py-2 rounded-xl border border-transparent focus:border-brand-purple/50 focus:outline-none placeholder-text-secondary transition-colors"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)
        ) : filteredChats.length === 0 && filteredFollowing.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5a5a6a" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-[#5a5a6a] text-sm">{search ? "No results" : "No conversations yet"}</p>
          </div>
        ) : (
          <div className="pb-4">
            {/* Existing Chats */}
            {filteredChats.length > 0 && (
              <div className="mb-2">
                {search && <p className="text-[#5a5a6a] text-xs px-4 pt-4 pb-2 uppercase tracking-wider">Chats</p>}
                {filteredChats.map((chat) => {
                  const name = getChatName(chat);
                  const avatar = getChatAvatar(chat);
                  const unread = unreadCounts[chat._id] || 0;
                  const isActive = chat._id === activeChatId;
                  const hasUnread = unread > 0;

                  return (
                    <button
                      key={chat._id}
                      onClick={() => onChatSelect(chat._id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? "bg-bg-secondary" : "hover:bg-bg-secondary/50"}`}
                    >
                      {/* Avatar — blue ring when unread */}
                      <div className={`relative rounded-full ${hasUnread ? "ring-2 ring-brand-purple" : ""}`}>
                        <Avatar src={avatar} name={name} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + time row */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${hasUnread ? "font-semibold text-text-primary" : "font-medium text-text-primary"}`}>
                            {name}
                          </span>
                          <span className={`text-xs shrink-0 ${hasUnread ? "text-brand-purple font-medium" : "text-[#5a5a6a]"}`}>
                            {formatTime(chat.lastMessageAt)}
                          </span>
                        </div>

                        {/* Last message + badge row */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className={`text-xs truncate ${hasUnread ? "text-text-primary font-medium" : "text-[#5a5a6a]"}`}>
                            {getLastMessage(chat)}
                          </span>
                          {hasUnread ? (
                            <span className="shrink-0 bg-brand-purple text-text-primary text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 leading-none">
                              {unread > 9 ? "9+" : unread}
                            </span>
                          ) : (
                            /* Spacer keeps layout stable when badge disappears */
                            <span className="shrink-0 w-4.5" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* New Chats (Following list) */}
            {filteredFollowing.length > 0 && (
              <div>
                <p className="text-[#5a5a6a] text-xs px-4 pt-4 pb-2 uppercase tracking-wider">Start New Chat</p>
                {filteredFollowing.map((user) => (
                  <button
                    key={user._id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleStartNewChat(user._id)}
                    disabled={creatingChatId === user._id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/50 transition-colors text-left"
                  >
                    <Avatar src={user.profilePic} name={user.username} />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium">{user.username}</p>
                      {user.bio && <p className="text-[#5a5a6a] text-xs truncate">{user.bio}</p>}
                    </div>
                    {creatingChatId === user._id ? (
                      <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <svg className="text-[#5a5a6a] shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
}