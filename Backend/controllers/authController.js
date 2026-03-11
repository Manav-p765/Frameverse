/**
 * Auth Controller
 *
 * Handles password reset flow via email OTP:
 * 1. requestPasswordReset — generate OTP, email it, create socket notification
 * 2. verifyOTP — validate OTP with attempt limiting and expiry checks
 * 3. resetPassword — verify JWT reset token and update Firebase Auth password
 */

import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import PasswordResetOTP from "../models/PasswordResetOTP.js";
import Notification from "../models/notification.js";
import admin from "../config/firebaseAdmin.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendOtpEmail } from "../services/emailService.js";
import { getIo } from "../utils/socketEmitter.js";

/** Hash OTP using SHA-256 so we never store plaintext OTPs */
const hashOtp = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Step 1: Request a password reset.
 * Generates a 6-digit OTP, hashes it, stores in DB with 10min expiry,
 * sends the plaintext OTP to the user's email, and creates a socket
 * notification if the user is logged in on another device.
 */
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate OTP and hash it for secure storage
        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10-minute window

        // Clear any existing OTPs for this email to prevent confusion
        await PasswordResetOTP.deleteMany({ email: normalizedEmail });

        await PasswordResetOTP.create({
            email: normalizedEmail,
            hashedOtp,
            expiresAt,
            attempts: 0
        });

        // Send email asynchronously — don't block the response
        sendOtpEmail(normalizedEmail, otp).catch(err => console.error("Email send failed:", err));

        // Send a real-time notification if the user is online on another device
        try {
            const notif = await Notification.create({
                recipient: user._id,
                sender: user._id, // Self-notification for password reset
                type: "password_reset",
                read: false
            });
            const populated = await notif.populate("sender", "username profilePic");
            getIo().to(user._id.toString()).emit("new-notification", populated);
        } catch (notifErr) {
            // Non-fatal — password reset still works without the notification
            console.error("Failed to send password reset socket notification:", notifErr);
        }

        res.status(200).json({ message: "OTP sent successfully to your email." });
    } catch (error) {
        console.error("requestPasswordReset error:", error);
        res.status(500).json({ message: "Server error during password reset request" });
    }
};

/**
 * Step 2: Verify the OTP.
 * Checks attempt count (max 5), expiration, and hash match.
 * On success, returns a short-lived JWT reset token for Step 3.
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

        // Brute-force protection: max 5 verification attempts per OTP
        if (otpDoc.attempts >= 5) {
            await PasswordResetOTP.deleteMany({ email: normalizedEmail });
            return res.status(400).json({ message: "Maximum verification attempts reached. Please request a new OTP." });
        }

        // Check if OTP has expired (10-minute window from generation)
        if (otpDoc.expiresAt < new Date()) {
            await PasswordResetOTP.deleteMany({ email: normalizedEmail });
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Compare hashed input against stored hash
        const hashedInput = hashOtp(otp);
        if (otpDoc.hashedOtp !== hashedInput) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            return res.status(400).json({ message: `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining.` });
        }

        // OTP verified — clean up and issue a short-lived reset token
        await PasswordResetOTP.deleteMany({ email: normalizedEmail });

        const secret = process.env.JWT_SECRET || "fallback_secret";
        const resetToken = jwt.sign(
            { email: normalizedEmail, type: 'password_reset' },
            secret,
            { expiresIn: '15m' } // 15-minute window to complete the reset
        );

        res.status(200).json({ message: "OTP verified successfully", resetToken });
    } catch (error) {
        console.error("verifyOTP error:", error);
        res.status(500).json({ message: "Server error during OTP verification" });
    }
};

/**
 * Step 3: Reset the password.
 * Validates the JWT reset token from Step 2, then updates the user's
 * password in Firebase Auth. The token must match the email and be
 * of type "password_reset".
 */
export const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Verify the JWT reset token from Step 2
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

        // Update password via Firebase Admin SDK
        await admin.auth().updateUser(user.firebaseUid, { password: newPassword });

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("resetPassword error:", error);
        res.status(500).json({ message: "Server error during password reset" });
    }
};
