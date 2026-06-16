// backend/src/modules/auth/login.controller.js

import prisma from "../../config/prisma.js";
import { comparePassword } from "../../utils/hash.js";
import jwt from "jsonwebtoken";
import {
  ACCESS_SECRET,
  ACCESS_EXPIRES,
  REFRESH_SECRET,
  REFRESH_EXPIRES,
  TEMP_TOKEN_SECRET,
} from "../../config/jwt.js";
import { fail, success } from "../../utils/response.js";
import { sendLoginOtp, verifyLoginOtp } from "./login.service.js";
import {
  createUserSession,
  invalidateUserSession,
  validateUserSession,
  getClientIp,                    // ← now exported from session.js
} from "../../utils/session.js";
import { isIpTrusted, markIpAsTrusted } from "../../utils/trustedIp.js";  // ← new

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper — builds the full auth response payload.
//
// Used by BOTH the OTP-skip path (loginController) and the OTP-verify path
// (verifyLoginOtpController) so the two responses are always identical.
//
// @param {Object} user     — full Prisma user record with shop + branch included
// @param {Object} req      — Express request (needed for session creation)
// @param {Object} res      — Express response (needed for cookie)
// @returns {Object}        — the data payload to pass to success()
// ─────────────────────────────────────────────────────────────────────────────
async function buildAuthResponse(user, req, res) {
  const sessionToken = await createUserSession(user.user_id, req);

  const jwtPayload = {
    user_id: user.user_id,
    shop_id: user.shop_id,
    branch_id: user.branch_id || null,
    role: user.role,
    status: user.status,
    session_id: sessionToken,
  };

  const accessToken = jwt.sign(jwtPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });

  const refreshToken = jwt.sign(
    {
      user_id: user.user_id,
      branch_id: user.branch_id || null,
      session_id: sessionToken,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES },
  );

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Determine next_step — identical logic to what was in verifyLoginOtpController
  let nextStep = -1;
  const shopStatus = user.shop?.verification_status;

  if (user.role === "staff" || user.role === "branch_admin") {
    nextStep = -1;
  } else if (user.role === "super_admin") {
    if (user.status === "pending_setup") {
      nextStep = user.onboarding_step || 4;
    } else if (user.status === "pending_verification") {
      if (shopStatus === "partially_rejected" || shopStatus === "rejected") {
        nextStep = 14;
      } else {
        nextStep = 12;
      }
    } else if (user.status === "verified" || user.status === "active") {
      if (!user.first_login_after_verification) {
        nextStep = 15;
      } else {
        nextStep = -1;
      }
    }
  }

  return {
    access_token: accessToken,
    next_step: nextStep,
    user_id: user.user_id,
    shop_id: user.shop_id,
    branch_id: user.branch_id || null,
    branch_name: user.branch?.branch_name || null,
    shop_name: user.shop?.business_name || null,
    role: user.role,
    user_name: `${user.first_name} ${user.last_name || ""}`.trim(),
    username: user.username || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared user fetch — used by both loginController (OTP skip) and
// verifyLoginOtpController. Includes the exact same relations both need.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchFullUser(userId) {
  return prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      shop: {
        select: {
          verification_status: true,
          business_name: true,
        },
      },
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
        },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding controllers — unchanged
// ─────────────────────────────────────────────────────────────────────────────

export async function getOnboardingStatusController(req, res) {
  try {
    const user_id = req.user.user_id;

    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        status: true,
        onboarding_step: true,
        first_name: true,
        last_name: true,
        shop: {
          select: {
            verification_status: true,
          },
        },
      },
    });

    if (!user) {
      return fail(res, "User not found", 404);
    }

    return success(res, {
      status: user.status,
      onboarding_step: user.onboarding_step ?? 4,
      verification_status: user.shop?.verification_status || null,
      user_name: `${user.first_name} ${user.last_name || ""}`.trim(),
    });
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to get onboarding status", 500);
  }
}

export async function updateOnboardingStepController(req, res) {
  try {
    const user_id = req.user.user_id;
    const { step } = req.body;

    if (typeof step !== "number" || step < 4 || step > 12) {
      return fail(res, "Invalid step value", 400);
    }

    const user = await prisma.user.findUnique({
      where: { user_id },
      select: { onboarding_step: true },
    });

    if (!user) {
      return fail(res, "User not found", 404);
    }

    if (step <= user.onboarding_step) {
      return success(
        res,
        { onboarding_step: user.onboarding_step },
        "Step already completed",
      );
    }

    await prisma.user.update({
      where: { user_id },
      data: { onboarding_step: step },
    });

    return success(res, { onboarding_step: step }, "Step updated");
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to update onboarding step", 500);
  }
}

