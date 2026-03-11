/**
 * Notification Controller
 *
 * Handles fetching paginated notifications, marking them as read,
 * and retrieving unread counts for badge display.
 */

import Notification from "../models/notification.js";

/**
 * Get paginated notifications for the authenticated user.
 * Returns notifications sorted by newest first, with sender/post populated,
 * along with unread count and pagination metadata.
 */
export const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 30;
        const skip = (page - 1) * limit;

        // Fetch notifications + total count in parallel for efficiency
        const [notifications, total] = await Promise.all([
            Notification.find({ recipient: req.userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("sender", "username profilePic")
                .populate("post", "image description"),
            Notification.countDocuments({ recipient: req.userId }),
        ]);

        // Separate query for unread count (used for badge UI)
        const unreadCount = await Notification.countDocuments({
            recipient: req.userId,
            read: false,
        });

        return res.status(200).json({
            notifications,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error("Get notifications error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Mark all unread notifications as read for the authenticated user.
 * Typically called when the user opens the notification panel.
 */
export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.userId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (err) {
        console.error("Mark read error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get the count of unread notifications for the authenticated user.
 * Used by the frontend to display notification badge numbers.
 */
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.userId,
            read: false,
        });
        return res.status(200).json({ count });
    } catch (err) {
        console.error("Unread count error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
