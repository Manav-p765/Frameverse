import { useState, useEffect } from "react";
import PostCard from "../posts/PostCard";
import CommentPanel from "../comments/CommentPanel";

const PostViewer = ({ posts = [], initialIndex = 0, onClose, profile, onDeletePost, onLikeToggle, onPostUpdate, currentUser }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex])

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "ArrowRight") nextPost();
            if (e.key === "ArrowLeft") prevPost();
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [currentIndex]);

    if (!posts.length) return null;

    const nextPost = () => {
        if (currentIndex < posts.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prevPost = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const currentPost = posts[currentIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/60 backdrop-blur-md transition-all duration-300">
            {/* Navigation */}
            <div className="flex items-center justify-center w-full h-full max-w-7xl px-4 gap-6">
                {/* Previous */}
                {currentIndex > 0 && (
                    <button
                        onClick={prevPost}
                        className="hidden md:block text-text-primary text-4xl hover:text-brand-purple transition-colors"
                    >
                        ‹
                    </button>
                )}

                {/* Main Content Area */}
                <div className="w-full max-w-5xl md:max-w-6xl">
                    <PostCard
                        post={currentPost}
                        profile={profile}
                        onDeletePost={onDeletePost}
                        onLikeToggle={onLikeToggle}
                        onPostUpdate={onPostUpdate}
                        currentUser={currentUser}
                        onClose={onClose}
                    />
                </div>

                {/* Next */}
                {currentIndex < posts.length - 1 && (
                    <button
                        onClick={nextPost}
                        className="hidden md:block text-text-primary text-4xl hover:text-brand-purple transition-colors"
                    >
                        ›
                    </button>
                )}
            </div>

            <style>{`
                .glass-morphism {
                    background: rgba(15, 15, 15, 0.4);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
            `}</style>
        </div>
    );
};

export default PostViewer;
