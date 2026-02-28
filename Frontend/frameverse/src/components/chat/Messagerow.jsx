import React from "react";
import MessageMenu from "./Messagemenu";

// memoized for performance
const MessageRow = React.memo(function MessageRow({
  msg,
  isOwn,
  currentUserId,
  onDelete,
  onCopy,
}) {
  return (
    <div
      className={`flex items-end gap-2 group ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      {/* Menu */}
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
        {/* Message bubble */}
        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word shadow-sm
            ${
              isOwn
                ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                : "bg-[#2a2a30] text-white rounded-2xl rounded-bl-sm"
            }
            ${msg.optimistic ? "opacity-70" : ""}
          `}
          style={{ overflowWrap: "anywhere" }}
        >
          {msg.content}
        </div>

        {/* Time */}
        <span
          className={`text-[10px] mt-1 px-1 ${
            isOwn ? "text-right text-[#8e8ea0]" : "text-left text-[#6a6a7a]"
          }`}
        >
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Menu for received messages */}
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