import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["follow", "like", "new_post", "password_reset", "share", "comment"],
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Fast lookup: all notifications for a user, newest first
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Prevent duplicate notifications (e.g. double-click follow)
notificationSchema.index(
    { recipient: 1, sender: 1, type: 1, post: 1 },
    { unique: true }
);

export default mongoose.model("Notification", notificationSchema);
