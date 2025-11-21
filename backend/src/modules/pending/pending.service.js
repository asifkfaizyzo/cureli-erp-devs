import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import { generateOtp, hashOtp, verifyOtp } from "../../utils/otp.js";
import { sendMail } from "../../utils/email.js";

import { getMCAuthToken } from "../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../providers/messageCentral/validateOtp.js";

/* -------------------------
   Existing email-based functions
   ------------------------- */

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
  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Prevent OTP spam (minimum 60 seconds)
  if (pending.email_otp_expires && new Date(pending.email_otp_expires) > new Date()) {
    const err = new Error("OTP already sent. Please wait before requesting again.");
    err.code = "OTP_COOLDOWN";
    throw err;
  }

  const otp = generateOtp(); // "123456"
  const hash = await hashOtp(otp); // hashed version

  await prisma.pendingUser.update({
    where: { pending_id },
    data: {
      email_otp_hash: hash,
      email_otp_expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

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

/* -------------------------
   New SMS (MessageCentral) functions
   ------------------------- */

/**
 * Send SMS OTP via MessageCentral and persist verificationId
 * - pending_id: uuid
 * - phone: full phone string (E.164 recommended)
 */
export async function sendSmsOtp(pending_id, phone) {
  const pending = await prisma.pendingUser.findUnique({ where: { pending_id } });
  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Prevent OTP spam (minimum 60 seconds)
  if (pending.sms_otp_expires && new Date(pending.sms_otp_expires) > new Date()) {
    const err = new Error("OTP already sent. Please wait before requesting again.");
    err.code = "OTP_COOLDOWN";
    throw err;
  }

  // Get MessageCentral token
  const authToken = await getMCAuthToken(process.env.MC_CUSTOMER, process.env.MC_PASSWORD);

  // Call provider
  const data = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: phone,
    otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
    countryCode: process.env.MC_COUNTRY || "91",
  });

  const verificationId = data?.verificationId || data?.verificationID || data?.verification_id;
  const transactionId = data?.transactionId || data?.transaction_id;
  const timeout = Number(data?.timeout || data?.time || 300);

  // Save verificationId + phone + expiry
  await prisma.pendingUser.update({
    where: { pending_id },
    data: {
      phone,
      sms_verification_id: verificationId,
      sms_transaction_id: transactionId || null,
      sms_otp_expires: new Date(Date.now() + timeout * 1000),
    },
  });

  return { verificationId, transactionId, timeout };
}

/**
 * Validate OTP against MessageCentral using stored verificationId
 * - pending_id: uuid
 * - code: OTP provided by user
 */
export async function verifySmsOtp(pending_id, code) {
  const pending = await prisma.pendingUser.findUnique({ where: { pending_id } });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!pending.sms_verification_id || !pending.sms_otp_expires) {
    const err = new Error("OTP not requested");
    err.code = "NO_OTP";
    throw err;
  }

  if (!pending.phone) {
    const err = new Error("Phone number not found");
    err.code = "NO_PHONE";
    throw err;
  }

  // Check expiry
  if (new Date() > new Date(pending.sms_otp_expires)) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // Validate OTP with Message Central
  const authToken = await getMCAuthToken(process.env.MC_CUSTOMER, process.env.MC_PASSWORD);
  const result = await mcValidateOtp({ 
    authToken, 
    verificationId: pending.sms_verification_id, 
    code,
    mobileNumber: pending.phone
  });

  if (!result) {
    const err = new Error("Provider returned no data");
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  // Success case
  if (result.verificationStatus === "VERIFICATION_COMPLETED") {
    await prisma.pendingUser.update({
      where: { pending_id },
      data: {
        sms_verified: true,
        sms_verification_id: null,
        sms_transaction_id: null,
        sms_otp_expires: null,
      },
    });
    return true;
  }

  // Handle error codes from Message Central
  const respCode = Number(result.responseCode || result.response_code || 0);

  if (respCode === 702) {
    const err = new Error("Wrong OTP");
    err.code = "INVALID_OTP";
    throw err;
  }

  if (respCode === 705) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (respCode === 703) {
    const err = new Error("Already verified");
    err.code = "ALREADY_VERIFIED";
    throw err;
  }

  // Fallback for unknown errors
  const err = new Error("Invalid / failed verification");
  err.code = "INVALID_OTP";
  throw err;
}

/* -------------------------
   Updated username logic — requires BOTH email + phone verified
   ------------------------- */

export async function setUsername(pending_id, username) {
  // Check if pending user exists
  const pending = await prisma.pendingUser.findUnique({ where: { pending_id } });
  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Must verify both email AND phone first (policy A)
  if (!pending.email_verified) {
    const err = new Error("Email must be verified before choosing username");
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }
  if (!pending.sms_verified) {
    const err = new Error("Phone must be verified before choosing username");
    err.code = "PHONE_NOT_VERIFIED";
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
