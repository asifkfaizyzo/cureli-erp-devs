import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import { generateOtp, hashOtp,verifyOtp } from "../../utils/otp.js";
import { sendMail } from "../../utils/email.js";


export async function createPendingUser({ first_name, last_name, email, password }) {
  // Check if already a REAL user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const err = new Error("Email already registered.");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  // Check if already pending
  const existingPending = await prisma.pendingUser.findUnique({ where: { email } });
  if (existingPending) {
    const err = new Error("Email already in pending verification. Continue signup.");
    err.code = "PENDING_EXISTS";
    throw err;
  }

  const password_hash = await hashPassword(password);

  const pending = await prisma.pendingUser.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash,
    },
  });

  return pending;
}


export async function sendEmailOtp(pending_id) {
  const pending = await prisma.pendingUser.findUnique({ where: { pending_id } });
  if (!pending) throw new Error("Pending user not found");

  // Prevent OTP spam (minimum 60 seconds)
  if (pending.email_otp_expires && new Date(pending.email_otp_expires) > new Date()) {
    const err = new Error("OTP already sent. Please wait before requesting again.");
    err.code = "OTP_COOLDOWN";
    throw err;
  }

  const otp = generateOtp();              // "123456"
  const hash = await hashOtp(otp);        // hashed version

  await prisma.pendingUser.update({
    where: { pending_id },
    data: {
      email_otp_hash: hash,
      email_otp_expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  // Email template
  const html = `
    <h2>Your Cureli Email Verification Code</h2>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>This code will expire in 5 minutes.</p>
  `;

  await sendMail(pending.email, "Your Cureli OTP Code", html);

  return true;
}



export async function verifyEmailOtp(pending_id, otp) {
  const pending = await prisma.pendingUser.findUnique({ where: { pending_id } });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!pending.email_otp_hash || !pending.email_otp_expires) {
    const err = new Error("OTP not requested");
    err.code = "NO_OTP";
    throw err;
  }

  // Check expiry
  if (new Date() > new Date(pending.email_otp_expires)) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // Compare OTP
  const isValid = await verifyOtp(otp, pending.email_otp_hash);
  if (!isValid) {
    const err = new Error("Invalid OTP");
    err.code = "INVALID_OTP";
    throw err;
  }

  // Update pending user to mark email verified
  await prisma.pendingUser.update({
    where: { pending_id },
    data: {
      email_verified: true,
      email_otp_hash: null,
      email_otp_expires: null,
    },
  });

  return true;
}


export async function setUsername(pending_id, username) {
  // Check if pending user exists
  const pending = await prisma.pendingUser.findUnique({ where: { pending_id } });
  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Must verify email first
  if (!pending.email_verified) {
    const err = new Error("Email must be verified before choosing username");
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  // Check global username uniqueness in REAL users
  const existsInUsers = await prisma.user.findUnique({ where: { username } });
  if (existsInUsers) {
    const err = new Error("Username already taken");
    err.code = "USERNAME_EXISTS";
    throw err;
  }

  // Check in PENDING users (other users who are mid-signup)
  const existsInPending = await prisma.pendingUser.findFirst({
    where: { username, NOT: { pending_id } },
  });

  if (existsInPending) {
    const err = new Error("Username already reserved by another user");
    err.code = "USERNAME_PENDING_EXISTS";
    throw err;
  }

  // Update pending user
  await prisma.pendingUser.update({
    where: { pending_id },
    data: { username },
  });

  return true;
}
