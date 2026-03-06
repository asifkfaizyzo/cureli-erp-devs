//backend\src\utils\otp.js
import bcrypt from "bcrypt";
import crypto from "crypto";

export function generateOtp() {
  // Generate a 4-digit OTP using cryptographically secure randomness
  // crypto.randomInt is synchronous and uses the OS CSPRNG
  return crypto.randomInt(1000, 10000).toString();
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(plain, hash) {
  return bcrypt.compare(plain, hash);
}