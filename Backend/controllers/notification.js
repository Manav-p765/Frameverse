import Notification from "../models/notification.js";

// GET /notifications?page=1
export const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 30;
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find({ recipient: req.userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("sender", "username profilePic")
                .populate("post", "image description"),
            Notification.countDocuments({ recipient: req.userId }),
        ]);

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

// PATCH /notifications/read
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

// GET /notifications/unread-count
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
