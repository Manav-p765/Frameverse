import webPush from "web-push";
import PushSubscription from "../models/pushSubscription.js";

// ─── VAPID config ────────────────────────────────────────────────────────────
// Generate keys once:  npx web-push generate-vapid-keys
// Then set them in your .env file.
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@frameverse.online";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
    console.log("✅ Web Push VAPID configured.");
} else {
    console.warn("⚠️  VAPID keys not set — push notifications disabled. Set VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY in .env");
}

/**
 * Send a push notification to ALL subscriptions of a given user.
 * @param {string} userId
 * @param {{ title: string, body: string, icon?: string, url?: string, tag?: string }} payload
 */
export async function sendPushToUser(userId, payload) {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

    const subs = await PushSubscription.find({ userId });
    if (!subs.length) return;

    const data = JSON.stringify(payload);

    const results = await Promise.allSettled(
        subs.map((sub) =>
            webPush.sendNotification(sub.subscription, data).catch(async (err) => {
                // If subscription is expired or invalid (410/404), remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                    console.log("[Push] Removed stale subscription for user", userId);
                }
                throw err;
            })
        )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[Push] Sent ${sent}/${subs.length} notifications to user ${userId}`);
}

export { VAPID_PUBLIC };
