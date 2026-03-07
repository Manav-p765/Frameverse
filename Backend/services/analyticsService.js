import redis from '../config/redis.js';
import User from '../models/user.js';
import Message from '../models/message.js';
import Chat from '../models/chat.js';
import Post from '../models/post.js';
import PostEngagementDaily from '../models/postEngagementDaily.js';

const CACHE_TTL = 300; // 5 minutes in seconds

const getCache = async (key) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
};

const setCache = async (key, data) => {
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
};

export const getOverviewService = async (timeframe = '30d') => {
    const cacheKey = `analytics:overview:${timeframe}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const todayStr = new Date().toISOString().split('T')[0];
    const startOfToday = new Date(todayStr);

    let startDate;
    if (timeframe === '7d') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (timeframe === '90d') startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    else if (timeframe === 'all') startDate = new Date(0);
    else startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30d

    const [totalUsers, activeUsersObj, totalMessages, totalChats, newRegToday, newPostsToday, totalPosts] = await Promise.all([
        User.countDocuments(),
        Message.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: "$sender" } },
            { $count: "activeUsers" }
        ]),
        Message.countDocuments(),
        Chat.countDocuments(),
        User.countDocuments({ createdAt: { $gte: startOfToday } }),
        Post.countDocuments({ createdAt: { $gte: startOfToday } }),
        Post.countDocuments()
    ]);

    const activeUsers = activeUsersObj.length > 0 ? activeUsersObj[0].activeUsers : 0;

    const data = {
        totalUsers,
        activeUsers,
        totalMessages,
        totalChats,
        newRegistrationsToday: newRegToday,
        newPostsToday,
        totalPosts
    };

    await setCache(cacheKey, data);
    return data;
};

export const getTrendingPostsService = async () => {
    const cacheKey = 'analytics:trending_posts';
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const posts = await Post.find()
        .sort({ trendingScore: -1 })
        .limit(10)
        .populate('owner', 'username profilePic')
        .lean();

    await setCache(cacheKey, posts);
    return posts;
};

export const getDailyPlatformActivityService = async (timeframe = '15d') => {
    const cacheKey = `analytics:platform_activity:${timeframe}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let days = 15;
    if (timeframe === '7d') days = 7;
    else if (timeframe === '30d') days = 30;
    else if (timeframe === '90d') days = 90;
    else if (timeframe === 'all') days = 365; // Arbitrary for "all" in this context

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Aggregates history across all posts for a global view
    const activity = await PostEngagementDaily.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
            $group: {
                _id: "$date",
                likes: { $sum: "$likes" },
                shares: { $sum: "$shares" },
                comments: { $sum: "$comments" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    await setCache(cacheKey, activity);
    return activity;
};

// Existing services updated to use Redis
export const getUserGrowthService = async (timeframe = '30d') => {
    const cacheKey = `analytics:user_growth:${timeframe}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let days = 30;
    if (timeframe === '7d') days = 7;
    else if (timeframe === '90d') days = 90;
    else if (timeframe === 'all') days = 365;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    await setCache(cacheKey, data);
    return data;
};

export const getTopUsersService = async () => {
    const cacheKey = 'analytics:top_users';
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const data = await Message.aggregate([
        { $group: { _id: "$sender", messageCount: { $sum: 1 } } },
        { $sort: { messageCount: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
        { $unwind: "$userInfo" },
        {
            $project: {
                _id: 1,
                messageCount: 1,
                username: "$userInfo.username",
                avatar: "$userInfo.profilePic",
                lastActive: "$userInfo.updatedAt"
            }
        }
    ]);

    await setCache(cacheKey, data);
    return data;
};

export const getMessageActivityService = async (timeframe = '30d') => {
    const cacheKey = `analytics:message_activity:${timeframe}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let days = 30;
    if (timeframe === '7d') days = 7;
    else if (timeframe === '90d') days = 90;
    else if (timeframe === 'all') days = 365;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const data = await Message.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    await setCache(cacheKey, data);
    return data;
};

