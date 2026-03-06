import mongoose from "mongoose";

const passwordResetOTPSchema = new mongoose.Schema({
    email: { type: String, required: true },
    hashedOtp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-delete after 10 minutes (600 seconds)
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0, max: 5 }
});

export default mongoose.model("PasswordResetOTP", passwordResetOTPSchema);
