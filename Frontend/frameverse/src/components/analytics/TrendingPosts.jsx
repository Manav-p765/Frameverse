import React from 'react';
import { Heart, MessageCircle, Share2, Flame } from 'lucide-react';

const TrendingPosts = ({ posts }) => {
    return (
        <div className="bg-bg-secondary/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        Trending Content
                        <Flame className="text-brand-orange animate-pulse" size={20} />
                    </h3>
                    <p className="text-sm text-text-secondary">Highest engagement in last 72 hours</p>
                </div>
            </div>

            <div className="space-y-4">
                {posts?.map((post, index) => (
                    <div
                        key={post._id}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                        {/* Index Badge */}
                        <div className="w-8 text-xl font-bold italic text-text-secondary/20 group-hover:text-brand-purple/40 transition-colors">
                            #{index + 1}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
                            <img
                                src={post.image.url}
                                alt="post"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-1.5">
                                <div className="flex items-center gap-0.5 text-[10px] text-white font-bold">
                                    <Flame size={10} className="text-brand-orange" />
                                    {Math.round(post.trendingScore || 0)}
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-brand-purple transition-colors">
                                {post.description || "No description"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <img
                                    src={post.owner?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.owner?.username || 'user'}`}
                                    className="w-4 h-4 rounded-full border border-white/10"
                                    alt="owner"
                                />
                                <span className="text-xs text-text-secondary uppercase tracking-wider font-bold">
                                    {post.owner?.username}
                                </span>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="hidden md:flex items-center gap-4 px-4 text-xs font-bold text-text-secondary">
                            <div className="flex flex-col items-center gap-1">
                                <Heart size={14} className="text-rose-500" />
                                <span>{post.likeCount || 0}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <MessageCircle size={14} className="text-brand-purple" />
                                <span>{post.commentCount || 0}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Share2 size={14} className="text-brand-orange" />
                                <span>{post.sharesCount || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {!posts?.length && (
                    <div className="py-12 text-center">
                        <p className="text-text-secondary italic">No trending posts yet. Keep engaging!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrendingPosts;
