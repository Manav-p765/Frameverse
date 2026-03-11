import { Router } from "express";
import { isLoggedIn } from "../middleware.js";
import PushSubscription from "../models/pushSubscription.js";
import { VAPID_PUBLIC } from "../utils/pushNotifications.js";

const pushRouter = Router();

// GET /push/vapid-key — return the public key so the frontend can subscribe
pushRouter.get("/vapid-key", (req, res) => {
    if (!VAPID_PUBLIC) {
        return res.status(503).json({ message: "Push not configured" });
    }
    res.json({ publicKey: VAPID_PUBLIC });
});

// POST /push/subscribe — save a push subscription for the current user
pushRouter.post("/subscribe", isLoggedIn, async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({ message: "Invalid subscription object" });
        }

        await PushSubscription.findOneAndUpdate(
            { userId: req.userId, "subscription.endpoint": subscription.endpoint },
            { userId: req.userId, subscription },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: "Subscribed" });
    } catch (err) {
        console.error("[Push] Subscribe error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE /push/unsubscribe — remove a push subscription
pushRouter.delete("/unsubscribe", isLoggedIn, async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) return res.status(400).json({ message: "Endpoint required" });

        await PushSubscription.deleteOne({ userId: req.userId, "subscription.endpoint": endpoint });
        res.json({ message: "Unsubscribed" });
    } catch (err) {
        console.error("[Push] Unsubscribe error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default pushRouter;
