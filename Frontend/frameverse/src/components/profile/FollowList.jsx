import React, { useState, useEffect } from "react";

// ── UserListItem ─────────────────────────────────────────────────────────────

const UserListItem = ({ user, currentUserId, onUserClick }) => {
  const [imgError, setImgError] = useState(false);
  const userId = user._id?.toString();
  const isSelf = currentUserId && userId === currentUserId.toString();

  const avatarSrc = user.profilePic || (user.avatar && user.avatar.length > 0 ? user.avatar[0].url : null);

  return (
    <div
      onClick={() => onUserClick(user)}
      className="flex items-center gap-3 p-4 hover:bg-bg-secondary/50 transition-colors cursor-pointer"
    >
      {/* Avatar */}
      <div className="shrink-0">
        {!imgError && avatarSrc ? (
          <img
            src={avatarSrc}
            alt={user.username}
            onError={() => setImgError(true)}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-800"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-800">
            <span className="text-text-primary font-semibold text-lg">
              {user.username?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-medium truncate">
          {user.username}
          {isSelf && (
            <span className="ml-2 text-xs text-text-secondary font-normal">(you)</span>
          )}
        </p>
        {user.bio && (
          <p className="text-text-secondary text-sm truncate">{user.bio}</p>
        )}
      </div>

      {/* Arrow */}
      <svg
        width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" className="text-gray-600 shrink-0"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
};

const FollowList = ({ type, users, isOpen, onClose, onUserClick, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredUsers(
        users.filter((user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  if (!isOpen) return null;


  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bg-primary/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg-primary rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-slideUp shadow-2xl border border-border-color">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-color">
            <h2 className="text-lg font-semibold text-text-primary capitalize">
              {type}
            </h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-secondary"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-border-color">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-secondary text-text-primary pl-10 pr-4 py-2.5 rounded-lg border border-border-color focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <svg
                  width="48" height="48" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p className="text-sm">
                  {searchQuery ? "No users found" : `No ${type} yet`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredUsers.map((user) => (
                  <UserListItem 
                    key={user._id?.toString()} 
                    user={user} 
                    currentUserId={currentUserId} 
                    onUserClick={onUserClick} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer - Count */}
          <div className="p-4 border-t border-border-color bg-bg-primary/50">
            <p className="text-center text-sm text-text-secondary">
              {filteredUsers.length} {type}
            </p>
          </div>
        </div>
      </div>

      {/* ✅ FIX: removed jsx attribute — this is plain React (Vite/CRA), not Next.js */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default FollowList;