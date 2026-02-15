import { useState, useEffect } from "react";
import PostCard from "./Postcard";

const PostViewer = ({ posts = [], initialIndex = 0, onClose, profile }) => {
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

    return (
        <div className="fixed inset-0
  z-50
  flex flex-col items-center justify-center
  bg-black/40
  backdrop-blur-md
  transition-all duration-300">

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white text-2xl"
            >
                ✕
            </button>

            {/* Previous */}
            {currentIndex > 0 && (
                <button
                    onClick={prevPost}
                    className="absolute left-5 text-white text-3xl"
                >
                    ‹
                </button>
            )}

            {/* Post */}
            <div className="w-full max-w-xl">
                <PostCard
                    post={posts[currentIndex]}
                    profile={profile}
                />
            </div>

            {/* Next */}
            {currentIndex < posts.length - 1 && (
                <button
                    onClick={nextPost}
                    className="absolute right-5 text-white text-3xl"
                >
                    ›
                </button>
            )}
        </div>
    );
};

export default PostViewer;
