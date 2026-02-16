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
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
    },
    { timestamps: true }
);

export default mongoose.model('Post', postSchema);