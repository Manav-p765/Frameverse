import mongoose from "mongoose";

const connectedAccountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        platform: {
            type: String,
            enum: ["github", "leetcode"],
            required: true,
        },

        username: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// One account per platform per user
connectedAccountSchema.index({ user: 1, platform: 1 }, { unique: true });

const ConnectedAccount = mongoose.model("ConnectedAccount", connectedAccountSchema);
export default ConnectedAccount;
