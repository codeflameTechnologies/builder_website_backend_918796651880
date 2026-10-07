import crypto from "crypto";

/**
 * Generate 6 digit OTP
 */
export function generateOtp() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

/**
 * Hash OTP before storing in database
 */
export function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}