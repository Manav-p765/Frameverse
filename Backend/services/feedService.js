import Post from "../models/post.js";
import User from "../models/user.js";
import redis from "../config/redis.js";
import mongoose from "mongoose";

const FEED_CACHE_TTL = 120; // 120 seconds as requested

class FeedService {
    /**
     * Calculate Feed Score for a single post relative to a user
     */
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
            // Mutual Follow check (* 3)
            const isMutual = mutualFollows.some(id => id.toString() === post.owner._id.toString());
            if (isMutual) relationshipScore += 3;

            // Simplified Relationship signals for this demo
            // If user has liked the owner's profile or previous posts (pastInteractions proxy)
            // For now, we use a simple weight if they follow them at all
            if (user.following.some(id => id.toString() === post.owner._id.toString())) {
                relationshipScore += 2;
            }
        }

        // Apply weights for balanced scoring (recency needs a multiplier to compete with engagement integers)
        return engagementScore + (recencyScore * 50) + relationshipScore;
    }

    /**
     * Get or Rebuild Feed
     */
    async getUserFeed(userId, page = 1, limit = 20) {
        const cacheKey = `feed:user:${userId}`;

        // Return from cache if exists
        if (page === 1) {
            const cachedFeed = await redis.get(cacheKey);
            if (cachedFeed) {
                return JSON.parse(cachedFeed);
            }
        }

        // Rebuild Feed
        const user = await User.findById(userId).populate('following');
        const followingIds = user?.following?.map(f => f._id) || [];

        // Find mutual follows: people you follow who also follow you
        const mutualFollows = user?.following?.filter(f =>
            f.followers && f.followers.some(fid => fid.toString() === userId)
        ).map(f => f._id) || [];

        // Fetch recent posts
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(100) // Consider top 100 recent posts
            .populate('owner', 'username profilePic followers');

        // Score and Sort
        const scoredPosts = posts.map(post => ({
            ...post.toObject(),
            likedByCurrentUser: user ? post.likes.some(id => id.toString() === userId) : false,
            feedScore: this.calculateFeedScore(post, user, mutualFollows)
        })).sort((a, b) => b.feedScore - a.feedScore);

        const feedResult = scoredPosts.slice((page - 1) * limit, page * limit);

        // Cache the first page
        if (page === 1) {
            await redis.setex(cacheKey, FEED_CACHE_TTL, JSON.stringify(feedResult));
        }

        return feedResult;
    }

    /**
     * Invalidate Feed Cache
     */
    async invalidateFeed(userId) {
        await redis.del(`feed:user:${userId}`);
    }

    /**
     * Targeted invalidation for a user's followers (e.g., when they post)
     */
    async invalidateFollowersFeeds(userId) {
        const user = await User.findById(userId).select('followers');
        if (user?.followers) {
            const pipeline = redis.pipeline();
            user.followers.forEach(followerId => {
                pipeline.del(`feed:user:${followerId}`);
            });
            await pipeline.exec();
        }
    }
}

export default new FeedService();
