import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, UserPlus, ImagePlus, Check } from "lucide-react";
import { notificationAPI } from "../services/api";
import { useSocketEvent } from "../hooks/useSocket";

// ── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const groupNotifications = (notifs) => {
  const now = Date.now();
  const dayMs = 86400000;
  const weekMs = dayMs * 7;

  const today = [], thisWeek = [], earlier = [];

  notifs.forEach((n) => {
    const age = now - new Date(n.createdAt).getTime();
    if (age < dayMs) today.push(n);
    else if (age < weekMs) thisWeek.push(n);
    else earlier.push(n);
  });

  return [
    { label: "Today", items: today },
    { label: "This Week", items: thisWeek },
    { label: "Earlier", items: earlier },
  ].filter((g) => g.items.length > 0);
};

const notifMeta = {
  follow: {
    icon: UserPlus,
    text: "started following you",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  like: {
    icon: Heart,
    text: "liked your post",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  new_post: {
    icon: ImagePlus,
    text: "shared a new post",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonItem = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-[#2a2a30] shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-[#2a2a30] rounded w-2/3" />
      <div className="h-3 bg-[#2a2a30] rounded w-1/3" />
    </div>
  </div>
);

// ── Component ────────────────────────────────────────────────────────────────

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await notificationAPI.getNotifications(page);
        if (page === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setTotalPages(data.totalPages);
        setUnreadCount(data.unreadCount);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  // Real-time: prepend new notifications
  useSocketEvent(
    "new-notification",
    useCallback((notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((n) => n + 1);
    }, [])
  );

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  // Click handler
  const handleClick = (notif) => {
    if (notif.type === "follow") {
      navigate(`/profile/${notif.sender._id}`);
    } else if (notif.type === "like" || notif.type === "new_post") {
      navigate(`/profile/${notif.sender._id}`);
    }
  };

  const groups = groupNotifications(notifications);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-semibold tracking-tight">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-[#9a9aaa] hover:text-white transition-colors"
          >
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonItem key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-16 h-16 rounded-full bg-[#2a2a30] flex items-center justify-center">
            <Heart size={28} className="text-[#5a5a6a]" />
          </div>
          <p className="text-[#5a5a6a] text-sm">No notifications yet</p>
          <p className="text-[#3a3a4a] text-xs">
            When someone follows you, likes your post, or shares content, you'll see it here.
          </p>
        </div>
      ) : (
        /* Grouped list */
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="text-sm font-medium text-[#5a5a6a] px-4 mb-2">
                {group.label}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((notif) => {
                  const meta = notifMeta[notif.type] || notifMeta.follow;
                  const Icon = meta.icon;

                  return (
                    <button
                      key={notif._id}
                      onClick={() => handleClick(notif)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left
                        hover:bg-white/5
                        ${!notif.read ? "bg-white/[0.02]" : ""}`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {notif.sender?.profilePic ? (
                          <img
                            src={notif.sender.profilePic}
                            alt={notif.sender.username}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#2a2a30] flex items-center justify-center text-white text-sm font-medium uppercase">
                            {notif.sender?.username?.[0] || "?"}
                          </div>
                        )}
                        {/* Type badge */}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${meta.bg} flex items-center justify-center border-2 border-[#18181c]`}
                        >
                          <Icon size={10} className={meta.color} />
                        </div>
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white leading-snug">
                          <span className="font-semibold">
                            {notif.sender?.username || "Someone"}
                          </span>{" "}
                          <span className="text-[#9a9aaa]">{meta.text}</span>
                        </p>
                        <p className="text-xs text-[#5a5a6a] mt-0.5">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>

                      {/* Post thumbnail (for like/new_post) */}
                      {notif.post?.image?.url && (
                        <img
                          src={notif.post.image.url}
                          alt="post"
                          className="w-11 h-11 rounded-lg object-cover shrink-0"
                        />
                      )}

                      {/* Unread dot */}
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {page < totalPages && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="text-sm text-[#9a9aaa] hover:text-white transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;