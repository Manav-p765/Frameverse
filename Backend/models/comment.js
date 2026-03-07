import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Optimize lookup for post comments and analytics
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ postId: 1, isActive: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
