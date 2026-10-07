import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import Admin from "../models/Admin.js";
import { sendLoginOtp } from "../utils/mail.js";

// Generate JWT after successful OTP verification
const generateToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );


// =====================================================
// POST /api/auth/login
// Step 1: Email verify + OTP send
// =====================================================
export const login = async (req, res) => {
  try {
    const { email } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find admin
    const admin = await Admin.findOne({
      email: normalizedEmail,
    }).select(
      "+otpHash +otpExpiresAt +otpAttempts +otpLastSentAt"
    );
    console.log("Admin found:", admin);
    // Do not reveal unnecessary account information
    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or admin account not found",
      });
    }

    // Check whether admin account is active
    if (!admin.isActive) {
      return res.status(403).json({
        message: "Your admin account is inactive",
      });
    }


    // =================================================
    // OTP RESEND RATE LIMIT
    // Prevent sending OTP again within 60 seconds
    // =================================================

    if (admin.otpLastSentAt) {
      const timeSinceLastOtp =
        Date.now() - new Date(admin.otpLastSentAt).getTime();

      const resendCooldown = 60 * 1000; // 60 seconds

      if (timeSinceLastOtp < resendCooldown) {
        const remainingSeconds = Math.ceil(
          (resendCooldown - timeSinceLastOtp) / 1000
        );

        return res.status(429).json({
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          retryAfter: remainingSeconds,
        });
      }
    }


    // =================================================
    // GENERATE 6 DIGIT OTP
    // =================================================

    const otp = crypto.randomInt(100000, 1000000).toString();


    // =================================================
    // HASH OTP BEFORE SAVING
    // Never store plain OTP in database
    // =================================================

    const otpHash = await bcrypt.hash(otp, 10);


    // =================================================
    // OTP EXPIRY
    // OTP valid for 5 minutes
    // =================================================

    const otpExpiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );


    // =================================================
    // SAVE OTP DATA
    // =================================================

    admin.otpHash = otpHash;
    admin.otpExpiresAt = otpExpiresAt;
    admin.otpAttempts = 0;
    admin.otpLastSentAt = new Date();

    await admin.save();


    // =================================================
    // SEND OTP EMAIL
    // =================================================

    try {
      await sendLoginOtp(normalizedEmail, otp);
    } catch (emailError) {
      console.error(
        "OTP email sending failed:",
        emailError
      );

      // Remove OTP if email was not sent
      admin.otpHash = null;
      admin.otpExpiresAt = null;
      admin.otpAttempts = 0;
      admin.otpLastSentAt = null;

      await admin.save();

      return res.status(500).json({
        message: "Unable to send OTP. Please try again.",
      });
    }


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      email: normalizedEmail,
      expiresIn: 300,
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};


// =====================================================
// POST /api/auth/verify-otp
// Step 2: Verify OTP + Generate JWT
// =====================================================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;


    // =================================================
    // VALIDATION
    // =================================================

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }


    const normalizedEmail = email.trim().toLowerCase();
    const enteredOtp = otp.toString().trim();


    // OTP must be 6 digits
    if (!/^\d{6}$/.test(enteredOtp)) {
      return res.status(400).json({
        message: "OTP must be a 6-digit number",
      });
    }


    // =================================================
    // FIND ADMIN + OTP FIELDS
    // =================================================

    const admin = await Admin.findOne({
      email: normalizedEmail,
    }).select(
      "+otpHash +otpExpiresAt +otpAttempts +otpLastSentAt"
    );


    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or OTP",
      });
    }


    // Check account status
    if (!admin.isActive) {
      return res.status(403).json({
        message: "Your admin account is inactive",
      });
    }


    // =================================================
    // CHECK OTP EXISTS
    // =================================================

    if (!admin.otpHash || !admin.otpExpiresAt) {
      return res.status(400).json({
        message: "OTP is invalid or has expired. Please request a new OTP.",
      });
    }


    // =================================================
    // CHECK OTP EXPIRY
    // =================================================

    if (new Date() > new Date(admin.otpExpiresAt)) {

      // Clear expired OTP
      admin.otpHash = null;
      admin.otpExpiresAt = null;
      admin.otpAttempts = 0;

      await admin.save();

      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP.",
      });
    }


    // =================================================
    // MAX WRONG ATTEMPTS
    // =================================================

    const MAX_OTP_ATTEMPTS = 5;

    if (admin.otpAttempts >= MAX_OTP_ATTEMPTS) {

      admin.otpHash = null;
      admin.otpExpiresAt = null;
      admin.otpAttempts = 0;

      await admin.save();

      return res.status(429).json({
        message:
          "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }


    // =================================================
    // COMPARE ENTERED OTP WITH HASH
    // =================================================

    const isOtpValid = await bcrypt.compare(
      enteredOtp,
      admin.otpHash
    );


    // =================================================
    // WRONG OTP
    // =================================================

    if (!isOtpValid) {

      admin.otpAttempts += 1;

      await admin.save();

      const attemptsLeft =
        MAX_OTP_ATTEMPTS - admin.otpAttempts;

      return res.status(401).json({
        message: "Invalid OTP",
        attemptsLeft,
      });
    }


    // =================================================
    // OTP SUCCESS
    // =================================================

    const token = generateToken(admin._id);


    // =================================================
    // CLEAR OTP AFTER SUCCESSFUL LOGIN
    // OTP CAN NEVER BE USED AGAIN
    // =================================================

    admin.otpHash = null;
    admin.otpExpiresAt = null;
    admin.otpAttempts = 0;
    admin.otpLastSentAt = null;

    await admin.save();


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
      },
    });

  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};


// =====================================================
// GET /api/auth/me
// Protected Route
// =====================================================
export const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      admin: req.admin,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch admin profile",
    });
  }
};