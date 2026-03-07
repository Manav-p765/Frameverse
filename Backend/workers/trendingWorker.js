import cron from 'node-cron';
import Post from '../models/post.js';

/**
     * Trending Algorithm:
     * score = (likes*2 + comments*3 + shares*4) / (hours_since_creation + 2)^1.5
     */
const calculateTrendingScores = async () => {
    console.log('--- Running Trending Score Calculation ---');

    // Only update posts from the last 72 hours
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    try {
        const posts = await Post.find({
            createdAt: { $gte: seventyTwoHoursAgo }
        });

        console.log(`Processing ${posts.length} recent posts...`);

        const bulkOps = posts.map(post => {
            const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
            const score = (
                (post.likeCount || 0) * 2 +
                (post.commentCount || 0) * 3 +
                (post.sharesCount || 0) * 4
            ) / Math.pow((ageInHours + 2), 1.5);

            return {
                updateOne: {
                    filter: { _id: post._id },
                    update: { $set: { trendingScore: score } }
                }
            };
        });

        if (bulkOps.length > 0) {
            await Post.bulkWrite(bulkOps);
        }

        console.log('--- Trending Scores Updated Successfully ---');
    } catch (err) {
        console.error('Error in trending calculation job:', err);
    }
};

// Run every 10 minutes
cron.schedule('*/10 * * * *', calculateTrendingScores);

// Also run once on startup
calculateTrendingScores();

export default calculateTrendingScores;
