import mongoose from "mongoose";

const dailyStatsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        date: {
            type: String,
            required: true,
        },

        githubCommits: {
            type: Number,
            default: 0,
        },

        leetcodeSolved: {
            type: Number,
            default: 0,
        },

        caption: {
            type: String,
            default: "",
        },

        imageUrl: {
            type: String,
            default: "",
        },

        posted: {
            type: Boolean,
            default: false,
        },

        streakCount: {
            type: Number,
            default: 0,
        },

        longestStreak: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// One record per user per day
dailyStatsSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyStats = mongoose.model("DailyStats", dailyStatsSchema);
export default DailyStats;
