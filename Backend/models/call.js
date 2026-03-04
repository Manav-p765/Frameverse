import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
    {
        callId: { type: String, required: true, unique: true },
        callerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        callType: { type: String, enum: ["audio", "video"], default: "video" },
        status: { type: String, enum: ["missed", "rejected", "completed", "timeout", "cancelled", "disconnected"], required: true },
        startedAt: { type: Date, required: true },
        connectedAt: { type: Date, default: null },
        endedAt: { type: Date, default: null },
        duration: { type: Number, default: 0 }, // seconds
    },
    { timestamps: true }
);

// Index for efficient history queries
callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });

const Call = mongoose.model("Call", callSchema);
export default Call;
