import { useNavigate } from "react-router-dom";

const Avatar = ({ src, name, size = "w-9 h-9" }) => (
  <div className={`${size} rounded-full overflow-hidden shrink-0 bg-[#2a2a30] flex items-center justify-center`}>
    {src ? (
      <img src={src} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-[#9a9aaa] text-sm font-medium">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    )}
  </div>
);

export default function ChatHeader({ chat, currentUserId, typingUsers = [], onInfoClick, onBack }) {
  const navigate = useNavigate();

  if (!chat) return null;

  const isGroup = chat.isGroup;
  const otherUser = !isGroup ? chat.users?.find((u) => u._id !== currentUserId) : null;
  const name = isGroup ? chat.title || "Group Chat" : otherUser?.username || "Unknown";
  const avatar = isGroup ? chat.image : otherUser?.avatar;

  const typingText = (() => {
    if (!typingUsers.length) return null;
    if (typingUsers.length === 1) return "typing...";
    return `${typingUsers.length} people typing...`;
  })();

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a30] bg-[#18181c]">
      {/* Back button — mobile only */}
      <button
        onClick={onBack || (() => navigate("/chats"))}
        className="md:hidden text-[#9a9aaa] hover:text-white transition-colors p-1 -ml-1"
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Clickable user info → opens info panel */}
      <button
        onClick={onInfoClick}
        className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity min-w-0"
      >
        <Avatar src={avatar} name={name} />
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{name}</p>
          {typingText ? (
            <p className="text-blue-400 text-xs truncate">{typingText}</p>
          ) : (
            <p className="text-[#5a5a6a] text-xs truncate">
              {isGroup ? `${chat.users?.length || 0} members` : "Tap to view info"}
            </p>
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#9a9aaa] hover:bg-[#2a2a30] hover:text-white transition-colors"
          aria-label="Voice call"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#9a9aaa] hover:bg-[#2a2a30] hover:text-white transition-colors"
          aria-label="Video call"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
        <button
          onClick={onInfoClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#9a9aaa] hover:bg-[#2a2a30] hover:text-white transition-colors"
          aria-label="Chat info"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
