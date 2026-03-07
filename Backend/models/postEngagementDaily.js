import mongoose from 'mongoose';

const postEngagementDailySchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Optimize lookup for historical trends
postEngagementDailySchema.index({ postId: 1, date: 1 }, { unique: true });

const PostEngagementDaily = mongoose.model('PostEngagementDaily', postEngagementDailySchema);
export default PostEngagementDaily;
