import { useEffect, useRef } from "react";
import { createLayout, createScope, stagger } from "animejs";

export default function ExploreGrid({ posts, onPostClick }) {
    const rootRef = useRef(null);
    const scopeRef = useRef(null);

    // anime.js createLayout: animates cards with a staggered entrance
    // when they first appear in the DOM (after API fetch completes)
    useEffect(() => {
        if (!rootRef.current || !posts.length) return;

        scopeRef.current = createScope({ root: rootRef }).add(() => {
            createLayout(rootRef.current, {
                duration: 600,
                ease: "outExpo",
                delay: stagger(40),
                enterFrom: {
                    opacity: 0,
                    transform: "translateY(60px) scale(0.9)",
                    duration: 500,
                    ease: "out(3)",
                    delay: stagger(50, { from: "first" }),
                },
            });
        });

        return () => {
            if (scopeRef.current) scopeRef.current.revert();
        };
    }, [posts]);

    if (!posts.length) return null;

    return (
        <div ref={rootRef} className="columns-2 lg:columns-3 gap-3">
            {posts.map((post, index) => (
                <div
                    key={post._id}
                    className="break-inside-avoid mb-3 rounded-2xl overflow-hidden relative cursor-pointer bg-[#1e1e24] transition-transform duration-200 hover:scale-[1.02] group"
                    onClick={() => onPostClick(index)}
                >
                    <img
                        src={post.image?.url}
                        alt={post.description || "Post"}
                        loading="lazy"
                        className="w-full block object-cover"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full bg-brand-purple overflow-hidden flex items-center justify-center shrink-0">
                                {post.owner?.profilePic ? (
                                    <img src={post.owner.profilePic} alt={post.owner.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-xs font-bold">
                                        {post.owner?.username?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-white text-[13px] font-bold drop-shadow-md">
                                {post.owner?.username}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="flex items-center gap-1 text-white/90 text-xs font-medium">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-brand-pink">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                {post.likeCount || 0}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
