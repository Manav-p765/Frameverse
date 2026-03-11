import { Worker } from 'bullmq';
import redisClient, { isRedisAvailable } from '../config/redis.js';
import User from '../models/user.js';
import Notification from '../models/notification.js';
import { getIo } from '../utils/socketEmitter.js';

let notificationWorker = { on: () => { } };

if (isRedisAvailable && redisClient?.status !== 'mock') {
    notificationWorker = new Worker('notification', async job => {
        try {
            const { type, senderId, postId, recipientId } = job.data;

            if (type === 'new_post') {
                await handleNewPostNotification(senderId, postId);
            } else if (type === 'general') {
                console.log(`[Worker:Notification] Received general notif job for recipient:${recipientId}`);
            }
        } catch (err) {
            console.error("[Worker:Notification] Error processing job:", err);
        }
    }, { connection: redisClient });

    notificationWorker.on('failed', (job, err) => {
        console.error(`[Worker:Notification] Job ${job?.id} failed:`, err.message);
    });
}

async function handleNewPostNotification(senderId, postId) {
    console.log(`[Worker:Notification] Processing new_post notifications for sender ${senderId}`);
    const poster = await User.findById(senderId).select("followers");
    if (!poster?.followers?.length) return;

    const notifDocs = poster.followers.map(followerId => ({
        recipient: followerId,
        sender: senderId,
        type: "new_post",
        post: postId,
    }));

    try {
        const created = await Notification.insertMany(notifDocs, { ordered: false });

        const io = getIo();
        for (const notif of created) {
            const populated = await notif.populate("sender", "username profilePic");
            await populated.populate("post", "image description");
            if (io) {
                io.to(notif.recipient.toString()).emit("new-notification", populated);
            }
        }
    } catch (err) {
        console.error("[Worker:Notification] Bulk insert failed:", err);
    }
}

export { notificationWorker };
