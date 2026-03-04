import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocketEvent } from "../../hooks/useSocket";
import { useChatStore } from "../../utils/store";

const parseChatId = (pathname) => {
  const segment = pathname.replace(/^\/chats\/?/, "").split("/")[0];
  return (!segment || segment === "new") ? null : segment;
};

export default function MessageToast({ onNewMessage }) {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const updateChatWithMessage = useChatStore((s) => s.updateChatWithMessage);


  const currentChatId = parseChatId(location.pathname);

  useSocketEvent("chat-updated", ({ chatId: cId, newMessage }) => {
    if (!newMessage) return;

    updateChatWithMessage(newMessage);

    if (cId === currentChatId) return;

    const id = `${newMessage._id}-${Date.now()}`;
    const senderName = newMessage.sender?.username || "Someone";
    const preview =
      newMessage.messageType === "image" ? "📷 Photo" :
        newMessage.messageType === "file" ? "📎 File" :
          newMessage.content?.slice(0, 60) || "";

    setToasts((prev) => [
      ...prev.filter((t) => t.chatId !== cId),
      { id, chatId: cId, senderName, preview, avatar: newMessage.sender?.profilePic }
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  });
  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-100 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full max-w-sm bg-bg-secondary border border-[#3a3a44] rounded-2xl shadow-xl flex items-center gap-3 px-4 py-3 animate-slide-down"
          onClick={() => { navigate(`/chats/${toast.chatId}`); dismiss(toast.id); }}
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#3a3a44] shrink-0 overflow-hidden flex items-center justify-center">
            {toast.avatar ? (
              <img src={toast.avatar} alt={toast.senderName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-text-primary text-sm font-medium">
                {toast.senderName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm font-semibold truncate">{toast.senderName}</p>
            <p className="text-text-secondary text-xs truncate">{toast.preview}</p>
          </div>

          {/* Dismiss */}
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
            className="text-[#5a5a6a] hover:text-text-primary transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}