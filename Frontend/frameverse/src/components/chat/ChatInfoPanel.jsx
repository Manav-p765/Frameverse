import { useState, useEffect } from "react";
import { chatAPI } from "../../services/api";

const Avatar = ({ src, name, size = "w-16 h-16" }) => (
  <div className={`${size} rounded-full overflow-hidden shrink-0 bg-bg-secondary flex items-center justify-center`}>
    {src ? (
      <img src={src} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-text-secondary text-xl font-medium">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    )}
  </div>
);

const formatDate = (date) =>
  new Date(date).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });

export default function ChatInfoPanel({ chat, currentUserId, onClose }) {
  const [media, setMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [activeTab, setActiveTab] = useState("media");

  const isGroup = chat?.isGroup;
  const otherUser = !isGroup ? chat?.users?.find((u) => u._id.toString() !== currentUserId.toString()) : null;
  const name = isGroup ? chat?.title || "Group Chat" : otherUser?.username || "Unknown";
  const avatar = isGroup ? chat?.image : otherUser?.profilePic;

  useEffect(() => {
    if (!chat?._id) return;
    setLoadingMedia(true);
    chatAPI
      .getChatMedia(chat._id)
      .then(setMedia)
      .catch(() => setMedia([]))
      .finally(() => setLoadingMedia(false));
  }, [chat?._id]);

  const images = media.filter((m) => m.messageType === "image");
  const files = media.filter((m) => m.messageType === "file");

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full min-h-0 bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a30] shrink-0 bg-bg-primary z-10">
        <h2 className="text-text-primary text-sm font-semibold">Info</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center gap-3 px-4 pt-6 pb-5 border-b border-[#2a2a30]">
        <Avatar src={avatar} name={name} size="w-20 h-20" />
        <div className="text-center">
          <p className="text-text-primary font-semibold text-base">{name}</p>
          {!isGroup && otherUser?.email && (
            <p className="text-[#5a5a6a] text-xs mt-0.5">{otherUser.email}</p>
          )}
          {isGroup && (
            <p className="text-[#5a5a6a] text-xs mt-0.5">{chat.users?.length} members</p>
          )}
        </div>

        {/* Action buttons */}
        {!isGroup && (
          <div className="flex gap-4 mt-1">
            {[
              { label: "Message", icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
              { label: "Call", icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /> },
              { label: "Video", icon: <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></> },
            ].map(({ label, icon }) => (
              <button key={label} className="flex flex-col items-center gap-1.5 group">
                <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-secondary group-hover:bg-[#34343c] group-hover:text-text-primary transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </div>
                <span className="text-[#5a5a6a] text-xs">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat metadata */}
      <div className="px-4 py-4 border-b border-[#2a2a30] space-y-3">
        <div className="flex items-start gap-3">
          <svg className="text-[#5a5a6a] mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <p className="text-[#5a5a6a] text-xs">Created</p>
            <p className="text-text-primary text-sm">{formatDate(chat.createdAt)}</p>
          </div>
        </div>
        {isGroup && chat.description && (
          <div className="flex items-start gap-3">
            <svg className="text-[#5a5a6a] mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <div>
              <p className="text-[#5a5a6a] text-xs">Description</p>
              <p className="text-text-primary text-sm">{chat.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Members (group only) */}
      {isGroup && (
        <div className="border-b border-[#2a2a30]">
          <p className="text-[#5a5a6a] text-xs px-4 pt-4 pb-2 uppercase tracking-wider">Members</p>
          {chat.users?.map((user) => (
            <div key={user._id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-9 h-9 rounded-full bg-bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-text-secondary text-sm">{user.username?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm truncate">{user.username}</p>
                {chat.admin?.some((a) => (a._id || a).toString() === user._id.toString()) && (
                  <p className="text-brand-purple text-xs">Admin</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media tabs */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex border-b border-[#2a2a30] bg-bg-primary">
          {["media", "files"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-medium capitalize transition-colors ${activeTab === tab
                  ? "text-text-primary border-b-2 border-blue-500"
                  : "text-[#5a5a6a] hover:text-text-secondary"
                }`}
            >
              {tab} {tab === "media" ? `(${images.length})` : `(${files.length})`}
            </button>
          ))}
        </div>

        <div className="p-4">
          {loadingMedia ? (
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-bg-secondary rounded-lg animate-pulse" />
              ))}
            </div>
          ) : activeTab === "media" ? (
            images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a3a44" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-[#5a5a6a] text-xs">No shared media</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {images.map((msg) => (
                  <a key={msg._id} href={msg.content} target="_blank" rel="noreferrer">
                    <img
                      src={msg.content}
                      alt="shared"
                      className="aspect-square object-cover rounded-lg w-full hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            )
          ) : (
            files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a3a44" strokeWidth="1.5">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                </svg>
                <p className="text-[#5a5a6a] text-xs">No shared files</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((msg) => (
                  <a
                    key={msg._id}
                    href={msg.content}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl hover:bg-[#34343c] transition-colors"
                  >
                    <svg className="text-text-secondary shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-xs truncate">{msg.content.split("/").pop()}</p>
                      <p className="text-[#5a5a6a] text-xs">{new Date(msg.createdAt).toLocaleDateString()}</p>
                    </div>
                  </a>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}