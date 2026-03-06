import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import PasswordResetOTP from "../models/PasswordResetOTP.js";
import Notification from "../models/notification.js";
import admin from "../config/firebaseAdmin.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendOtpEmail } from "../services/emailService.js";

// Hash utility for OTP
const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * requestPasswordReset
 * 1. Validates email locally
 * 2. Generates OTP, hashes it, saves to Mongo
 * 3. Sends email and socket notification
 */
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Prevent email enumeration, you can return 404 or a generic success message
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate and Hash OTP
        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Clear existing OTPs for this email to prevent spam/confusion
        await PasswordResetOTP.deleteMany({ email: normalizedEmail });

        // Save new OTP
        await PasswordResetOTP.create({
            email: normalizedEmail,
            hashedOtp,
            expiresAt,
            attempts: 0
        });

        // Send Email (async to avoid blocking)
        sendOtpEmail(normalizedEmail, otp).catch(err => console.error("Email send failed:", err));

        // Create socket notification
        try {
            // Send a real-time notification to the user if they are logged in on another device
            const notif = await Notification.create({
                recipient: user._id,
                sender: user._id, // self notification
                type: "password_reset",
                read: false
            });
            const populated = await notif.populate("sender", "username profilePic");

            // Emit to socket room
            req.app.get("io").to(user._id.toString()).emit("new-notification", populated);
        } catch (notifErr) {
            console.error("Failed to send password reset socket notification:", notifErr);
            // Non-fatal, do not throw
        }

        res.status(200).json({ message: "OTP sent successfully to your email." });
    } catch (error) {
        console.error("requestPasswordReset error:", error);
        res.status(500).json({ message: "Server error during password reset request" });
    }
};

/**
 * verifyOTP
 * 1. Find OTP doc
 * 2. Check attempts and expiration
 * 3. Verify hash matches
 * 4. Return resetToken
 */
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

        const normalizedEmail = email.toLowerCase().trim();
        const otpDoc = await PasswordResetOTP.findOne({ email: normalizedEmail });

        if (!otpDoc) {
            return res.status(400).json({ message: "OTP expired or invalid" });
        }

        if (otpDoc.attempts >= 5) {
            await PasswordResetOTP.deleteMany({ email: normalizedEmail });
            return res.status(400).json({ message: "Maximum verification attempts reached. Please request a new OTP." });
        }

        if (otpDoc.expiresAt < new Date()) {
            await PasswordResetOTP.deleteMany({ email: normalizedEmail });
            return res.status(400).json({ message: "OTP has expired" });
        }

        const hashedInput = hashOtp(otp);

        if (otpDoc.hashedOtp !== hashedInput) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            return res.status(400).json({ message: `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining.` });
        }

        // OTP is valid! Send a resetToken
        await PasswordResetOTP.deleteMany({ email: normalizedEmail }); // cleanup

        const secret = process.env.JWT_SECRET || "fallback_secret";
        const resetToken = jwt.sign({ email: normalizedEmail, type: 'password_reset' }, secret, { expiresIn: '15m' });

        res.status(200).json({
            message: "OTP verified successfully",
            resetToken
        });

    } catch (error) {
        console.error("verifyOTP error:", error);
        res.status(500).json({ message: "Server error during OTP verification" });
    }
};

/**
 * resetPassword
 * 1. Verify resetToken
 * 2. Validate user
 * 3. Update Firebase auth password
 */
export const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Verify JWT token
        const secret = process.env.JWT_SECRET || "fallback_secret";
        try {
            const decoded = jwt.verify(resetToken, secret);
            if (decoded.email !== email || decoded.type !== "password_reset") {
                return res.status(400).json({ message: "Invalid or unauthorized reset token" });
            }
        } catch (err) {
            return res.status(400).json({ message: "Reset token expired or invalid" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.firebaseUid) {
            return res.status(404).json({ message: "User not found or not linked to Firebase." });
        }

        // Update password using Firebase Admin SDK
        await admin.auth().updateUser(user.firebaseUid, {
            password: newPassword
        });

        res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("resetPassword error:", error);
        res.status(500).json({ message: "Server error during password reset" });
    }
};