export async function completeOnboardingController(req, res) {
  try {
    const user_id = req.user.user_id;

    const user = await prisma.user.findUnique({
      where: { user_id },
      select: { first_verified_at: true },
    });

    const updateData = {
      first_login_after_verification: true,
    };

    if (!user?.first_verified_at) {
      updateData.first_verified_at = new Date();
    }

    await prisma.user.update({
      where: { user_id },
      data: updateData,
    });

    return success(res, {}, "Onboarding completed");
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to complete onboarding", 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// loginController
//
// CHANGED: After password verification, check if user+IP is trusted.
//   Trusted  → skip OTP, return tokens directly with otp_required: false
//   Untrusted → send OTP as before, return temp_token with otp_required: true
// ─────────────────────────────────────────────────────────────────────────────
export async function loginController(req, res) {
  try {
    const { username, password } = req.validated;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      const pending = await prisma.pendingUser.findFirst({
        where: { email: username },
      });

      if (pending) {
        return fail(
          res,
          "Your signup was not completed. Please restart the signup process.",
          400,
        );
      }

      return fail(res, "Invalid credentials", 401);
    }

    if (!user.is_active) {
      return fail(
        res,
        "Your account has been suspended. Please contact Cureli support for assistance.",
        403,
        { code: "ACCOUNT_SUSPENDED" },
      );
    }

    if (!user.password_hash) {
      return fail(res, "This account requires Google login", 400);
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return fail(res, "Invalid credentials", 401);
    }

    // ── Trusted IP check ──────────────────────────────────────────────────
    // Only runs after credentials are confirmed valid.
    // If this user+IP combo was OTP-verified within the last 7 days,
    // skip OTP entirely and issue tokens immediately.
    // ─────────────────────────────────────────────────────────────────────
    const ipAddress = getClientIp(req);
    const trusted = await isIpTrusted(user.user_id, ipAddress);

    if (trusted) {
      const fullUser = await fetchFullUser(user.user_id);

      if (!fullUser) {
        return fail(res, "User not found", 404);
      }

      const authData = await buildAuthResponse(fullUser, req, res);

      return success(
        res,
        {
          otp_required: false,
          ...authData,
        },
        "Login successful",
      );
    }

    // ── Standard OTP flow ─────────────────────────────────────────────────
    await sendLoginOtp(user.user_id);

    const tempToken = jwt.sign(
      { user_id: user.user_id, purpose: "login_otp" },
      TEMP_TOKEN_SECRET,
      { expiresIn: "10m" },
    );

    return success(
      res,
      {
        otp_required: true,
        temp_token: tempToken,
        phone_hint: user.phone_number
          ? `***${user.phone_number.slice(-4)}`
          : null,
        message: "OTP sent to your registered phone number",
      },
      "OTP sent",
    );
  } catch (err) {
    console.error(err);

    if (err.code === "NO_PHONE") {
      return fail(
        res,
        "No phone number registered. Please contact support.",
        400,
      );
    }

    if (err.code === "OTP_COOLDOWN") {
      return fail(res, err.message, 429, { waitTime: err.waitTime });
    }

    if (err.code === "OTP_DAILY_LIMIT") {
      return fail(res, err.message, 429);
    }

    if (err.code === "OTP_LOCKED") {
      return fail(res, err.message, 429);
    }

    return fail(res, "Login failed", 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resendLoginOtpController — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export async function resendLoginOtpController(req, res) {
  try {
    const { temp_token } = req.validated;

    let decoded;
    try {
      decoded = jwt.verify(temp_token, TEMP_TOKEN_SECRET);
    } catch (err) {
      return fail(res, "Invalid or expired session. Please login again.", 401);
    }

    if (decoded.purpose !== "login_otp") {
      return fail(res, "Invalid token", 401);
    }

    await sendLoginOtp(decoded.user_id, true);

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { phone_number: true },
    });

    const newTempToken = jwt.sign(
      { user_id: decoded.user_id, purpose: "login_otp" },
      TEMP_TOKEN_SECRET,
      { expiresIn: "10m" },
    );

    return success(
      res,
      {
        temp_token: newTempToken,
        phone_hint: user?.phone_number
          ? `***${user.phone_number.slice(-4)}`
          : null,
        message: "OTP resent successfully",
      },
      "OTP resent",
    );
  } catch (err) {
    console.error("Resend OTP error:", err);

    if (err.code === "NO_PHONE") {
      return fail(
        res,
        "No phone number registered. Please contact support.",
        400,
      );
    }

    if (err.code === "OTP_COOLDOWN") {
      return fail(res, err.message, 429, { waitTime: err.waitTime || 30 });
    }

    if (err.code === "OTP_DAILY_LIMIT") {
      return fail(res, err.message, 429);
    }

    if (err.code === "OTP_LOCKED") {
      return fail(res, err.message, 429);
    }

    if (err.code === "NOT_FOUND") {
      return fail(res, "User not found", 404);
    }

    return fail(res, "Failed to resend OTP", 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// verifyLoginOtpController
//
// CHANGED: After successful OTP verification, call markIpAsTrusted()
// so future logins from this IP within 7 days skip OTP.
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyLoginOtpController(req, res) {
  try {
    const { temp_token, otp } = req.validated;

    let decoded;
    try {
      decoded = jwt.verify(temp_token, TEMP_TOKEN_SECRET);
    } catch (err) {
      return fail(res, "Invalid or expired session", 401);
    }

    if (decoded.purpose !== "login_otp") {
      return fail(res, "Invalid token", 401);
    }

    await verifyLoginOtp(decoded.user_id, otp);

    const user = await fetchFullUser(decoded.user_id);

    if (!user) {
      return fail(res, "User not found", 404);
    }

    // ── Mark this IP as trusted after successful OTP ───────────────────
    // Non-blocking: if this fails (e.g. DB hiccup), login still succeeds.
    // The user will just be asked for OTP again next time, which is safe.
    // ─────────────────────────────────────────────────────────────────────
    const ipAddress = getClientIp(req);
    markIpAsTrusted(user.user_id, ipAddress).catch((err) => {
      console.error("[verifyLoginOtp] Failed to mark IP as trusted:", err);
    });

    const authData = await buildAuthResponse(user, req, res);

    return success(
      res,
      {
        otp_required: false, // consistent field — always false after verify
        ...authData,
      },
      "Login successful",
    );
  } catch (err) {
    console.error(err);

    if (err.code === "INVALID_OTP") {
      return fail(res, err.message, 400);
    }
    if (err.code === "OTP_EXPIRED") {
      return fail(res, err.message, 400);
    }
    if (err.code === "TOO_MANY_ATTEMPTS") {
      return fail(res, err.message, 429);
    }

    return fail(res, "OTP verification failed", 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// refreshTokenController — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export async function refreshTokenController(req, res) {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return fail(res, "No refresh token", 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return fail(res, "Invalid refresh token", 401);
    }

    if (decoded.session_id) {
      const session = await validateUserSession(
        decoded.user_id,
        decoded.session_id,
      );

      if (!session) {
        res.clearCookie("refresh_token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        return fail(
          res,
          "Session expired or logged in from another device",
          401,
          { code: "SESSION_INVALIDATED" },
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: {
        user_id: true,
        shop_id: true,
        branch_id: true,
        role: true,
        status: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return fail(res, "Invalid user", 401);
    }

    const accessToken = jwt.sign(
      {
        user_id: user.user_id,
        shop_id: user.shop_id,
        branch_id: user.branch_id || null,
        role: user.role,
        status: user.status,
        session_id: decoded.session_id,
      },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES },
    );

    const newRefreshToken = jwt.sign(
      {
        user_id: user.user_id,
        branch_id: user.branch_id || null,
        session_id: decoded.session_id,
      },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES },
    );

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, { access_token: accessToken });
  } catch (err) {
    console.error(err);
    return fail(res, "Invalid refresh token", 401);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// logoutController — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export async function logoutController(req, res) {
  try {
    const { user_id, session_id } = req.user;

    if (session_id) {
      await invalidateUserSession(user_id, session_id, "logout");
    }

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return success(res, {}, "Logged out successfully");
  } catch (err) {
    console.error(err);
    return fail(res, "Logout failed", 500);
  }
}