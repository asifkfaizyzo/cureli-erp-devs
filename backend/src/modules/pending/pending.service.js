import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import { generateOtp, hashOtp, verifyOtp } from "../../utils/otp.js";
import { sendMail } from "../../utils/email.js";

import { getMCAuthToken } from "../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../providers/messageCentral/validateOtp.js";

/**
 * Delete pending users older than expiry window (in minutes).
 * Use CASE: remove abandoned pending signups so duplicates don't block future signups.
 */
export async function cleanupExpiredPendingUsers(expiryMinutes = 10) {
  // expiryMinutes default 10 (you said 10min)
  try {
    const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);

    const deleted = await prisma.pendingUser.deleteMany({
      where: {
        created_at: { lt: cutoff },
      },
    });

    // deleted.count contains number removed (Prisma response shape)
    return deleted;
  } catch (err) {
    console.error("cleanupExpiredPendingUsers error:", err);
    // swallow error to not block signup flows
    return null;
  }
}




export async function createPendingUser({
  first_name,
  last_name,
  email,
  password,
}) {
  // Check if already a REAL user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const err = new Error("Email already registered. Please login.");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  // Check if already pending
  const existingPending = await prisma.pendingUser.findUnique({
    where: { email },
  });

  if (existingPending) {
    // 🔥 Delete old incomplete signup
    await prisma.pendingUser.delete({
      where: { pending_id: existingPending.pending_id },
    });
  }

  // Create new pending user
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

export async function createPendingUserFromGoogle({
  google_id,
  email,
  first_name,
  last_name,
}) {
  // 🔥 Check if google_id already exists in User table
  if (google_id) {
    const existingGoogleUser = await prisma.user.findUnique({
      where: { google_id },
    });

    if (existingGoogleUser) {
      const err = new Error("This Google account is already registered. Please login instead.");
      err.code = "GOOGLE_ID_EXISTS";
      throw err;
    }
  }

  // Check if email already exists in User table
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const err = new Error("Email already registered. Please login instead.");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  // Check if email exists in PendingUser table (ongoing signup)
  const existingPending = await prisma.pendingUser.findUnique({
    where: { email },
  });

  if (existingPending) {
    // Update existing pending user with Google info and return it
    const updated = await prisma.pendingUser.update({
      where: { email },
      data: {
        google_id,
        first_name,
        last_name,
        login_provider: "google",
        email_verified: true, // Google emails are pre-verified
      },
    });
    return updated;
  }

  // Create new pending user
  const pending = await prisma.pendingUser.create({
    data: {
      google_id,
      email,
      first_name,
      last_name,
      login_provider: "google",
      email_verified: true, // Google emails are pre-verified
    },
  });

  return pending;
}

export async function setPasswordForPending(pending_id, password) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });
  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (pending.login_provider !== "google") {
    const err = new Error("This account is not a Google signup.");
    err.code = "NOT_GOOGLE";
    throw err;
  }

  const password_hash = await hashPassword(password);

  await prisma.pendingUser.update({
    where: { pending_id },
    data: { password_hash },
  });

  return true;
}

export async function sendEmailOtp(pending_id) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });
  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Prevent OTP spam (minimum 60 seconds)
  if (
    pending.email_otp_expires &&
    new Date(pending.email_otp_expires) > new Date()
  ) {
    const err = new Error(
      "OTP already sent. Please wait before requesting again."
    );
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
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

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


export async function sendSmsOtp(pending_id, phone) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });
  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Prevent OTP spam (minimum 60 seconds)
  if (
    pending.sms_otp_expires &&
    new Date(pending.sms_otp_expires) > new Date()
  ) {
    const err = new Error(
      "OTP already sent. Please wait before requesting again."
    );
    err.code = "OTP_COOLDOWN";
    throw err;
  }

  // Get MessageCentral token
  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  // Call provider
  const data = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: phone,
    otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
    countryCode: process.env.MC_COUNTRY || "91",
  });

  const verificationId =
    data?.verificationId || data?.verificationID || data?.verification_id;
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


export async function verifySmsOtp(pending_id, code) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

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
  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );
  const result = await mcValidateOtp({
    authToken,
    verificationId: pending.sms_verification_id,
    code,
    mobileNumber: pending.phone,
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


export async function setUsername(pending_id, username) {
  // Check if pending user exists
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });
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

export async function finalizePendingSignup(pending_id) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!pending.email_verified) {
    const err = new Error("Email not verified");
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  if (!pending.sms_verified) {
    const err = new Error("Phone not verified");
    err.code = "PHONE_NOT_VERIFIED";
    throw err;
  }

  if (!pending.username) {
    const err = new Error("Username required");
    err.code = "NO_USERNAME";
    throw err;
  }

  // Build user data conditionally
const userData = {
  first_name: pending.first_name,
  last_name: pending.last_name,
  full_name: pending.first_name + " " + pending.last_name,
  email: pending.email,
  username: pending.username,
  phone_number: pending.phone,
  password_hash: pending.password_hash || null,
  login_provider: pending.login_provider || "password",
  role: "super_admin",
  status: "pending_setup",
  is_active: true,
};

// Only add google_id if it actually exists
if (pending.google_id) {
  userData.google_id = pending.google_id;
}

const user = await prisma.user.create({
  data: userData,
});

  // NOW create the shop row linked to this user
  const shop = await prisma.shop.create({
    data: {
      owner_user_id: user.user_id,
      business_name: "",
      address_line_1: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // Link shop_id to user table
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { shop_id: shop.shop_id },
  });

  // Delete pending user
  await prisma.pendingUser.delete({ where: { pending_id } });

  return { user, shop };
}
