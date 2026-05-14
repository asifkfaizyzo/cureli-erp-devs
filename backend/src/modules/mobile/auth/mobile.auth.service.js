// src/modules/mobile/auth/mobile.auth.service.js
//
// Core auth business logic for Cureli Mobile.
// Follows the same OTP pattern as src/modules/auth/login.service.js
// but operates exclusively on CureliMobileUser and CureliMobileSession.

import crypto from "crypto";
import prisma from "../../../config/prisma.js";
import {
  signMobileAccessToken,
  REFRESH_TOKEN_EXPIRY_MS,
  ACCESS_TOKEN_EXPIRY_SECONDS,
} from "../../../config/mobile_jwt.js";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
} from "../../../utils/otp.js";
import { checkSmsOtpLimit } from "../../../utils/otpLimiter.js";
import {
  msg91SendSms,
  formatPhoneNumber,
} from "../../../providers/msg91/sendSms.js";

// ── Constants ─────────────────────────────────────────────────
const OTP_LENGTH = 6;
const OTP_VALIDITY_MS = 5 * 60 * 1000;          // 5 minutes
const OTP_VALIDITY_SECONDS = 5 * 60;             // 300 — sent to client
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS_PER_OTP = 5;
const MAX_FAILED_CYCLES = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;      // 1 hour

// ── Helpers ───────────────────────────────────────────────────

/**
 * Generate a cryptographically random refresh token (plaintext).
 * The plaintext is returned to the client ONCE and never stored.
 * Only its SHA-256 hash is persisted in CureliMobileSession.
 *
 * @returns {string} hex string, 64 chars
 */
function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a refresh token for safe DB storage.
 * SHA-256 is used (not bcrypt) because refresh tokens are
 * high-entropy random strings — bcrypt's cost factor adds
 * no security benefit and slows down the refresh endpoint.
 *
 * @param {string} token - plaintext refresh token
 * @returns {string} hex hash
 */
function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Build a safe user object for API responses.
 * Never expose OTP fields, change fields, or internal state.
 *
 * @param {Object} user - CureliMobileUser row
 * @returns {Object}
 */
function formatUserForResponse(user) {
  return {
    id: user.id,
    phone: user.phone,
    phone_verified: user.phone_verified,
    full_name: user.full_name,
    email: user.email,
    profile_image_key: user.profile_image_key,
    status: user.status,
    referral_code: user.referral_code,
    created_at: user.created_at,
    last_seen_at: user.last_seen_at,
  };
}

// ── Service Functions ─────────────────────────────────────────

/**
 * Send OTP to a phone number.
 *
 * Flow:
 *   1. Check daily SMS limit (OtpDailyLimit table)
 *   2. Find or note the user (we don't create user yet — only on verify)
 *   3. Check account status if user exists
 *   4. Check OTP cooldown (prevent spam resend)
 *   5. Check lockout
 *   6. Generate OTP, hash it, store on user or in a pending slot
 *   7. Send SMS
 *
 * Note on new users:
 *   We store OTP on the CureliMobileUser row. For new users, we create
 *   a minimal stub user at send-otp time so we have a row to store the
 *   OTP hash against. The user is not "real" until verify-otp succeeds
 *   (phone_verified = false until then).
 *
 * @param {string} phone - normalized +91XXXXXXXXXX
 * @returns {Promise<{ timeout: number }>}
 */
