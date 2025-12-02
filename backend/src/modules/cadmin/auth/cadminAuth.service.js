import prisma from "../../../config/prisma.js";
import { comparePassword } from "../../../utils/hash.js";
import { getMCAuthToken } from "../../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../../providers/messageCentral/validateOtp.js";
import {
  generateCAdminAccessToken,
  generateCAdminRefreshToken,
  verifyCAdminRefreshToken,
} from "../../../utils/cadminTokens.js";
import { ADMIN_REFRESH_SECRET } from "../../../config/cadmin_jwt.js"; // 👈 ADD THIS IMPORT

/**
 * loginCAdminService
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

  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  const mcResp = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: cadmin.phone_number,
    otpLength: process.env.SMS_OTP_LENGTH ? Number(process.env.SMS_OTP_LENGTH) : 4,
    countryCode: process.env.MC_COUNTRY || "91",
  });

  const verificationId = mcResp?.verificationId || mcResp?.verification_id;
  const expiryTime = mcResp?.expiryTime || mcResp?.expiresAt || mcResp?.expiry;

  await prisma.cAdmin.update({
    where: { cadmin_id: cadmin.cadmin_id },
    data: {
      verification_id: verificationId,
      otp_expires: expiryTime
        ? new Date(expiryTime)
        : new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  const phone_hint = cadmin.phone_number.replace(
    /^(\+?\d{0,3})?(\d{0,2})(\d+)(\d{2})$/,
    (_, p1, p2, mid, last) => {
      if (!mid) return "••••";
      const visible = last || mid.slice(-2);
      return `•••• ${visible}`;
    }
  );

  return { phone_hint };
}

/**
 * verifyCAdminOtpService
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

  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  const mcValidation = await mcValidateOtp({
    authToken,
    verificationId: cadmin.verification_id,
    code: otp,
    mobileNumber: cadmin.phone_number,
  });

  const valid =
    mcValidation?.verificationStatus === "VERIFICATION_COMPLETED" &&
    mcValidation?.responseCode === "200";

  if (!valid) {
    const err = new Error("Invalid OTP");
    err.status = 401;
    throw err;
  }

  await prisma.cAdmin.update({
    where: { cadmin_id: cadmin.cadmin_id },
    data: {
      verification_id: null,
      otp_expires: null,
      last_login_at: new Date(),
    },
  });

  const accessPayload = {
    cadmin_id: cadmin.cadmin_id,
    username: cadmin.username,
  };
  const refreshPayload = { cadmin_id: cadmin.cadmin_id };

  const accessToken = generateCAdminAccessToken(accessPayload);
  const refreshToken = generateCAdminRefreshToken(refreshPayload);
  console.log("🔑 GENERATED REFRESH TOKEN:", refreshToken);

  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/cadmin",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  console.log("Setting refresh token cookie with options:", cookieOptions);
  res.cookie("cadmin_refresh_token", refreshToken, cookieOptions);

  return {
    access_token: accessToken,
  };
}

/**
 * refreshCAdminService
 */
export async function refreshCAdminService({ req, res }) {
  console.log("=== REFRESH ATTEMPT ===");
  console.log("All cookies:", Object.keys(req.cookies || {}));

  const token = req.cookies?.cadmin_refresh_token;
console.log("🍪 COOKIE REFRESH TOKEN:", token);  
  if (!token) {
    console.log("❌ No refresh token cookie found");
    const err = new Error("Missing refresh token");
    err.status = 401;
    throw err;
  }

  console.log("✅ Refresh token found");
  console.log("Token preview:", token.slice(0, 50) + "...");

  try {
    // 👇 Now using the imported verifyCAdminRefreshToken function
    console.log("Verifying with secret:", ADMIN_REFRESH_SECRET?.slice(0, 5) + "...");
    const payload = verifyCAdminRefreshToken(token);
    console.log("✅ Token verified, cadmin_id:", payload.cadmin_id);

    const cadmin_id = payload.cadmin_id;

    const cadmin = await prisma.cAdmin.findUnique({ where: { cadmin_id } });
    if (!cadmin) {
      console.log("❌ CAdmin not found in database");
      const err = new Error("Invalid refresh token");
      err.status = 401;
      throw err;
    }

    if (!cadmin.is_active) {
      console.log("❌ CAdmin account is disabled");
      const err = new Error("Account disabled");
      err.status = 403;
      throw err;
    }

    // Generate new access token
    const accessToken = generateCAdminAccessToken({
      cadmin_id: cadmin.cadmin_id,
      username: cadmin.username,
    });

    // 🔄 ROTATE: Generate new refresh token and set new cookie
    const newRefreshToken = generateCAdminRefreshToken({
      cadmin_id: cadmin.cadmin_id,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/cadmin",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("cadmin_refresh_token", newRefreshToken, cookieOptions);
    console.log("✅ New tokens generated and cookie refreshed for:", cadmin.username);

    return { access_token: accessToken };
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    console.log("Error name:", err.name);

    // Clear the invalid cookie
    res.clearCookie("cadmin_refresh_token", {
      path: "/cadmin",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    const e = new Error("Invalid or expired refresh token");
    e.status = 401;
    throw e;
  }
}

/**
 * logoutCAdminService
 */
export async function logoutCAdminService({ req, res }) {
  res.clearCookie("cadmin_refresh_token", {
    path: "/cadmin",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  console.log("✅ Refresh token cookie cleared");
  return;
}