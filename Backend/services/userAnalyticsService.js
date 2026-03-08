import mongoose from "mongoose";
import redis from '../config/redis.js';
import User from "../models/user.js";
import Message from "../models/message.js";
import Follow from "../models/follow.js";
import Post from "../models/post.js";
import Like from "../models/like.js";
import Comment from "../models/comment.js";
import PostEngagementDaily from "../models/postEngagementDaily.js";
import Notification from "../models/notification.js";

const CACHE_TTL = 300; // 5 minutes

const getCache = async (key) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error("Redis get error:", err);
        return null;
    }
};

const setCache = async (key, data) => {
    try {
        await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    } catch (err) {
        console.error("Redis set error:", err);
    }
};

class UserAnalyticsService {
    /**
     * Helper to get start date from timeframe
     */
    getStartDate(timeframe) {
        if (timeframe === '7d') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (timeframe === '90d') return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        if (timeframe === 'all') return new Date(0);
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30d
    }

    /**
     * Get summary metrics for the logged-in user
     */
    async getUserSummary(userId, timeframe = '30d') {
        const cacheKey = `analytics:user:${userId}:summary:${timeframe}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const startDate = this.getStartDate(timeframe);

        // Get user's post list and follower count from Follow model (source of truth)
        const objectId = new mongoose.Types.ObjectId(userId);

        const user = await User.findById(userId)
            .select("followers profileViews posts")
            .lean();

        const followersCount = user?.followers?.length ?? 0;

        const postIds = user?.posts || [];
        const profileViews = user?.profileViews || 0;


        // Aggregate interactions on user's posts within timeframe
        const [likes, comments, shares] = await Promise.all([
            Like.countDocuments({
                postId: { $in: postIds },
                isActive: true,
                createdAt: { $gte: startDate }
            }),
            Comment.countDocuments({
                postId: { $in: postIds },
                createdAt: { $gte: startDate }
            }),
            Post.aggregate([
                { $match: { _id: { $in: postIds } } },
                { $group: { _id: null, total: { $sum: "$sharesCount" } } }
            ])
        ]);

        const totalShares = shares[0]?.total || 0;
        const totalInteractions = likes + comments + totalShares;

        // Custom engagement score formula
        const engagementScore = (likes * 2) + (comments * 4) + (totalShares * 3) + (followersCount * 10);

        const data = {
            totalPosts: postIds.length,
            likes,
            comments,
            shares: totalShares,
            totalInteractions,
            followers: followersCount,
            profileViews,
            engagementScore: Math.round(engagementScore)
        };

        await setCache(cacheKey, data);
        return data;
    }

    /**
     * Get follower growth over time
     */
    async getUserGrowth(userId, timeframe = '30d') {
        const cacheKey = `analytics:user:${userId}:growth:${timeframe}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const objectId = new mongoose.Types.ObjectId(userId);
        const startDate = this.getStartDate(timeframe);

        const growth = await Follow.aggregate([
            {
                $match: {
                    followingId: objectId,
                    isActive: true,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        await setCache(cacheKey, growth);
        console.log("Start date:", startDate);
        console.log("User growth data:", growth);
        return growth;
    }

    /**
     * Get engagement interactions breakdown for user's posts
     */
    async getEngagementStats(userId, timeframe = '30d') {
        const cacheKey = `analytics:user:${userId}:engagement_stats:${timeframe}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const user = await User.findById(userId).select("posts profileViews").lean();
        const postIds = user?.posts || [];
        const startDate = this.getStartDate(timeframe);

        const [likes, comments, posts] = await Promise.all([
            postIds.length ? Like.countDocuments({ postId: { $in: postIds }, isActive: true, createdAt: { $gte: startDate } }) : 0,
            postIds.length ? Comment.countDocuments({ postId: { $in: postIds }, createdAt: { $gte: startDate } }) : 0,
            postIds.length ? Post.find({ _id: { $in: postIds } }).select("sharesCount").lean() : []
        ]);

        const totalShares = Array.isArray(posts) ? posts.reduce((acc, p) => acc + (p?.sharesCount || 0), 0) : 0;

        const data = {
            likes,
            comments,
            shares: totalShares,
            profileViews: user?.profileViews || 0
        };

        await setCache(cacheKey, data);
        return data;
    }

    /**
     * Get engagement history (daily) for charts
     */
    async getEngagementHistory(userId, timeframe = '30d') {
        const cacheKey = `analytics:user:${userId}:engagement_history:${timeframe}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const user = await User.findById(userId).select("posts");
        const postIds = user?.posts || [];
        const startDate = this.getStartDate(timeframe).toISOString().split('T')[0];

        const history = await PostEngagementDaily.aggregate([
            {
                $match: {
                    postId: { $in: postIds },
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: "$date",
                    likes: { $sum: "$likes" },
                    comments: { $sum: "$comments" },
                    shares: { $sum: "$shares" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        await setCache(cacheKey, history);
        return history;
    }

    /**
     * Get user's own trending posts
     */
    async getTrendingPosts(userId) {
        const cacheKey = `analytics:user:${userId}:trending`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const posts = await Post.find({ owner: userId })
            .sort({ trendingScore: -1 })
            .limit(10)
            .populate("owner", "username profilePic")
            .lean();

        await setCache(cacheKey, posts);
        return posts;
    }

    /**
     * Get recent interactions on user's content (from Notifications)
     */
    async getRecentActivity(userId) {
        const cacheKey = `analytics:user:${userId}:recent_activity`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const activities = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("sender", "username profilePic")
            .populate("post", "image")
            .lean();

        // Format for frontend consistency
        const formatted = activities.map(notif => ({
            id: notif._id,
            type: notif.type,
            user: {
                username: notif.sender?.username || 'Unknown',
                profilePic: notif.sender?.profilePic
            },
            postImage: notif.post?.image?.url,
            description:
                notif.type === 'like' ? 'liked your post' :
                    notif.type === 'comment' ? 'commented on your post' :
                        notif.type === 'follow' ? 'started following you' :
                            notif.type === 'share' ? 'shared your post' : 'interacted with you',
            createdAt: notif.createdAt
        }));

        await setCache(cacheKey, formatted);
        return formatted;
    }

    /**
     * Heatmap: Interaction count by hour of day (on user's posts)
     */
    async getActiveHours(userId) {
        const cacheKey = `analytics:user:${userId}:active_hours`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const objectId = new mongoose.Types.ObjectId(userId);

        const hourlyStats = await Notification.aggregate([
            {
                $match: { recipient: objectId }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const formatted = Array.from({ length: 24 }, (_, i) => {
            const found = hourlyStats.find(h => h._id === i);
            return {
                hour: i,
                count: found ? found.count : 0
            };
        });

        await setCache(cacheKey, formatted);
        return formatted;
    }

    /**
     * Batch fetch all dashboard data in one call (reduces 5 HTTP round-trips to 1)
     */
    async getDashboardBatch(userId, timeframe = '30d') {
        const [summary, growth, trending, engagement, recent] = await Promise.all([
            this.getUserSummary(userId, timeframe),
            this.getUserGrowth(userId, timeframe),
            this.getTrendingPosts(userId),
            this.getEngagementStats(userId, timeframe),
            this.getRecentActivity(userId)
        ]);

        return { summary, growth, trending, engagement, recent };
    }
}

export default new UserAnalyticsService();
