//backend\src\modules\auth\login.service.js
import prisma from "../../config/prisma.js";
import { getMCAuthToken } from "../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../providers/messageCentral/validateOtp.js";

export async function sendLoginOtp(user_id, isResend = false) {
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

  const now = new Date();

  if (user.login_otp_expires && user.login_verification_id) {
    const expiresAt = new Date(user.login_otp_expires);

    if (expiresAt > now) {
      const secondsRemaining = Math.ceil((expiresAt - now) / 1000);

      if (isResend) {
        const otpValiditySeconds = 300;
        const otpSentAt = new Date(expiresAt.getTime() - otpValiditySeconds * 1000);
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < 30) {
          const waitTime = 30 - secondsSinceSent;
          const err = new Error(`Please wait ${waitTime} seconds before requesting a new OTP.`);
          err.code = "OTP_COOLDOWN";
          err.waitTime = waitTime;
          throw err;
        }
      } else {
        const otpValiditySeconds = 300;
        const otpSentAt = new Date(expiresAt.getTime() - otpValiditySeconds * 1000);
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < 60) {
          const err = new Error("OTP already sent. Please check your phone or wait to resend.");
          err.code = "OTP_COOLDOWN";
          err.waitTime = 30 - Math.min(secondsSinceSent, 30);
          throw err;
        }
      }
    }
  }

  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  try {
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

    await prisma.user.update({
      where: { user_id },
      data: {
        login_verification_id: verificationId,
        login_otp_expires: new Date(Date.now() + timeout * 1000),
        login_otp_attempts: 0,
      },
    });

    return { success: true, timeout };
  } catch (providerError) {
    console.error("MessageCentral error:", providerError);

    const responseCode = providerError?.response?.data?.responseCode;
    const message = providerError?.response?.data?.message;

    if (responseCode === 506 || message === "REQUEST_ALREADY_EXISTS") {
      if (user.login_otp_expires) {
        const expiresAt = new Date(user.login_otp_expires);
        const secondsRemaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

        if (secondsRemaining > 0) {
          const err = new Error(`OTP already sent. Please wait ${Math.min(secondsRemaining, 30)} seconds or check your phone.`);
          err.code = "OTP_COOLDOWN";
          err.waitTime = Math.min(secondsRemaining, 30);
          throw err;
        }
      }

      const err = new Error("Please wait 30 seconds before requesting a new OTP.");
      err.code = "OTP_COOLDOWN";
      err.waitTime = 30;
      throw err;
    }

    throw providerError;
  }
}

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

  if (new Date() > new Date(user.login_otp_expires)) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (user.login_otp_attempts >= 3) {
    const err = new Error("Too many failed attempts. Please request a new OTP.");
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }


if (code === "0000" && process.env.NODE_ENV === "development") {
  await prisma.user.update({
    where: { user_id },
    data: {
      login_verification_id: null,
      login_otp_expires: null,
      login_otp_attempts: 0,
      last_login_at: new Date(),
    },
  });

  return { success: true };
}

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

  if (result.verificationStatus === "VERIFICATION_COMPLETED") {
    await prisma.user.update({
      where: { user_id },
      data: {
        login_verification_id: null,
        login_otp_expires: null,
        login_otp_attempts: 0,
        last_login_at: new Date(),
      },
    });
    return { success: true };
  }

  const respCode = Number(result.responseCode || result.response_code || 0);

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

  const err = new Error("OTP verification failed");
  err.code = "INVALID_OTP";
  throw err;
}
