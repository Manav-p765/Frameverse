import { useState, useRef, useCallback, useEffect } from "react";
import { emitTyping, emitStopTyping } from "../../hooks/useSocket";

export default function ChatInput({ chatId, onSend, disabled }) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Reset textarea height to single line
  const resetTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = ""; // fully collapse back to CSS default
    }
  }, []);

  const refocusTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    // focus without scroll jump
    ta.focus({ preventScroll: true });

    // place cursor at end
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
  }, []);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(chatId);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping(chatId);
    }, 2000);
  }, [chatId, isTyping]);

  const handleChange = (e) => {
    setText(e.target.value);
    handleTyping();
    // Auto-grow
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed, "text");

    clearTimeout(typingTimer.current);
    setIsTyping(false);
    emitStopTyping(chatId);

    // just clear text — focus handled by effect
    setText("");
  }, [text, disabled, onSend, chatId]);


  useEffect(() => {
    if (text === "") {
      const ta = textareaRef.current;
      if (!ta) return;

      // reset height
      ta.style.height = "auto";

      // focus AFTER DOM commit
      requestAnimationFrame(() => {
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(0, 0);
      });
    }
  }, [text]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleImageChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("Image must be under 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onSend(reader.result, "image");
        refocusTextarea();
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [onSend, refocusTextarea]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert("File must be under 5MB");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onSend(reader.result, "file", file.name);
        refocusTextarea();
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [onSend, refocusTextarea]
  );

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  return (
    <div className="px-4 py-3 border-t border-[#2a2a30] bg-bg-primary">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={handleFileChange} />

      <div className="flex items-end gap-2 bg-bg-secondary rounded-2xl px-3 py-2 border border-border-color focus-within:border-brand-purple/50 focus-within:ring-1 focus-within:ring-brand-purple/25 transition-all">
        {/* Image picker */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled}
          className="text-[#5a5a6a] hover:text-text-secondary transition-colors p-1 self-end mb-0.5 shrink-0"
          aria-label="Send image"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        {/* File picker */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="text-[#5a5a6a] hover:text-text-secondary transition-colors p-1 self-end mb-0.5 shrink-0"
          aria-label="Attach file"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-text-primary text-sm placeholder-[#5a5a6a] resize-none focus:outline-none leading-relaxed py-1 caret-white" style={{ maxHeight: "120px" }}
        />

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className={`self-end mb-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${text.trim() && !disabled ? "bg-chat-own text-white hover:opacity-90" : "text-[#5a5a6a]"
            }`}
          aria-label="Send message"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}