import { Queue } from 'bullmq';
import redisClient, { isRedisAvailable } from '../config/redis.js';

let feedQueue, notificationQueue, trendingQueue;

if (isRedisAvailable && redisClient?.status !== 'mock') {
    feedQueue = new Queue('feed', { connection: redisClient });
    notificationQueue = new Queue('notification', { connection: redisClient });
    trendingQueue = new Queue('trending', { connection: redisClient });
    console.log("✅ [Queues] BullMQ Queues initialized");
} else {
    // Mock queues so the API doesn't crash and doesn't spam connection retries
    const mockQueue = {
        add: async (name, data) => {
            // Just skip when there is no Redis queue available
        }
    };
    feedQueue = mockQueue;
    notificationQueue = mockQueue;
    trendingQueue = mockQueue;
}

export { feedQueue, notificationQueue, trendingQueue };
