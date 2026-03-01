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
        <div className="w-[260px] aspect-square bg-[#2a2a30] animate-pulse rounded-2xl" />
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
          ? "bg-blue-600 hover:bg-blue-700 rounded-br-sm"
          : "bg-[#2a2a30] hover:bg-[#34343c] rounded-bl-sm"
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
          className="text-white/70"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{displayName}</p>
        <p className="text-[10px] text-white/50 uppercase">{ext} file</p>
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
        className="text-white/50 shrink-0"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </a>
  );
};

// ── MessageRow ───────────────────────────────────────────────────────────────

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
  const isMedia = isImage || isVideo || isFile;

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
                ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                : "bg-[#2a2a30] text-white rounded-2xl rounded-bl-sm"
              }
              ${msg.optimistic ? "opacity-70" : ""}
            `}
            style={{ overflowWrap: "anywhere" }}
          >
            {msg.content}
          </div>
        )}

        {/* Time */}
        <span
          className={`text-[10px] mt-1 px-1 ${isOwn ? "text-right text-[#8e8ea0]" : "text-left text-[#6a6a7a]"
            }`}
        >
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
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