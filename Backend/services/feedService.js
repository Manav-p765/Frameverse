import Post from "../models/post.js";
import User from "../models/user.js";
import redisClient, { isRedisAvailable } from "../config/redis.js";
import mongoose from "mongoose";
import { getCache, setCache, deleteCache } from "../utils/cache.js";

const FEED_CACHE_TTL = 120; // 120 seconds as requested

class FeedService {
    calculateFeedScore(post, user, mutualFollows = []) {
        // 1. Engagement Score: (likes * 2) + (comments * 3) + (shares * 4)
        const engagementScore =
            (post.likeCount || 0) * 2 +
            (post.commentCount || 0) * 3 +
            (post.sharesCount || 0) * 4;

        // 2. Recency Score: 1 / (hours_since_post + 2)^1.5
        const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
        const recencyScore = 1 / Math.pow(ageInHours + 2, 1.5);

        // 3. Relationship Score: (mutualFollow * 3) + (pastInteractions * 2) + (profileViews * 1)
        let relationshipScore = 0;
        if (user) {
            const isMutual = mutualFollows.some(id => id.toString() === post.owner._id.toString());
            if (isMutual) relationshipScore += 3;

            if (user.following.some(id => id.toString() === post.owner._id.toString())) {
                relationshipScore += 2;
            }
        }

        return engagementScore + (recencyScore * 50) + relationshipScore;
    }

    async getUserFeed(userId, page = 1, limit = 20) {
        const cacheKey = `feed:cache:${userId}`;

        // Return from cache if exists and it's page 1
        if (page === 1) {
            const cachedFeed = await getCache(cacheKey);
            if (cachedFeed) {
                return cachedFeed;
            }
        }

        const user = await User.findById(userId).populate('following', 'followersCount _id');
        const following = user?.following || [];

        const mutualFollows = following.filter(f =>
            f.followers && f.followers.some(fid => fid.toString() === userId)
        ).map(f => f._id) || [];

        let postIdsToFetch = [];

        // Try getting Fan-Out Feed from Redis
        let fannedOutPostIds = [];
        if (isRedisAvailable && redisClient.status !== 'mock') {
            fannedOutPostIds = await redisClient.lrange(`feed:user:${userId}`, 0, 100);

            // Fetch dynamically on read from Large Accounts (> 10k)
            const largeAccounts = following.filter(f => f.followersCount > 10000);
            if (largeAccounts.length > 0) {
                const pipeline = redisClient.pipeline();
                largeAccounts.forEach(acc => {
                    pipeline.lrange(`feed:large_accounts:${acc._id}`, 0, 10);
                });
                const largeResults = await pipeline.exec();
                largeResults.forEach(([err, ids]) => {
                    if (!err && ids && ids.length) {
                        fannedOutPostIds.push(...ids);
                    }
                });
            }
        }

        // Deduplicate
        postIdsToFetch = [...new Set(fannedOutPostIds)];

        let posts = [];

        if (postIdsToFetch.length > 0) {
            // Fetch the specific posts
            posts = await Post.find({ _id: { $in: postIdsToFetch } })
                .populate('owner', 'username profilePic followers followersCount followingCount');
        } else {
            // Fallback: Rebuild Feed from DB if Redis is empty or mocking
            posts = await Post.find()
                .sort({ createdAt: -1 })
                .limit(100) // Consider top 100 recent posts
                .populate('owner', 'username profilePic followers followersCount followingCount');
        }

        // Score and Sort
        const scoredPosts = posts.map(post => ({
            ...post.toObject(),
            likedByCurrentUser: user ? post.likes.some(id => id.toString() === userId) : false,
            feedScore: this.calculateFeedScore(post, user, mutualFollows)
        })).sort((a, b) => b.feedScore - a.feedScore);

        const feedResult = scoredPosts.slice((page - 1) * limit, page * limit);

        // Cache the fully built first page
        if (page === 1) {
            await setCache(cacheKey, feedResult, FEED_CACHE_TTL);
        }

        return feedResult;
    }

    async invalidateFeed(userId) {
        await deleteCache(`feed:cache:${userId}`);
    }

    async invalidateFollowersFeeds(userId) {
        // Enqueue fan-out job when creating post instead of just invalidating cache
        // Note: The actual enqueueing is done in the controller now `feedQueue.add(...)`
        // We still invalidate the fully resolved feed cache
        const user = await User.findById(userId).select('followers');
        if (user?.followers) {
            const pipeline = redisClient.pipeline();
            user.followers.forEach(followerId => {
                pipeline.del(`feed:cache:${followerId}`);
            });
            await pipeline.exec();
        }
    }
}

export default new FeedService();
