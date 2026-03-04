import express from "express";
import Call from "../models/call.js";

const router = express.Router();

/**
 * GET /api/calls/history/:userId
 * Returns the 50 most recent calls for a user (as caller or receiver).
 */
router.get("/history/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);

        const calls = await Call.find({
            $or: [{ callerId: userId }, { receiverId: userId }],
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("callerId", "username profilePic")
            .populate("receiverId", "username profilePic")
            .lean();

        res.json(calls);
    } catch (err) {
        console.error("[CallRoutes] history error:", err);
        res.status(500).json({ error: "Failed to fetch call history" });
    }
});

/**
 * GET /api/calls/missed/:userId
 * Returns the count of missed calls for a user.
 */
router.get("/missed/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const count = await Call.countDocuments({
            receiverId: userId,
            status: { $in: ["missed", "timeout"] },
        });

        res.json({ missedCount: count });
    } catch (err) {
        console.error("[CallRoutes] missed count error:", err);
        res.status(500).json({ error: "Failed to fetch missed call count" });
    }
});

export default router;
