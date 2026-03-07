import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
    {
        image: {
            url: {
                type: String, // Cloudinary / S3 URL
                required: true
            },
            public_id: {
                type: String,
            },
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        location: {
            type: String,
            trim: true
        },
        description: {
            type: String
        },
        postType: {
            type: String,
            enum: ['user', 'auto-progress'],
            default: 'user'
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        likeCount: {
            type: Number,
            default: 0
        },
        sharesCount: {
            type: Number,
            default: 0
        },
        commentCount: {
            type: Number,
            default: 0
        },
        trendingScore: {
            type: Number,
            default: 0,
            index: true
        }
    },
    { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ likeCount: -1 });
postSchema.index({ trendingScore: -1 });
postSchema.index({ owner: 1 });
postSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);