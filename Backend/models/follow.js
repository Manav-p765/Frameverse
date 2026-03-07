import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
    followerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Prevent duplicate follows and optimize lookup
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1, isActive: 1 });
followSchema.index({ followingId: 1, isActive: 1, createdAt: 1 });

const Follow = mongoose.model('Follow', followSchema);
export default Follow;
