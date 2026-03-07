import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Prevent duplicate likes and optimize lookup
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });
likeSchema.index({ postId: 1, isActive: 1 });
likeSchema.index({ postId: 1, isActive: 1, createdAt: 1 });

const Like = mongoose.model('Like', likeSchema);
export default Like;