export async function sendMobileOtp(phone) {
  // ── 1. Daily SMS limit ──────────────────────────────────
  // Namespace: "mobile:sms:" to isolate from ERP OTP counters
  const limitCheck = await checkSmsOtpLimit(`mobile:${phone}`);
  if (!limitCheck.allowed) {
    const err = new Error("Daily OTP limit reached. Please try again tomorrow.");
    err.code = "OTP_DAILY_LIMIT";
    throw err;
  }

  // ── 2. Find existing user ───────────────────────────────
  let user = await prisma.cureliMobileUser.findUnique({
    where: { phone },
  });

  // ── 3. Account state checks (only if user exists) ───────
  if (user) {
    if (user.deleted_at || user.status === "deleted") {
      const err = new Error("Account not found.");
      err.code = "ACCOUNT_DELETED";
      throw err;
    }

    if (user.status === "suspended") {
      const err = new Error(
        "Your account has been suspended. Please contact support."
      );
      err.code = "ACCOUNT_SUSPENDED";
      throw err;
    }

    // ── 4. Cooldown check ─────────────────────────────────
    if (user.login_otp_expires) {
      const expiresAt = new Date(user.login_otp_expires);
      const now = new Date();

      if (expiresAt > now) {
        const otpSentAt = new Date(expiresAt.getTime() - OTP_VALIDITY_MS);
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
          const waitTime = RESEND_COOLDOWN_SECONDS - secondsSinceSent;
          const err = new Error(
            `Please wait ${waitTime} seconds before requesting a new OTP.`
          );
          err.code = "OTP_COOLDOWN";
          err.waitTime = waitTime;
          throw err;
        }
      }
    }

    // ── 5. Lockout check ──────────────────────────────────
    if (
      user.otp_locked_until &&
      new Date(user.otp_locked_until) > new Date()
    ) {
      const minutesRemaining = Math.ceil(
        (new Date(user.otp_locked_until) - new Date()) / 60000
      );
      const err = new Error(
        `Too many failed attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`
      );
      err.code = "OTP_LOCKED";
      throw err;
    }
  }

  // ── 6. Generate and store OTP ───────────────────────────
  const otp = generateOtp(OTP_LENGTH);
  const otpHash = await hashOtp(otp);
  const otpExpires = new Date(Date.now() + OTP_VALIDITY_MS);

  if (user) {
    // Update existing user's OTP fields
    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        login_otp_hash: otpHash,
        login_otp_expires: otpExpires,
        login_otp_attempts: 0,
      },
    });
  } else {
    // Create stub user for new phone number.
    // phone_verified remains false until verify-otp succeeds.
    user = await prisma.cureliMobileUser.create({
      data: {
        phone,
        phone_verified: false,
        status: "active",
        login_otp_hash: otpHash,
        login_otp_expires: otpExpires,
        login_otp_attempts: 0,
      },
    });
  }

  // ── 7. Send SMS ─────────────────────────────────────────
  try {
    await msg91SendSms({
      templateId: process.env.MSG91_LOGIN_TEMPLATE,
      mobile: formatPhoneNumber(phone, process.env.MC_COUNTRY || "91"),
      variables: {
        // Template uses {{number}} variable (same as ERP login template)
        number: otp,
      },
    });
  } catch (providerErr) {
    // SMS failed — clear the OTP we just stored so the user
    // is not stuck with a hash that was never sent
    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        login_otp_hash: null,
        login_otp_expires: null,
        login_otp_attempts: 0,
      },
    });
    console.error("[MobileAuth] MSG91 send failed:", providerErr.message);
    const err = new Error("Failed to send OTP. Please try again.");
    err.code = "SMS_FAILED";
    throw err;
  }

  return { timeout: OTP_VALIDITY_SECONDS };
}

/**
 * Verify OTP and return tokens.
 *
 * Flow:
 *   1. Find user by phone
 *   2. Validate OTP exists and has not expired
 *   3. Check attempt count
 *   4. Verify OTP hash
 *   5. On failure: increment attempts, possibly lock account
 *   6. On success: clear OTP state, mark phone_verified, create session
 *   7. Return access token + refresh token + user
 *
 * @param {string} phone - normalized +91XXXXXXXXXX
 * @param {string} otp - 6 digit code from user
 * @param {Object} deviceInfo - optional device metadata from client
 * @param {Object} requestMeta - { ip, userAgent } from Express request
 * @returns {Promise<{ accessToken, refreshToken, expiresIn, isNewUser, user }>}
 */
