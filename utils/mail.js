import { Resend } from "resend";
import {config} from "dotenv";
config(); // Load environment variables from .env file

// Initialize Resend using the API key from environment variables.
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

/**
 * Sends a login OTP to the property admin.
 *
 * @param {string} email - Admin's registered email address.
 * @param {string} otp - Generated OTP.
 * @returns {Promise<object>} Resend email API response.
 */
export async function sendLoginOtp(email, otp) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured.");
    }

    if (!email || !otp) {
        throw new Error("Email and OTP are required.");
    }

    const { data, error } = await resend.emails.send({
        from: `Property Admin Portal <${FROM_EMAIL}>`,
        to: [email],
        subject: "Your Property Admin Login Verification Code",

        text: `
Hello Admin,

You requested to log in to your Property Management Admin Panel.

Your login verification code is: ${otp}

This OTP is valid for 5 minutes only.

Security reminder:
- Never share your OTP with anyone.
- If you did not request this login, ignore this email.

Regards,
Property Management Team
        `.trim(),

        html: `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 520px;
            margin: 20px auto;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            color: #1f2937;
            background: #ffffff;
        ">
            <h2 style="
                text-align: center;
                color: #1d4ed8;
                margin-bottom: 8px;
            ">
                Admin Login Verification
            </h2>

            <p style="text-align: center; color: #6b7280;">
                Property Management Portal
            </p>

            <hr style="
                border: none;
                border-top: 1px solid #e5e7eb;
                margin: 24px 0;
            " />

            <p>Hello Admin,</p>

            <p>
                Use the verification code below to securely access
                your Property Management Admin Panel and manage
                your property listings.
            </p>

            <div style="
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                padding: 20px 10px;
                margin: 24px 0;
                background: #f3f4f6;
                color: #111827;
                text-align: center;
                border-radius: 10px;
            ">
                ${String(otp).replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}
            </div>

            <p style="text-align: center;">
                This OTP expires in <strong>5 minutes</strong>.
            </p>

            <div style="
                background: #fff7ed;
                border-left: 4px solid #f97316;
                padding: 12px 15px;
                margin-top: 24px;
                border-radius: 4px;
            ">
                <p style="margin: 0; font-size: 13px; color: #9a3412;">
                    <strong>Security Notice:</strong>
                    Never share this OTP with anyone.
                </p>
            </div>

            <p style="
                font-size: 13px;
                color: #6b7280;
                margin-top: 24px;
            ">
                If you did not request this login, please ignore this email.
            </p>

            <hr style="
                border: none;
                border-top: 1px solid #e5e7eb;
                margin-top: 24px;
            " />

            <p style="
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
            ">
                Property Management Portal
            </p>
        </div>
        `,
    });

    if (error) {
        console.error("Resend email error:", error);
        throw new Error("Failed to send login OTP email.");
    }

    return {
        success: true,
        messageId: data?.id,
    };
}