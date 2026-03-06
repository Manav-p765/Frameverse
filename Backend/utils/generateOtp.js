import crypto from "crypto";

/**
 * Generates a secure 6-digit OTP
 * @returns {string} 6-digit number as a string
 */
export const generateOtp = () => {
    return crypto.randomInt(100000, 999999).toString();
};
