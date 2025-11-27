import prisma from "../../../config/prisma.js";
import { comparePassword } from "../../../utils/hash.js";
import { getMCAuthToken } from "../../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../../providers/messageCentral/validateOtp.js";
import {
  generateCAdminAccessToken,
  generateCAdminRefreshToken,
} from "../../../utils/cadminTokens.js";

/**
 * loginCAdminService:
 * - verify username/password
 * - request MC OTP
 * - store verification id + expiry in DB
 */
export async function loginCAdminService({ username, password }) {
  const cadmin = await prisma.cAdmin.findUnique({ where: { username } });

  if (!cadmin) {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }

  if (!cadmin.is_active) {
    const err = new Error("Account disabled");
    err.status = 403;
    throw err;
  }

  const ok = await comparePassword(password, cadmin.password_hash);
  if (!ok) {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }

  // get MC token
  const authToken = await getMCAuthToken(process.env.MC_CUSTOMER, process.env.MC_PASSWORD);

  const mcResp = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: cadmin.phone_number,
    otpLength: process.env.SMS_OTP_LENGTH ? Number(process.env.SMS_OTP_LENGTH) : 4,
    countryCode: process.env.MC_COUNTRY || "91",
  });

  // mcResp expected to contain verificationId and expiry info
  const verificationId = mcResp?.verificationId || mcResp?.verification_id || mcResp?.verificationId;
  const expiryTime = mcResp?.expiryTime || mcResp?.expiresAt || mcResp?.expiry;

  // Save to DB
  await prisma.cAdmin.update({
    where: { cadmin_id: cadmin.cadmin_id },
    data: {
      verification_id: verificationId,
      otp_expires: expiryTime ? new Date(expiryTime) : new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  // masked phone for UI
  const phone_hint = cadmin.phone_number.replace(/^(\+?\d{0,3})?(\d{0,2})(\d+)(\d{2})$/, (_, p1, p2, mid, last) => {
    // fallback masking
    if (!mid) return "••••";
    const visible = last || mid.slice(-2);
    return `•••• ${visible}`;
  });

  return { phone_hint };
}

/**
 * verifyCAdminOtpService:
 * - call mcValidateOtp
 * - issue tokens
 */
export async function verifyCAdminOtpService({ username, otp, req, res }) {
  const cadmin = await prisma.cAdmin.findUnique({ where: { username } });
  if (!cadmin) {
    const err = new Error("Invalid user");
    err.status = 401;
    throw err;
  }

  if (!cadmin.verification_id) {
    const err = new Error("No OTP requested");
    err.status = 400;
    throw err;
  }

  if (!cadmin.otp_expires || new Date() > new Date(cadmin.otp_expires)) {
    const err = new Error("OTP expired");
    err.status = 400;
    throw err;
  }

  // get MC auth token
  const authToken = await getMCAuthToken(process.env.MC_CUSTOMER, process.env.MC_PASSWORD);

  const mcValidation = await mcValidateOtp({
    authToken,
    verificationId: cadmin.verification_id,
    code: otp,
    mobileNumber: cadmin.phone_number,
  });

  // if mcValidateOtp throws, it will be caught by controller
  // success path: clear verification fields and issue tokens
  await prisma.cAdmin.update({
    where: { cadmin_id: cadmin.cadmin_id },
    data: {
      verification_id: null,
      otp_expires: null,
      last_login_at: new Date(),
    },
  });

  const accessPayload = { cadmin_id: cadmin.cadmin_id, username: cadmin.username };
  const refreshPayload = { cadmin_id: cadmin.cadmin_id };

  const accessToken = generateCAdminAccessToken(accessPayload);
  const refreshToken = generateCAdminRefreshToken(refreshPayload);

  // set HttpOnly secure cookie for refresh token
  // cookie options: httpOnly, secure (true in production), sameSite strict
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/cadmin/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000, // fallback (ms) - should match ADMIN_REFRESH_EXPIRES
  };

  res.cookie("cadmin_refresh_token", refreshToken, cookieOptions);

  return {
    access_token: accessToken,
  };
}

/**
 * refreshCAdminService:
 * - reads cookie, verifies, issues new access token
 */
export async function refreshCAdminService({ req, res }) {
  const token = req.cookies?.cadmin_refresh_token;
  if (!token) {
    const err = new Error("Missing refresh token");
    err.status = 401;
    throw err;
  }

  const jwt = await import("jsonwebtoken");
  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_REFRESH_SECRET);
    const cadmin_id = payload.cadmin_id;

    const cadmin = await prisma.cAdmin.findUnique({ where: { cadmin_id } });
    if (!cadmin) {
      const err = new Error("Invalid refresh token");
      err.status = 401;
      throw err;
    }

    const accessToken = generateCAdminAccessToken({ cadmin_id: cadmin.cadmin_id, username: cadmin.username });
    return { access_token: accessToken };
  } catch (err) {
    const e = new Error("Invalid or expired refresh token");
    e.status = 401;
    throw e;
  }
}

/**
 * logoutCAdminService:
 * - clears refresh cookie
 */
export async function logoutCAdminService({ req, res }) {
  res.clearCookie("cadmin_refresh_token", { path: "/cadmin/refresh" });
  return;
}
