import { useNavigate } from "react-router-dom";
import { useCallStore } from "../../store/useCallStore";
import { getSocket } from "../../hooks/useSocket";
import { usePresence } from "../../hooks/usePresence";

const Avatar = ({ src, name, size = "w-9 h-9", isOnline }) => (
  <div className="relative shrink-0">
    <div className={`${size} rounded-full overflow-hidden bg-bg-secondary flex items-center justify-center`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-text-secondary text-sm font-medium">
          {name?.charAt(0)?.toUpperCase() || "?"}
        </span>
      )}
    </div>
    {isOnline && (
      <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-orange border-2 border-bg-primary rounded-full z-10"></span>
    )}
  </div>
);

// Format last seen helper
const formatLastSeen = (date) => {
  if (!date) return "Tap to view info";
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Last seen just now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  return `Last seen ${date.toLocaleDateString()}`;
};

export default function ChatHeader({ chat, currentUserId, typingUsers = [], onInfoClick, onBack }) {
  const navigate = useNavigate();
  const { initiateCall, callStatus } = useCallStore();

  if (!chat) return null;

  const isGroup = chat.isGroup;
  const otherUser = !isGroup ? chat.users?.find((u) => u._id.toString() !== currentUserId.toString()) : null;
  const name = isGroup ? chat.title || "Group Chat" : otherUser?.username || "Unknown";
  const avatar = isGroup ? chat.image : (otherUser?.profilePic || otherUser?.avatar);

  const { isOnline, lastSeen } = usePresence(otherUser?._id);

  const handleStartCall = (type) => {
    if (!otherUser || callStatus !== "idle") return;

    // Derive full caller info from the chat's user list
    const currentUserObj = chat.users?.find((u) => u._id.toString() === currentUserId.toString());
    const callerInfo = {
      _id: currentUserId,
      username: currentUserObj?.username || "Unknown",
      profilePic: currentUserObj?.profilePic || currentUserObj?.avatar || null,
    };

    // Generate a client-side callId; server assigns the authoritative one via call:ringing
    const callId = `${otherUser._id}_${Date.now()}`;
    initiateCall(callId, otherUser, type);

    // Emit call:request — server validates, then responds with call:ringing
    // which triggers CallProvider to send the actual WebRTC offer
    getSocket()?.emit("call:request", {
      to: otherUser._id,
      callType: type,
      callerInfo,
    });
  };

  const typingText = (() => {
    if (!typingUsers.length) return null;
    if (typingUsers.length === 1) return "typing...";
    return `${typingUsers.length} people typing...`;
  })();

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-color bg-brand-purple/15 dark:bg-bg-primary transition-colors">
      {/* Back button — mobile only */}
      <button
        onClick={onBack || (() => navigate("/chats"))}
        className="md:hidden text-text-secondary hover:text-text-primary transition-colors p-1 -ml-1"
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
        <Avatar src={avatar} name={name} isOnline={!isGroup && isOnline} />
        <div className="min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">{name}</p>
          {typingText ? (
            <p className="text-brand-purple text-xs truncate">{typingText}</p>
          ) : (
            <p className={`text-xs truncate ${isOnline && !isGroup ? 'text-brand-orange font-medium' : 'text-[#5a5a6a]'}`}>
              {isGroup
                ? `${chat.users?.length || 0} members`
                : (isOnline ? "Online" : formatLastSeen(lastSeen))
              }
            </p>
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {!isGroup && (
          <>
            <button
              onClick={() => handleStartCall("audio")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-brand-purple/15 dark:hover:bg-white/10 hover:text-text-primary transition-colors"
              aria-label="Voice call"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
            <button
              onClick={() => handleStartCall("video")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-brand-purple/15 dark:hover:bg-white/10 hover:text-text-primary transition-colors"
              aria-label="Video call"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
          </>
        )}
        <button
          onClick={onInfoClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-brand-purple/15 dark:hover:bg-white/10 hover:text-text-primary transition-colors"
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
