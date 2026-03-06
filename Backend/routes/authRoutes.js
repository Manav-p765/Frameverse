import { Router } from "express";
import rateLimit from "express-rate-limit";
import wrapAsync from "../utils/wrapAsync.js";
import { verifyRecaptcha } from "../controllers/recaptca.js";
import {
    requestPasswordReset,
    verifyOTP,
    resetPassword
} from "../controllers/authController.js";

const router = Router({ mergeParams: true });

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Rate limiter to prevent OTP spam
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many reset attempts. Please try again in 15 minutes." },
});

// Rate limiter for verification attempts
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many verification attempts. Please try again later." },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /auth/forgot-password -> Request OTP
router.post(
    "/forgot-password",
    otpLimiter,
    verifyRecaptcha,
    wrapAsync(requestPasswordReset)
);

// POST /auth/verify-otp -> Verify 6 digit OTP, gets resetToken limit
router.post(
    "/verify-otp",
    verifyLimiter,
    wrapAsync(verifyOTP)
);

// POST /auth/reset-password -> Actually reset the password with resetToken
router.post(
    "/reset-password",
    verifyRecaptcha,
    wrapAsync(resetPassword)
);

export default router;
