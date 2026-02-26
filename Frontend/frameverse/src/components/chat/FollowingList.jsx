import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI, chatAPI } from "../../services/api";

const Avatar = ({ src, name }) => (
  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#2a2a30] flex items-center justify-center">
    {src ? (
      <img src={src} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-[#9a9aaa] text-sm font-medium">{name?.charAt(0)?.toUpperCase() || "?"}</span>
    )}
  </div>
);

export default function FollowingList({ onChatOpen }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    userAPI
      .getFollowing()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUserClick = async (userId) => {
    if (creating) return;
    setCreating(userId);
    try {
      const chat = await chatAPI.createChat(userId);
      if (onChatOpen) onChatOpen(chat._id);
      else navigate(`/chats/${chat._id}`);
    } catch {
      // silently fail
    } finally {
      setCreating(null);
    }
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#18181c]">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-[#2a2a30]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/chats")}
            className="text-[#9a9aaa] hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-semibold tracking-tight">New Message</h1>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a6a]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people you follow"
            className="w-full bg-[#2a2a30] text-white text-sm pl-9 pr-3 py-2 rounded-xl border border-transparent focus:border-[#3a3a44] focus:outline-none placeholder-[#5a5a6a] transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-[#2a2a30]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#2a2a30] rounded w-1/3" />
                <div className="h-3 bg-[#2a2a30] rounded w-1/5" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5a5a6a" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-[#5a5a6a] text-sm">{search ? "No results" : "Not following anyone yet"}</p>
          </div>
        ) : (
          <>
            <p className="text-[#5a5a6a] text-xs px-4 pt-4 pb-2 uppercase tracking-wider">Following</p>
            {filtered.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserClick(user._id)}
                disabled={creating === user._id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#222226] transition-colors text-left"
              >
                <Avatar src={user.profilePic} name={user.username} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{user.username}</p>
                  {user.bio && <p className="text-[#5a5a6a] text-xs truncate">{user.bio}</p>}
                </div>
                {creating === user._id ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <svg className="text-[#5a5a6a] flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}