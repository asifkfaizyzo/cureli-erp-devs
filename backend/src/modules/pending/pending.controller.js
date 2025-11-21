import {
  createPendingUser,
  sendEmailOtp,
  verifyEmailOtp,
  setUsername,
  sendSmsOtp,
  verifySmsOtp,
} from "./pending.service.js";
import { success, fail } from "../../utils/response.js";

import jwt from "jsonwebtoken";
import {
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
} from "../../config/jwt.js";

export async function startPendingSignup(req, res) {
  try {
    const { first_name, last_name, email, password } = req.validated;

    const pending = await createPendingUser({
      first_name,
      last_name,
      email,
      password,
    });

    return success(res, { pending_id: pending.pending_id }, "Signup started");
  } catch (err) {
    if (err.code === "EMAIL_EXISTS") {
      return fail(res, err.message, 400);
    }
    if (err.code === "PENDING_EXISTS") {
      return fail(res, err.message, 400);
    }
    console.error(err);
    return fail(res, "Cannot start signup", 500);
  }
}

export async function requestEmailOtp(req, res) {
  try {
    const { pending_id } = req.body;

    await sendEmailOtp(pending_id);

    return success(res, {}, "OTP sent to email");
  } catch (err) {
    if (err.code === "OTP_COOLDOWN") {
      return fail(res, err.message, 429);
    }
    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    console.error(err);
    return fail(res, "Failed to send OTP", 500);
  }
}

export async function verifyEmailOtpController(req, res) {
  try {
    const { pending_id, otp } = req.body;

    await verifyEmailOtp(pending_id, otp);

    return success(res, {}, "Email verified successfully");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "NO_OTP") return fail(res, err.message, 400);
    if (err.code === "OTP_EXPIRED") return fail(res, err.message, 400);
    if (err.code === "INVALID_OTP") return fail(res, err.message, 400);

    console.error(err);
    return fail(res, "Failed to verify OTP", 500);
  }
}

/**
 * SMS: request send
 * body: { pending_id, phone }
 */
export async function requestSmsOtp(req, res) {
  try {
    const { pending_id, phone } = req.body;

    // Basic phone sanity check (server-side)
    if (!phone || typeof phone !== "string") {
      return fail(res, "Invalid phone number", 400);
    }

    await sendSmsOtp(pending_id, phone);

    return success(res, {}, "OTP sent to phone");
  } catch (err) {
    if (err.code === "OTP_COOLDOWN") return fail(res, err.message, 429);
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    console.error(err);
    return fail(res, "Failed to send SMS OTP", 500);
  }
}

/**
 * SMS: verify
 * body: { pending_id, code }
 * Server-managed verificationId (client does not provide it)
 */
export async function verifySmsOtpController(req, res) {
  try {
    const { pending_id, code } = req.body;

    await verifySmsOtp(pending_id, code);

    return success(res, {}, "Phone verified successfully");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "NO_OTP") return fail(res, err.message, 400);
    if (err.code === "OTP_EXPIRED") return fail(res, err.message, 400);
    if (err.code === "INVALID_OTP") return fail(res, err.message, 400);

    console.error(err);
    return fail(res, "Failed to verify SMS OTP", 500);
  }
}

/**
 * Username selection — now requires BOTH email && sms verified
 */
export async function chooseUsernameController(req, res) {
  try {
    const { pending_id, username } = req.validated;

    await setUsername(pending_id, username);

    return success(res, {}, "Username saved");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "EMAIL_NOT_VERIFIED" || err.code === "PHONE_NOT_VERIFIED")
      return fail(res, err.message, 400);
    if (err.code === "USERNAME_EXISTS") return fail(res, err.message, 400);
    if (err.code === "USERNAME_PENDING_EXISTS")
      return fail(res, err.message, 400);

    console.error(err);
    return fail(res, "Failed to save username", 500);
  }
}


/* FINALIZE SIGNUP → CREATE SUPERADMIN */
export async function completePendingSignupController(req, res) {
  try {
    const { pending_id } = req.body;

    const user = await finalizePendingSignup(pending_id);

    const accessToken = jwt.sign(
      { user_id: user.user_id, role: user.role, status: user.status },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES }
    );

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return success(
      res,
      {
        user,
        access_token: accessToken
      },
      "Signup completed",
      201
    );
  } catch (err) {
    return fail(res, err.message, 400);
  }
}