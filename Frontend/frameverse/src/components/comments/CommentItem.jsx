import React from 'react';
import { Trash2 } from 'lucide-react';

const CommentItem = ({ comment, currentUser, onDelete }) => {
    const { _id, userId, text, createdAt } = comment;
    const isOwner = currentUser?._id && String(userId?._id) === String(currentUser._id);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex gap-3 group">
            {userId?.profilePic ? (
                <img
                    src={userId.profilePic}
                    alt={userId.username}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xs">
                        {userId?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-text-primary text-sm font-bold truncate">
                        {userId?.username || 'Unknown'}
                    </span>
                    <span className="text-text-secondary text-[11px]">
                        {formatTime(createdAt)}
                    </span>
                </div>
                <p className="text-text-primary text-sm leading-relaxed break-words bg-bg-secondary/40 p-2.5 rounded-2xl rounded-tl-none">
                    {text}
                </p>
            </div>
            {isOwner && (
                <button
                    onClick={() => onDelete(_id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 h-fit text-text-secondary hover:text-brand-pink transition-all"
                    title="Delete comment"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

export default CommentItem;
