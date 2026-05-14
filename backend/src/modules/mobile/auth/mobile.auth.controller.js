// src/modules/mobile/auth/mobile.auth.controller.js
//
// Thin controller layer. No business logic here.
// All logic lives in mobile.auth.service.js.

import { success, fail } from "../../../utils/response.js";
import {
  sendMobileOtp,
  verifyMobileOtp,
  refreshMobileToken,
  logoutMobile,
  logoutAllMobile,
  getMobileMe,
} from "./mobile.auth.service.js";

/**
 * POST /mobile/auth/send-otp
 * Body: { phone }
 */
export async function handleSendOtp(req, res) {
  try {
    const { phone } = req.body;
    const result = await sendMobileOtp(phone);

    return success(
      res,
      { expires_in: result.timeout },
      "OTP sent successfully"
    );
  } catch (err) {
    const statusMap = {
      OTP_COOLDOWN: 429,
      OTP_LOCKED: 429,
      OTP_DAILY_LIMIT: 429,
      ACCOUNT_SUSPENDED: 403,
      ACCOUNT_DELETED: 404,
      SMS_FAILED: 502,
    };

    const status = statusMap[err.code] || 400;
    const data = err.waitTime ? { wait_seconds: err.waitTime } : {};
    return fail(res, err.message, status, data);
  }
}

/**
 * POST /mobile/auth/verify-otp
 * Body: { phone, otp, device_info? }
 */
export async function handleVerifyOtp(req, res) {
  try {
    const { phone, otp, device_info } = req.body;

    const requestMeta = {
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    };

    const result = await verifyMobileOtp(phone, otp, device_info, requestMeta);

    return success(
      res,
      {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        expires_in: result.expiresIn,
        token_type: "Bearer",
        is_new_user: result.isNewUser,
        user: result.user,
      },
      result.isNewUser ? "Welcome to Cureli!" : "Login successful"
    );
  } catch (err) {
    const statusMap = {
      NO_OTP: 400,
      OTP_EXPIRED: 400,
      INVALID_OTP: 400,
      TOO_MANY_ATTEMPTS: 429,
      OTP_LOCKED: 429,
      ACCOUNT_SUSPENDED: 403,
      ACCOUNT_DELETED: 404,
    };

    const status = statusMap[err.code] || 400;
    return fail(res, err.message, status);
  }
}

/**
 * POST /mobile/auth/refresh
 * Body: { refresh_token }
 */
export async function handleRefresh(req, res) {
  try {
    const { refresh_token } = req.body;
    const result = await refreshMobileToken(refresh_token);

    return success(
      res,
      {
        access_token: result.accessToken,
        expires_in: result.expiresIn,
        token_type: "Bearer",
      },
      "Token refreshed"
    );
  } catch (err) {
    const statusMap = {
      INVALID_REFRESH_TOKEN: 401,
      SESSION_REVOKED: 401,
      SESSION_EXPIRED: 401,
      SESSION_INVALIDATED: 401,
      ACCOUNT_DELETED: 401,
      ACCOUNT_SUSPENDED: 403,
    };

    const status = statusMap[err.code] || 401;
    return fail(res, err.message, status);
  }
}

/**
 * POST /mobile/auth/logout
 * Requires: mobileAuth middleware
 */
export async function handleLogout(req, res) {
  try {
    await logoutMobile(req.mobileSession.id);
    return success(res, {}, "Logged out successfully");
  } catch {
    return fail(res, "Logout failed", 500);
  }
}

/**
 * POST /mobile/auth/logout-all
 * Requires: mobileAuth middleware
 */
export async function handleLogoutAll(req, res) {
  try {
    await logoutAllMobile(req.mobileUser.id);
    return success(res, {}, "All devices logged out successfully");
  } catch {
    return fail(res, "Logout failed", 500);
  }
}

/**
 * GET /mobile/auth/me
 * Requires: mobileAuth middleware
 */
export async function handleMe(req, res) {
  try {
    const user = await getMobileMe(req.mobileUser.id);
    return success(res, { user }, "Profile fetched");
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return fail(res, "User not found", 404);
    }
    return fail(res, "Failed to fetch profile", 500);
  }
}