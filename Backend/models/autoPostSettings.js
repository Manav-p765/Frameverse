import mongoose from "mongoose";

const autoPostSettingsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        enabled: {
            type: Boolean,
            default: false,
        },

        postTime: {
            type: String,
            default: "09:00",
            match: /^\d{2}:\d{2}$/,
        },

        timezone: {
            type: String,
            default: "Asia/Kolkata",
        },

        selectedApps: {
            type: [String],
            enum: ["github", "leetcode"],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const AutoPostSettings = mongoose.model("AutoPostSettings", autoPostSettingsSchema);
export default AutoPostSettings;
