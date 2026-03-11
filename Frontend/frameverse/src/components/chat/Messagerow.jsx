import React, { useState } from "react";
import MessageMenu from "./Messagemenu";

/**
 * Detect common file extensions for rendering.
 * Cloudinary URLs for images end with standard extensions;
 * for "file" type, fileName carries the original name.
 */
const isVideoUrl = (url) => /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);

// ── Inline renderers ────────────────────────────────────────────────────────

const ImageBubble = ({ src, isOwn }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative rounded-2xl overflow-hidden max-w-[260px] cursor-pointer">
      {/* Skeleton while loading */}
      {!loaded && (
        <div className="w-[260px] aspect-square bg-bg-secondary animate-pulse rounded-2xl" />
      )}
      <img
        src={src}
        alt="shared image"
        onLoad={() => setLoaded(true)}
        onClick={() => window.open(src, "_blank")}
        className={`w-full rounded-2xl object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"
          }`}
      />
    </div>
  );
};

const VideoBubble = ({ src }) => (
  <video
    src={src}
    controls
    preload="metadata"
    className="max-w-[280px] rounded-2xl"
  />
);

const FileBubble = ({ url, fileName, isOwn }) => {
  const displayName = fileName || url.split("/").pop()?.split("?")[0] || "File";
  const ext = displayName.split(".").pop()?.toUpperCase() || "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-colors min-w-[180px] max-w-[280px] ${isOwn
        ? "bg-chat-own hover:opacity-90 rounded-br-sm"
        : "bg-bg-secondary hover:bg-[#34343c] rounded-bl-sm"
        }`}
    >
      {/* File icon */}
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-primary/70"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary font-medium truncate">{displayName}</p>
        <p className="text-[10px] text-text-primary/50 uppercase">{ext} file</p>
      </div>

      {/* Download icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-text-primary/50 shrink-0"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </a>
  );
};

const CallBubble = ({ msg }) => {
  const meta = msg.callMeta || {};
  const isVideo = meta.callType === "video";
  const isMissed = meta.status === "missed" || meta.status === "timeout";
  const isRejected = meta.status === "rejected";
  const isCancelled = meta.status === "cancelled";
  const wasAnswered = meta.status === "completed";

  const iconColor = isMissed || isRejected ? "text-red-400" : "text-green-400";

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-bg-secondary/60 border border-border-color/30 min-w-[200px] max-w-[280px]">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-white/5 ${iconColor}`}>
        {isVideo ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary font-medium">{msg.content}</p>
        <p className="text-[10px] text-text-secondary mt-0.5">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {(isMissed || isRejected || isCancelled) && (
        <div className="shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400/60" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" />
            <line x1="23" y1="1" x2="1" y2="23" />
          </svg>
        </div>
      )}
    </div>
  );
};

// ── MessageRow ─────────────────────────────────────────────────────────────────────

const MessageRow = React.memo(function MessageRow({
  msg,
  isOwn,
  currentUserId,
  onDelete,
  onCopy,
}) {
  const isImage = msg.messageType === "image" && !isVideoUrl(msg.content);
  const isVideo = msg.messageType === "image" && isVideoUrl(msg.content);
  const isFile = msg.messageType === "file";
  const isCall = msg.messageType === "call";
  const isMedia = isImage || isVideo || isFile;

  // Call messages render centered, not in own/other bubble style
  if (isCall) {
    return (
      <div className="flex justify-center py-1">
        <CallBubble msg={msg} />
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 group ${isOwn ? "justify-end" : "justify-start"
        }`}
    >
      {/* Menu — own messages */}
      {isOwn && (
        <MessageMenu
          isOwn={isOwn}
          optimistic={msg.optimistic}
          onDelete={() => onDelete(msg._id)}
          onCopy={() => onCopy(msg.content)}
        />
      )}

      {/* Bubble wrapper */}
      <div className="max-w-[80%] sm:max-w-[70%] md:max-w-[60%] min-w-0 flex flex-col">
        {/* ── Media messages ── */}
        {isImage && (
          <ImageBubble src={msg.content} isOwn={isOwn} />
        )}

        {isVideo && (
          <VideoBubble src={msg.content} />
        )}

        {isFile && (
          <FileBubble url={msg.content} fileName={msg.fileName} isOwn={isOwn} />
        )}

        {/* ── Text message ── */}
        {!isMedia && (
          <div
            className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word shadow-sm
              ${isOwn
                ? "bg-chat-own text-white rounded-2xl rounded-br-sm"
                : "bg-bg-secondary text-text-primary rounded-2xl rounded-bl-sm"
              }
              ${msg.optimistic ? "opacity-70" : ""}
            `}
            style={{ overflowWrap: "anywhere" }}
          >
            {msg.content}
          </div>
        )}

        {/* Time and Status */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? "justify-end text-[#8e8ea0]" : "justify-start text-[#6a6a7a]"}`}>
          <span className="text-[10px]">
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isOwn && (
            <span className="mb-[2px] ml-0.5">
              {msg.status === "sent" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {msg.status === "delivered" && (
                <svg width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <polyline points="18 6 9 17 4 12" />
                  <line x1="22" y1="6" x2="16" y2="12" />
                </svg>
              )}
              {msg.status === "read" && (
                <svg width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <polyline points="18 6 9 17 4 12" />
                  <line x1="22" y1="6" x2="16" y2="12" />
                </svg>
              )}
              {/* Fallback for old messages without status */}
              {!msg.status && (
                <svg width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={msg.readBy?.length > 1 ? "text-blue-500" : "text-gray-400"}>
                  <polyline points="18 6 9 17 4 12" />
                  <line x1="22" y1="6" x2="16" y2="12" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Menu — received messages */}
      {!isOwn && (
        <MessageMenu
          isOwn={isOwn}
          optimistic={msg.optimistic}
          onDelete={() => onDelete(msg._id)}
          onCopy={() => onCopy(msg.content)}
        />
      )}
    </div>
  );
});

export default MessageRow;