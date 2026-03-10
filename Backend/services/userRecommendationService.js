import mongoose from "mongoose";
import Follow from "../models/follow.js";
import Like from "../models/like.js";
import Comment from "../models/comment.js";
import User from "../models/user.js";
import redisClient from "../config/redis.js";

export const getRecommendations = async (userId) => {
    try {
        const cacheKey = `suggested:users:${userId}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 1. Get current user's followings
        const followingDocs = await Follow.find({ followerId: userObjectId, isActive: true }).select("followingId");
        const followingIds = followingDocs.map(f => f.followingId);

        // Users to exclude: current user + already followed users
        const excludeFilter = [...followingIds, userObjectId];

        // 2. Calculate Mutual Follows (Weight: 3)
        const mutualFollows = await Follow.aggregate([
            { $match: { followerId: { $in: followingIds }, isActive: true, followingId: { $nin: excludeFilter } } },
            { $group: { _id: "$followingId", connections: { $sum: 1 } } }
        ]);

        const scores = {}; 

        mutualFollows.forEach(m => {
            const idStr = m._id.toString();
            scores[idStr] = {
                score: m.connections * 3,
                mutualConnections: m.connections
            };
        });

        // 3. Shared Engagement (Weight: 2)
        const myLikedPosts = await Like.find({ userId: userObjectId, isActive: true }).select("postId");
        const myLikedPostIds = myLikedPosts.map(l => l.postId);

        const myCommentedPosts = await Comment.find({ userId: userObjectId }).select("postId");
        const myCommentedPostIds = myCommentedPosts.map(c => c.postId);

        const sharedPostIds = [...new Set([...myLikedPostIds.map(id => id.toString()), ...myCommentedPostIds.map(id => id.toString())])].map(id => new mongoose.Types.ObjectId(id));

        if (sharedPostIds.length > 0) {
            const sharedLikes = await Like.aggregate([
                { $match: { postId: { $in: sharedPostIds }, userId: { $nin: excludeFilter }, isActive: true } },
                { $group: { _id: "$userId", count: { $sum: 1 } } }
            ]);

            sharedLikes.forEach(m => {
                const idStr = m._id.toString();
                if (!scores[idStr]) scores[idStr] = { score: 0, mutualConnections: 0 };
                scores[idStr].score += m.count * 2;
            });

            const sharedComments = await Comment.aggregate([
                { $match: { postId: { $in: sharedPostIds }, userId: { $nin: excludeFilter } } },
                { $group: { _id: "$userId", count: { $sum: 1 } } }
            ]);

            sharedComments.forEach(m => {
                const idStr = m._id.toString();
                if (!scores[idStr]) scores[idStr] = { score: 0, mutualConnections: 0 };
                scores[idStr].score += m.count * 2;
            });
        }

        // 4. Interaction Signals (Weight: 1)
        const interactedUsersViaLikes = await Like.aggregate([
            { $match: { userId: userObjectId, isActive: true } },
            { $lookup: { from: "posts", localField: "postId", foreignField: "_id", as: "post" } },
            { $unwind: "$post" },
            { $match: { "post.owner": { $nin: excludeFilter } } },
            { $group: { _id: "$post.owner", count: { $sum: 1 } } }
        ]);

        interactedUsersViaLikes.forEach(m => {
            const idStr = m._id.toString();
            if (!scores[idStr]) scores[idStr] = { score: 0, mutualConnections: 0 };
            scores[idStr].score += m.count * 1;
        });

        const interactedUsersViaComments = await Comment.aggregate([
            { $match: { userId: userObjectId } },
            { $lookup: { from: "posts", localField: "postId", foreignField: "_id", as: "post" } },
            { $unwind: "$post" },
            { $match: { "post.owner": { $nin: excludeFilter } } },
            { $group: { _id: "$post.owner", count: { $sum: 1 } } }
        ]);

        interactedUsersViaComments.forEach(m => {
            const idStr = m._id.toString();
            if (!scores[idStr]) scores[idStr] = { score: 0, mutualConnections: 0 };
            scores[idStr].score += m.count * 1;
        });

        // Convert to array and sort
        const sortedUserIds = Object.keys(scores)
            .sort((a, b) => scores[b].score - scores[a].score)
            .slice(0, 10);

        if (sortedUserIds.length === 0) {
            return [];
        }

        // Fetch user data
        const usersToFetch = sortedUserIds.map(id => new mongoose.Types.ObjectId(id));
        const users = await User.find({ _id: { $in: usersToFetch } })
            .select("_id username profilePic followersCount");

        // Map final result
        const result = users.map(u => {
            const idStr = u._id.toString();
            return {
                userId: idStr,
                username: u.username,
                profilePic: u.profilePic || "",
                mutualConnections: scores[idStr].mutualConnections || 0,
                score: scores[idStr].score
            };
        }).sort((a, b) => b.score - a.score);

        // Cache for 10 minutes (600 seconds)
        await redisClient.setex(cacheKey, 600, JSON.stringify(result));

        return result;

    } catch (error) {
        console.error("Error generating recommendations:", error);
        throw error;
    }
};
