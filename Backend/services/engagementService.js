import mongoose from 'mongoose';
import User from '../models/user.js';
import Post from '../models/post.js';
import FeedService from './feedService.js';
import Like from '../models/like.js';
import Follow from '../models/follow.js';
import Notification from '../models/notification.js';
import PostEngagementDaily from '../models/postEngagementDaily.js';
import redis from '../config/redis.js';

class EngagementService {
    /**
     * Follow/Unfollow User with Transactions and Soft Deletes
     */
    async toggleFollow(followerId, followingId) {
        console.log(`[toggleFollow] followerId=${followerId}, followingId=${followingId}`);
        if (followerId.toString() === followingId.toString()) throw new Error("Cannot follow yourself");

        try {
            let follow = await Follow.findOne({ followerId, followingId });
            let isFollowing = false;

            if (follow) {
                // Toggle isActive
                follow.isActive = !follow.isActive;
                await follow.save();
                isFollowing = follow.isActive;
            } else {
                // Create new follow record
                follow = await Follow.create({ followerId, followingId, isActive: true });
                isFollowing = true;
            }

            // Update Counters and Lists
            const incAmount = isFollowing ? 1 : -1;
            const updateOp = isFollowing ? '$addToSet' : '$pull';

            await User.findByIdAndUpdate(followerId, {
                $inc: { followingCount: incAmount },
                [updateOp]: { following: followingId }
            });

            await User.findByIdAndUpdate(followingId, {
                $inc: { followersCount: incAmount },
                [updateOp]: { followers: followerId }
            });

            // Notification logic
            if (isFollowing) {
                this.sendNotification(followingId, followerId, 'follow');
            }

            // Invalidate feeds and recommendations
            await FeedService.invalidateFeed(followerId);
            await FeedService.invalidateFeed(followingId);

            // Delete recommendation caches to reflect new follow state
            try {
                await redis.del(`suggested:users:${followerId}`);
            } catch (rErr) {
                console.error("Redis del error:", rErr);
            }

            return { isFollowing, followersCount: (await User.findById(followingId)).followersCount };
        } catch (error) {
            console.error("Follow error:", error);
            throw error;
        }
    }

    /**
     * Like/Unlike Post with Transactions and Soft Deletes
     */
    async toggleLike(userId, postId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let like = await Like.findOne({ userId, postId }).session(session);
            let isLiked = false;

            if (like) {
                like.isActive = !like.isActive;
                await like.save({ session });
                isLiked = like.isActive;
            } else {
                like = await Like.create([{ userId, postId, isActive: true }], { session });
                isLiked = true;
            }

            // Update Post Counter and Likes Array
            const incAmount = isLiked ? 1 : -1;
            const updateOp = isLiked ? '$addToSet' : '$pull';
            const post = await Post.findByIdAndUpdate(
                postId,
                {
                    $inc: { likeCount: incAmount },
                    [updateOp]: { likes: userId }
                },
                { session, new: true }
            );

            await session.commitTransaction();

            // Track Daily Engagement
            this.trackEngagement(postId, 'likes', incAmount);

            // Invalidate Feed for the liker
            await FeedService.invalidateFeed(userId);

            // Notification
            if (isLiked && post.owner.toString() !== userId.toString()) {
                this.sendNotification(post.owner, userId, 'like', postId);
            }

            return { isLiked, likeCount: post.likeCount };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Share Post logic
     */
    async sharePost(userId, postId) {
        const post = await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } }, { new: true });
        if (!post) throw new Error("Post not found");

        this.trackEngagement(postId, 'shares', 1);
        this.sendNotification(post.owner, userId, 'share', postId);

        // Invalidate Feed
        await FeedService.invalidateFeed(userId);

        return post;
    }

    /**
     * Internal: Track engagement for history and trending analytics
     */
    async trackEngagement(postId, type, amount) {
        const today = new Date().toISOString().split('T')[0];
        try {
            await PostEngagementDaily.findOneAndUpdate(
                { postId, date: today },
                { $inc: { [type]: amount } },
                { upsert: true, new: true }
            );
        } catch (err) {
            console.error("Engagement tracking error:", err);
        }
    }

    /**
     * Internal: Trigger notifications
     */
    async sendNotification(recipient, sender, type, post = null) {
        try {
            const notif = await Notification.findOneAndUpdate(
                { recipient, sender, type, post },
                { read: false }, // Reset read status if same action repeated
                { upsert: true, new: true }
            );
            // In a real app, emit via socket.io here if needed
        } catch (err) {
            console.error("Notification trigger error:", err);
        }
    }
}

export default new EngagementService();