export async function verifyMobileOtp(phone, otp, deviceInfo = {}, requestMeta = {}) {
  // ── 1. Find user ────────────────────────────────────────
  const user = await prisma.cureliMobileUser.findUnique({
    where: { phone },
  });

  if (!user) {
    const err = new Error("OTP not requested for this number.");
    err.code = "NO_OTP";
    throw err;
  }

  // ── 2. OTP existence and expiry ─────────────────────────
  if (!user.login_otp_hash || !user.login_otp_expires) {
    const err = new Error("No OTP found. Please request a new one.");
    err.code = "NO_OTP";
    throw err;
  }

  if (new Date() > new Date(user.login_otp_expires)) {
    const err = new Error("OTP has expired. Please request a new one.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // ── 3. Attempt count check ──────────────────────────────
  if (user.login_otp_attempts >= MAX_ATTEMPTS_PER_OTP) {
    const err = new Error(
      "Too many failed attempts. Please request a new OTP."
    );
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  // ── 4. Dev bypass ───────────────────────────────────────
  if (otp === "000000" && process.env.NODE_ENV === "development") {
    // Skip hash verification in development with magic code
    return await _completeVerification(user, deviceInfo, requestMeta);
  }

  // ── 5. Verify hash ──────────────────────────────────────
  const isValid = await verifyOtp(otp, user.login_otp_hash);

  if (!isValid) {
    const newAttempts = user.login_otp_attempts + 1;
    const newCycleFailures =
      newAttempts >= MAX_ATTEMPTS_PER_OTP
        ? user.otp_cycle_failures + 1
        : user.otp_cycle_failures;

    const shouldLock = newCycleFailures >= MAX_FAILED_CYCLES;

    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        login_otp_attempts: newAttempts,
        otp_cycle_failures: newCycleFailures,
        ...(shouldLock && {
          otp_locked_until: new Date(Date.now() + LOCKOUT_DURATION_MS),
          // Clear OTP so a new one must be requested after lockout
          login_otp_hash: null,
          login_otp_expires: null,
        }),
      },
    });

    if (shouldLock) {
      const err = new Error(
        "Too many failed attempts. Account locked for 1 hour."
      );
      err.code = "OTP_LOCKED";
      throw err;
    }

    const remaining = MAX_ATTEMPTS_PER_OTP - newAttempts;
    const err = new Error(
      `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
    );
    err.code = "INVALID_OTP";
    throw err;
  }

  // ── 6. OTP valid — complete verification ────────────────
  return await _completeVerification(user, deviceInfo, requestMeta);
}

/**
 * Internal: finalize login after OTP is confirmed valid.
 * Clears OTP state, creates session, returns tokens.
 *
 * @private
 */
async function _completeVerification(user, deviceInfo, requestMeta) {
  const isNewUser = !user.phone_verified;
  const now = new Date();

  // Generate refresh token (plaintext sent to client, hash stored in DB)
  const refreshTokenPlain = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshTokenPlain);
  const sessionExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  // Run user update + session creation in a transaction
  const [updatedUser, session] = await prisma.$transaction(async (tx) => {
    // Clear OTP state, mark phone verified, update last_seen
    const updated = await tx.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        phone_verified: true,
        phone_verified_at: user.phone_verified_at ?? now,
        login_otp_hash: null,
        login_otp_expires: null,
        login_otp_attempts: 0,
        otp_cycle_failures: 0,
        otp_locked_until: null,
        last_seen_at: now,
      },
    });

    // Create new session
    const newSession = await tx.cureliMobileSession.create({
      data: {
        user_id: user.id,
        refresh_token_hash: refreshTokenHash,
        device_id: deviceInfo?.device_id ?? null,
        device_name: deviceInfo?.device_name ?? null,
        device_platform: deviceInfo?.device_platform ?? null,
        device_os_version: deviceInfo?.device_os_version ?? null,
        app_version: deviceInfo?.app_version ?? null,
        ip_address: requestMeta.ip ?? null,
        user_agent: requestMeta.userAgent ?? null,
        expires_at: sessionExpiry,
        is_active: true,
      },
    });

    return [updated, newSession];
  });

  // Sign access token
  const accessToken = signMobileAccessToken({
    userId: updatedUser.id,
    sessionId: session.id,
  });

  return {
    accessToken,
    refreshToken: refreshTokenPlain,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    isNewUser,
    user: formatUserForResponse(updatedUser),
  };
}

/**
 * Refresh access token using a valid refresh token.
 *
 * Flow:
 *   1. Hash incoming token, find session
 *   2. Validate session is active and not expired
 *   3. Check logout_all_issued_at
 *   4. Check user status
 *   5. Update last_active_at
 *   6. Return new access token
 *
 * Refresh token is NOT rotated on use.
 * Reason: Mobile clients can have race conditions (background refresh
 * + foreground refresh simultaneously). Single rotation would invalidate
 * one of them and cause spurious logouts.
 *
 * @param {string} refreshToken - plaintext token from client
 * @returns {Promise<{ accessToken, expiresIn }>}
 */
export async function refreshMobileToken(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);

  // ── Find session by hash ────────────────────────────────
  const session = await prisma.cureliMobileSession.findUnique({
    where: { refresh_token_hash: tokenHash },
    include: { user: true },
  });

  if (!session) {
    const err = new Error("Invalid refresh token.");
    err.code = "INVALID_REFRESH_TOKEN";
    throw err;
  }

  // ── Session state checks ────────────────────────────────
  if (!session.is_active || session.revoked_at) {
    const err = new Error("Session has been revoked. Please log in again.");
    err.code = "SESSION_REVOKED";
    throw err;
  }

  if (new Date() > new Date(session.expires_at)) {
    const err = new Error("Session expired. Please log in again.");
    err.code = "SESSION_EXPIRED";
    throw err;
  }

  const user = session.user;

  // ── Logout-all check ────────────────────────────────────
  if (
    user.logout_all_issued_at &&
    new Date(session.created_at) < new Date(user.logout_all_issued_at)
  ) {
    const err = new Error("Session invalidated. Please log in again.");
    err.code = "SESSION_INVALIDATED";
    throw err;
  }

  // ── User state checks ───────────────────────────────────
  if (user.deleted_at || user.status === "deleted") {
    const err = new Error("Account not found.");
    err.code = "ACCOUNT_DELETED";
    throw err;
  }

  if (user.status === "suspended") {
    // Revoke this session so future refresh attempts fail fast
    await prisma.cureliMobileSession.update({
      where: { id: session.id },
      data: {
        is_active: false,
        revoked_at: new Date(),
        revoked_reason: "suspended",
      },
    });
    const err = new Error(
      "Your account has been suspended. Please contact support."
    );
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  // ── Update last_active_at ───────────────────────────────
  await prisma.cureliMobileSession.update({
    where: { id: session.id },
    data: { last_active_at: new Date() },
  });

  // ── Issue new access token ──────────────────────────────
  const accessToken = signMobileAccessToken({
    userId: user.id,
    sessionId: session.id,
  });

  return {
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  };
}

/**
 * Logout current device — revoke the active session.
 *
 * @param {string} sessionId - from req.mobileSession.id
 * @returns {Promise<void>}
 */
export async function logoutMobile(sessionId) {
  await prisma.cureliMobileSession.update({
    where: { id: sessionId },
    data: {
      is_active: false,
      revoked_at: new Date(),
      revoked_reason: "logout",
    },
  });
}

/**
 * Logout all devices — set logout_all_issued_at on user.
 *
 * This invalidates ALL sessions for this user without touching
 * each session row individually. O(1) operation regardless of
 * how many active sessions the user has.
 *
 * Individual session rows are left as-is. The middleware's
 * logout_all_issued_at check handles rejection.
 *
 * @param {string} userId - from req.mobileUser.id
 * @returns {Promise<void>}
 */
export async function logoutAllMobile(userId) {
  await prisma.cureliMobileUser.update({
    where: { id: userId },
    data: {
      logout_all_issued_at: new Date(),
    },
  });
}

/**
 * Get current user's profile.
 * Returns a safe subset of CureliMobileUser fields.
 *
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getMobileMe(userId) {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      phone_verified: true,
      email: true,
      full_name: true,
      profile_image_key: true,
      status: true,
      referral_code: true,
      created_at: true,
      last_seen_at: true,
      _count: {
        select: {
          addresses: {
            where: { deleted_at: null },
          },
        },
      },
    },
  });

  if (!user) {
    const err = new Error("User not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return {
    ...user,
    address_count: user._count.addresses,
    _count: undefined,
  };
}