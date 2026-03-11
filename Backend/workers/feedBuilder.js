import { Worker } from 'bullmq';
import redisClient, { isRedisAvailable } from '../config/redis.js';
import User from '../models/user.js';
import Post from '../models/post.js';

let feedWorker = { on: () => { } };

if (isRedisAvailable && redisClient?.status !== 'mock') {
    feedWorker = new Worker('feed', async job => {
        try {
            const { postId, authorId } = job.data;
            console.log(`[Worker:Feed] Starting fan-out for post ${postId}`);

            const user = await User.findById(authorId).select('followers following');
            if (!user || !user.followers) return;

            const followerCount = user.followers.length;

            if (followerCount > 10000) {
                console.log(`[Worker:Feed] Skipped fan-out for large account ${authorId}`);
                await redisClient.lpush(`feed:large_accounts:${authorId}`, postId);
                await redisClient.ltrim(`feed:large_accounts:${authorId}`, 0, 500);
                return;
            }

            const pipeline = redisClient.pipeline();
            user.followers.forEach(followerId => {
                pipeline.lpush(`feed:user:${followerId}`, postId);
                pipeline.ltrim(`feed:user:${followerId}`, 0, 500); // 500 items max
            });

            await pipeline.exec();
            console.log(`[Worker:Feed] Fan-out complete for ${followerCount} followers`);

        } catch (err) {
            console.error("[Worker:Feed] Error processing feed fan-out:", err);
        }
    }, { connection: redisClient });

    feedWorker.on('failed', (job, err) => {
        console.error(`[Worker:Feed] Job ${job?.id} failed:`, err.message);
    });
}

export { feedWorker };
