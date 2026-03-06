import axios from "axios";
import fs from "fs";


export const verifyRecaptcha = async (req, res, next) => {
    const token = req.body.recaptchaToken;

    if (!token) {
        return res.status(400).json({
            message: "reCAPTCHA token required",
        });
    }

    try {
        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            new URLSearchParams({
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: token,
            }).toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const data = response.data;

        // DEBUG LOG
        fs.appendFileSync('recaptcha_debug.log', JSON.stringify({ time: new Date().toISOString(), data }) + '\n');

        if (!data.success) {
            console.warn("reCAPTCHA validation failed with data:", data);
            return res.status(403).json({
                message: "Security verification failed",
                errors: data["error-codes"],
            });
        }

        // If using reCAPTCHA v3 check score
        if (data.score !== undefined && data.score < 0.5) {
            return res.status(403).json({
                message: "Bot activity detected",
                score: data.score
            });
        }

        console.log("✅ reCAPTCHA verified", {
            score: data.score,
            action: data.action
        });

        next();
    } catch (error) {
        console.error("reCAPTCHA verification failed:", error);
        res.status(500).json({
            message: "Internal server error during captcha verification",
        });
    }
};