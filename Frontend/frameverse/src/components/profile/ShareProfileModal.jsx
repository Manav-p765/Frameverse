import React, { useState } from "react";

const ShareProfileModal = ({ username, userId, onClose }) => {
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/profile/${userId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareOptions = [
    {
      name: "Twitter",
      icon: "𝕏",
      url: `https://twitter.com/intent/tweet?text=Check out ${username}'s profile on FrameVerse!&url=${encodeURIComponent(profileUrl)}`,
    },
    {
      name: "Facebook",
      icon: "f",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: "📱",
      url: `https://wa.me/?text=${encodeURIComponent(`Check out ${username}'s profile: ${profileUrl}`)}`,
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share Profile</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Copy Link */}
          <div className="copy-link-section">
            <input
              type="text"
              value={profileUrl}
              readOnly
              className="link-input"
            />
            <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
              {copied ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>

          {/* Social Share */}
          <div className="share-options">
            <p className="share-label">Share via</p>
            <div className="social-grid">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-share-btn"
                >
                  <span className="social-icon">{option.icon}</span>
                  <span className="social-name">{option.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareProfileModal;