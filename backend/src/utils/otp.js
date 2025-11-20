import bcrypt from "bcrypt";

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(plain, hash) {
  return bcrypt.compare(plain, hash);
}
