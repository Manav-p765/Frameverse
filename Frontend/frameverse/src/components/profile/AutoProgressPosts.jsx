import React, { useState } from "react";

const AutoProgressPosts = ({ posts, onPostClick }) => {
    const [imageErrors, setImageErrors] = useState({});

    const handleImageError = (postId) => {
        setImageErrors((prev) => ({ ...prev, [postId]: true }));
    };

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100 text-text-secondary">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">No auto-progress posts yet</h3>
                <p className="text-text-secondary text-center max-w-sm">
                    Enable Auto-Post in settings to automatically share your daily coding progress!
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-1 w-full">
            {posts.map((post) => (
                <div
                    key={post._id}
                    className="relative w-full group cursor-pointer"
                    onClick={() => onPostClick(post)}
                >
                    <div className="relative w-full aspect-square overflow-hidden bg-bg-primary">
                        {imageErrors[post._id] ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    className="text-gray-600 mb-2"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                                <p className="text-text-secondary text-xs text-center px-2">Image not available</p>
                            </div>
                        ) : (
                            <img
                                src={post.images?.[0] || post.image?.url}
                                alt="Auto Progress"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={() => handleImageError(post._id)}
                            />
                        )}

                        {/* ⚡ Auto badge */}
                        <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-brand-orange text-text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-lg z-10">
                            <span>⚡</span>
                            <span>Auto</span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AutoProgressPosts;
