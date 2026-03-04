import { useState, useEffect, useRef } from "react";

export default function MessageMenu({ isOwn, onDelete, onCopy, optimistic }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  if (optimistic) return null;

  return (
    <div ref={menuRef} className="relative flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-full hover:bg-[#3a3a44] text-[#5a5a6a] hover:text-text-primary"
      >
        ⋮
      </button>

      {open && (
        <div className={`absolute z-50 top-6 ${isOwn ? "right-0" : "left-0"} bg-bg-secondary border border-[#3a3a44] rounded-xl shadow-xl overflow-hidden min-w-30`}>
          {isOwn && (
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full px-4 py-2.5 text-sm text-brand-pink hover:bg-[#3a3a44]"
            >
              Delete
            </button>
          )}

          <button
            onClick={() => { onCopy?.(); setOpen(false); }}
            className="w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-[#3a3a44]"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}