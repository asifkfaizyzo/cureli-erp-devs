import { fail, success } from "../../../utils/response.js";
import {
  checkPhoneSchema,
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  setPasswordSchema,
  refreshTokenSchema,
} from "./rider.auth.schema.js";
import {
  checkRiderPhone,
  sendRiderOtp,
  verifyRiderOtp,
  loginRider,
  setRiderPassword,
  refreshRiderToken,
  logoutRider,
  logoutAllRider,
  getRiderMe,
} from "./rider.auth.service.js";

// ── checkPhone ────────────────────────────────────────────────

export async function checkPhone(req, res) {
  const parsed = checkPhoneSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await checkRiderPhone(parsed.data.phone);
    return success(res, "Phone checked", result);
  } catch {
    return fail(res, "Failed to check phone", 500);
  }
}

// ── sendOtp ───────────────────────────────────────────────────

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

// ── verifyOtp ─────────────────────────────────────────────────

export async function verifyOtp(req, res) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  const { phone, otp, ...deviceInfo } = parsed.data;
  const requestMeta = { ip: req.ip, userAgent: req.headers["user-agent"] };

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

// ── login ─────────────────────────────────────────────────────

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  const { phone, password, ...deviceInfo } = parsed.data;
  const requestMeta = { ip: req.ip, userAgent: req.headers["user-agent"] };

  try {
    const result = await loginRider(phone, password, deviceInfo, requestMeta);
    return success(res, "Login successful", result);
  } catch (err) {
    const statusMap = {
      NOT_FOUND:          404,
      INVALID_PASSWORD:   401,
      NO_PASSWORD:        400,
      ACCOUNT_SUSPENDED:  403,
      ACCOUNT_BLOCKED:    403,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}

// ── setPassword ───────────────────────────────────────────────

export async function setPassword(req, res) {
  const parsed = setPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  const { temp_token, password, ...deviceInfo } = parsed.data;
  const requestMeta = { ip: req.ip, userAgent: req.headers["user-agent"] };

  try {
    const result = await setRiderPassword(temp_token, password, deviceInfo, requestMeta);
    return success(res, "Password set successfully", result);
  } catch (err) {
    const statusMap = {
      INVALID_TEMP_TOKEN: 401,
      NOT_FOUND:          404,
      ALREADY_SET:        400,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}

// ── refreshToken ──────────────────────────────────────────────

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

// ── logout ────────────────────────────────────────────────────

export async function logout(req, res) {
  try {
    await logoutRider(req.riderSession.id);
    return success(res, "Logged out successfully");
  } catch {
    return fail(res, "Logout failed", 500);
  }
}

// ── logoutAll ─────────────────────────────────────────────────

export async function logoutAll(req, res) {
  try {
    await logoutAllRider(req.rider.rider_id);
    return success(res, "All sessions revoked");
  } catch {
    return fail(res, "Logout failed", 500);
  }
}

// ── getMe ─────────────────────────────────────────────────────

export async function getMe(req, res) {
  try {
    const rider = await getRiderMe(req.rider.rider_id);
    return success(res, "Rider profile retrieved", rider);
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, "Failed to fetch profile", 500);
  }
}