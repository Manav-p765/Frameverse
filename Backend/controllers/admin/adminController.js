import User from '../../models/user.js';
import Follow from '../../models/follow.js';

/**
 * Re-synchronizes follow/following lists and counts for all users
 * based on the authoritative Follow collection.
 */
export const syncFollowStats = async (req, res) => {
    try {
        const users = await User.find({});
        const results = [];

        for (const user of users) {
            // Get all followers for this user
            const followers = await Follow.find({ followingId: user._id, isActive: true }).select('followerId');
            const followerIds = followers.map(f => f.followerId);

            // Get all users this person is following
            const following = await Follow.find({ followerId: user._id, isActive: true }).select('followingId');
            const followingIds = following.map(f => f.followingId);

            // Update user document
            user.followers = followerIds;
            user.following = followingIds;
            user.followersCount = followerIds.length;
            user.followingCount = followingIds.length;

            await user.save({ validateBeforeSave: false });
            results.push({ username: user.username, followers: user.followersCount, following: user.followingCount });
        }

        res.status(200).json({
            message: "Synchronization complete",
            totalUsers: users.length,
            details: results
        });
    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ message: "Failed to synchronize stats", error: error.message });
    }
};
