import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, UserCheck } from "lucide-react";
import api from "../services/post.service";

const SuggestedUser = ({ user, onFollowComplete }) => {
    const navigate = useNavigate();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleFollow = async (e) => {
        e.stopPropagation();
        if (loading) return;
        setLoading(true);
        try {
            await api.post(`/user/follow/${user.userId}`);
            setIsFollowing(true);
            setTimeout(() => {
                if (onFollowComplete) onFollowComplete(user.userId);
            }, 1000);
        } catch (error) {
            console.error("Failed to follow user:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={() => navigate(`/profile/${user.userId}`)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0 w-10 h-10">
                    {user.profilePic ? (
                        <img src={user.profilePic} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary text-sm font-medium uppercase">
                            {user.username?.[0] || "?"}
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate group-hover:text-brand-purple transition-colors">
                        {user.username}
                    </p>
                    {user.mutualConnections > 0 ? (
                        <p className="text-xs text-text-secondary truncate mt-0.5">
                            {user.mutualConnections} mutual connections
                        </p>
                    ) : (
                        <p className="text-xs text-text-secondary truncate mt-0.5">
                            Suggested for you
                        </p>
                    )}
                </div>
            </div>

            <button
                onClick={handleFollow}
                disabled={loading || isFollowing}
                className={`ml-3 shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${isFollowing
                        ? "bg-bg-secondary text-text-primary border border-white/10"
                        : "bg-brand-purple text-white hover:bg-opacity-90 shadow-md shadow-brand-purple/20"
                    }`}
            >
                {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isFollowing ? (
                    <>
                        <UserCheck size={14} />
                        <span>Following</span>
                    </>
                ) : (
                    <>
                        <UserPlus size={14} />
                        <span>Follow</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default SuggestedUser;
