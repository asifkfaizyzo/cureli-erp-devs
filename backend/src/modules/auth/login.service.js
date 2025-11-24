import prisma from "../../config/prisma.js";
import { getMCAuthToken } from "../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../providers/messageCentral/validateOtp.js";

/**
 * Send login OTP to user's registered phone
 */
export async function sendLoginOtp(user_id) {
  const user = await prisma.user.findUnique({ where: { user_id } });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.phone_number) {
    const err = new Error("No phone number registered");
    err.code = "NO_PHONE";
    throw err;
  }

  // Check cooldown (prevent OTP spam)
  if (
    user.login_otp_expires &&
    new Date(user.login_otp_expires) > new Date()
  ) {
    const err = new Error("OTP already sent. Please wait before requesting again.");
    err.code = "OTP_COOLDOWN";
    throw err;
  }

  // Get MessageCentral token
  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  // Send OTP via MessageCentral
  const data = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: user.phone_number,
    otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
    countryCode: process.env.MC_COUNTRY || "91",
  });

  const verificationId =
    data?.verificationId || data?.verificationID || data?.verification_id;
  const timeout = Number(data?.timeout || data?.time || 300);

  // Save verification ID
  await prisma.user.update({
    where: { user_id },
    data: {
      login_verification_id: verificationId,
      login_otp_expires: new Date(Date.now() + timeout * 1000),
      login_otp_attempts: 0, // Reset attempts
    },
  });

  return { success: true };
}

/**
 * Verify login OTP
 */
export async function verifyLoginOtp(user_id, code) {
  const user = await prisma.user.findUnique({ where: { user_id } });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.login_verification_id || !user.login_otp_expires) {
    const err = new Error("OTP not requested");
    err.code = "NO_OTP";
    throw err;
  }

  // Check expiry
  if (new Date() > new Date(user.login_otp_expires)) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // Check attempt limit
  if (user.login_otp_attempts >= 3) {
    const err = new Error("Too many failed attempts. Please request a new OTP.");
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  // Validate with MessageCentral
  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  const result = await mcValidateOtp({
    authToken,
    verificationId: user.login_verification_id,
    code,
    mobileNumber: user.phone_number,
  });

  if (!result) {
    const err = new Error("Provider returned no data");
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  // Check verification status
  if (result.verificationStatus === "VERIFICATION_COMPLETED") {
    // Clear OTP data
    await prisma.user.update({
      where: { user_id },
      data: {
        login_verification_id: null,
        login_otp_expires: null,
        login_otp_attempts: 0,
        last_login_at: new Date(), // Update last login
      },
    });
    return { success: true };
  }

  // Handle error codes
  const respCode = Number(result.responseCode || result.response_code || 0);

  // Increment attempts on failure
  await prisma.user.update({
    where: { user_id },
    data: { login_otp_attempts: user.login_otp_attempts + 1 },
  });

  if (respCode === 702) {
    const err = new Error("Invalid OTP");
    err.code = "INVALID_OTP";
    throw err;
  }

  if (respCode === 705) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // Fallback
  const err = new Error("OTP verification failed");
  err.code = "INVALID_OTP";
  throw err;
}