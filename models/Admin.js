import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Hashed OTP
    otpHash: {
      type: String,
      default: null,
      select: false,
    },

    // OTP expiry time
    otpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    // Wrong OTP attempts
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    // Last OTP sent time
    otpLastSentAt: {
      type: Date,
      default: null,
      select: false,
    },

  },
  { timestamps: true }
);



export default mongoose.model("Admin", adminSchema);