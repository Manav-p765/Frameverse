import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, UserPlus, ImagePlus } from "lucide-react";
import { notificationAPI } from "../services/api";
import { useSocketEvent } from "../hooks/useSocket";

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
};

const notifMeta = {
    follow: { icon: UserPlus, text: "followed you", color: "text-blue-400", bg: "bg-blue-500/10" },
    like: { icon: Heart, text: "liked your post", color: "text-pink-400", bg: "bg-pink-500/10" },
    new_post: { icon: ImagePlus, text: "new post", color: "text-green-400", bg: "bg-green-500/10" },
};

const NotificationSidebar = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        notificationAPI.getNotifications(1).then((data) => {
            setNotifications(data.notifications);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Real-time
    useSocketEvent(
        "new-notification",
        useCallback((notif) => {
            setNotifications((prev) => [notif, ...prev.slice(0, 19)]); // keep max 20
        }, [])
    );

    const handleClick = (notif) => {
        if (notif.type === "follow") navigate(`/profile/${notif.sender._id}`);
        else navigate(`/profile/${notif.sender._id}`);
    };

    return (
        <div className="w-full">
            <h3 className="text-sm font-semibold text-[#7a7a8a] uppercase tracking-wider mb-3 px-2">
                Notifications
            </h3>

            {loading ? (
                <div className="space-y-3 px-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-[#2a2a30]" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-[#2a2a30] rounded w-3/4" />
                                <div className="h-2.5 bg-[#2a2a30] rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2">
                    <Heart size={20} className="text-[#3a3a4a]" />
                    <p className="text-[#5a5a6a] text-xs">No notifications yet</p>
                </div>
            ) : (
                <div className="space-y-0.5">
                    {notifications.slice(0, 15).map((notif) => {
                        const meta = notifMeta[notif.type] || notifMeta.follow;
                        const Icon = meta.icon;
                        return (
                            <button
                                key={notif._id}
                                onClick={() => handleClick(notif)}
                                className={`w-full flex items-center gap-2.5 px-2 py-2 transition-colors text-left
                  rounded-lg hover:bg-white/5
                  ${!notif.read ? "bg-white/[0.02]" : ""}`}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    {notif.sender?.profilePic ? (
                                        <img
                                            src={notif.sender.profilePic}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#2a2a30] flex items-center justify-center text-white text-xs font-medium uppercase">
                                            {notif.sender?.username?.[0] || "?"}
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${meta.bg} flex items-center justify-center border-[1.5px] border-[#18181c]`}>
                                        <Icon size={8} className={meta.color} />
                                    </div>
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white leading-snug truncate">
                                        <span className="font-semibold">{notif.sender?.username}</span>{" "}
                                        <span className="text-[#7a7a8a]">{meta.text}</span>
                                    </p>
                                    <p className="text-[10px] text-[#5a5a6a]">{timeAgo(notif.createdAt)}</p>
                                </div>

                                {/* Thumbnail */}
                                {notif.post?.image?.url && (
                                    <img src={notif.post.image.url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                )}

                                {/* Unread */}
                                {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationSidebar;
