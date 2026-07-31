// backend/src/modules/rider/auth/rider.auth.controller.js

import { fail, success } from "../../../utils/response.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from "./rider.auth.schema.js";
import {
  sendRiderOtp,
  verifyRiderOtp,
  refreshRiderToken,
  logoutRider,
  logoutAllRider,
  getRiderMe,
} from "./rider.auth.service.js";

export async function sendOtp(req, res) {
  const parsed = sendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await sendRiderOtp(parsed.data.phone);
    return success(res, "OTP sent successfully", result);
  } catch (err) {
    const statusMap = {
      OTP_DAILY_LIMIT:   429,
      OTP_COOLDOWN:      429,
      OTP_LOCKED:        429,
      ACCOUNT_SUSPENDED: 403,
      ACCOUNT_BLOCKED:   403,
      SMS_FAILED:        503,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}

export async function verifyOtp(req, res) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  const { phone, otp, ...deviceInfo } = parsed.data;

  const requestMeta = {
    ip:        req.ip,
    userAgent: req.headers["user-agent"],
  };

  try {
    const result = await verifyRiderOtp(phone, otp, deviceInfo, requestMeta);
    return success(res, "OTP verified successfully", result);
  } catch (err) {
    const statusMap = {
      NO_OTP:            400,
      OTP_EXPIRED:       400,
      INVALID_OTP:       400,
      TOO_MANY_ATTEMPTS: 429,
      OTP_LOCKED:        429,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}

export async function refreshToken(req, res) {
  const parsed = refreshTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await refreshRiderToken(parsed.data.refresh_token);
    return success(res, "Token refreshed", result);
  } catch (err) {
    const statusMap = {
      INVALID_REFRESH_TOKEN: 401,
      SESSION_REVOKED:       401,
      SESSION_EXPIRED:       401,
      SESSION_INVALIDATED:   401,
      ACCOUNT_DELETED:       404,
      ACCOUNT_SUSPENDED:     403,
      ACCOUNT_BLOCKED:       403,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}

export async function logout(req, res) {
  try {
    await logoutRider(req.riderSession.id);
    return success(res, "Logged out successfully");
  } catch {
    return fail(res, "Logout failed", 500);
  }
}

export async function logoutAll(req, res) {
  try {
    await logoutAllRider(req.rider.rider_id);
    return success(res, "All sessions revoked");
  } catch {
    return fail(res, "Logout failed", 500);
  }
}

export async function getMe(req, res) {
  try {
    const rider = await getRiderMe(req.rider.rider_id);
    return success(res, "Rider profile retrieved", rider);
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, "Failed to fetch profile", 500);
  }
}