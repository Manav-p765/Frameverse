import nodemailer from "nodemailer";

// Using env vars if available, otherwise falls back gracefully or errors on send
// Best practice: configure these fields in your .env
const transporter = nodemailer.createTransport({
    service: "gmail", // You can change this or use host/port for other SMTP providers
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends an OTP email to the user.
 * @param {string} to - The recipient email address
 * @param {string} otp - The 6-digit OTP
 */
export const sendOtpEmail = async (to, otp) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP credentials missing in .env. Cannot send real email.");
        console.info(`[MOCK EMAIL] To: ${to} | OTP: ${otp}`);
        return; // Early return to avoid crash if not configured
    }

    const mailOptions = {
        from: `"Frameverse" <${process.env.SMTP_USER}>`,
        to,
        subject: "Your Password Reset Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p style="color: #555; line-height: 1.5;">You recently requested to reset your password for your Frameverse account. Use the code below to proceed.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111; background: #f4f4f4; padding: 15px 30px; border-radius: 8px;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #555; line-height: 1.5;">This code will expire in 10 minutes.</p>
                <p style="color: #555; line-height: 1.5;">If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
                <p style="color: #888; font-size: 12px; margin-top: 40px; text-align: center;">© ${new Date().getFullYear()} Frameverse. All rights reserved.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email successfully sent to ${to}`);
    } catch (err) {
        console.error("Error sending OTP email:", err);
        throw new Error("Could not send email. Please try again later.");
    }
};
