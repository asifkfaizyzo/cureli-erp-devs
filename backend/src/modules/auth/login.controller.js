// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\auth\login.controller.js

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
} from "../../utils/session.js";

// ============================================
// ONBOARDING CONTROLLERS
// ============================================

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
        "Step already completed"
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

    // ✅ Get current user to check if this is first-time verification
    const user = await prisma.user.findUnique({
      where: { user_id },
      select: { first_verified_at: true },
    });

    // Build update data
    const updateData = {
      first_login_after_verification: true,
    };

    // ✅ NEW: Only set first_verified_at if this is the FIRST time
    // This preserves the original date for returning users
    if (!user?.first_verified_at) {
      updateData.first_verified_at = new Date();
      console.log("📅 First-time verification complete for user:", user_id);
    } else {
      console.log("🔄 Returning user verification complete for user:", user_id);
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

// ============================================
// LOGIN CONTROLLER
// ============================================

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
          400
        );
      }

      return fail(res, "Invalid credentials", 401);
    }

    if (!user.is_active) {
      return fail(
        res,
        "Your account has been suspended. Please contact Cureli support for assistance.",
        403,
        { code: "ACCOUNT_SUSPENDED" }
      );
    }

    if (!user.password_hash) {
      return fail(res, "This account requires Google login", 400);
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return fail(res, "Invalid credentials", 401);
    }

    await sendLoginOtp(user.user_id);

    const tempToken = jwt.sign(
      { user_id: user.user_id, purpose: "login_otp" },
      TEMP_TOKEN_SECRET,
      { expiresIn: "10m" }
    );

    return success(
      res,
      {
        temp_token: tempToken,
        phone_hint: user.phone_number
          ? `***${user.phone_number.slice(-4)}`
          : null,
        message: "OTP sent to your registered phone number",
      },
      "OTP sent"
    );
  } catch (err) {
    console.error(err);

    if (err.code === "NO_PHONE") {
      return fail(
        res,
        "No phone number registered. Please contact support.",
        400
      );
    }

    if (err.code === "OTP_COOLDOWN") {
      return fail(res, err.message, 429);
    }

    return fail(res, "Login failed", 500);
  }
}


// ============================================
// RESEND LOGIN OTP CONTROLLER
// ============================================


export async function resendLoginOtpController(req, res) {
  try {
    const { temp_token } = req.validated;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(temp_token, TEMP_TOKEN_SECRET);
    } catch (err) {
      return fail(res, "Invalid or expired session. Please login again.", 401);
    }

    if (decoded.purpose !== "login_otp") {
      return fail(res, "Invalid token", 401);
    }

    // Resend OTP
    await sendLoginOtp(decoded.user_id, true); // true = isResend

    // Get user for phone hint
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { phone_number: true },
    });

    // Issue a new temp token with fresh expiry
    const newTempToken = jwt.sign(
      { user_id: decoded.user_id, purpose: "login_otp" },
      TEMP_TOKEN_SECRET,
      { expiresIn: "10m" }
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
      "OTP resent"
    );
  } catch (err) {
    console.error("Resend OTP error:", err);

    if (err.code === "NO_PHONE") {
      return fail(
        res,
        "No phone number registered. Please contact support.",
        400
      );
    }

    if (err.code === "OTP_COOLDOWN") {
      // Return with waitTime so frontend can sync timer
      return fail(res, err.message, 429, { waitTime: err.waitTime || 30 });
    }

    if (err.code === "NOT_FOUND") {
      return fail(res, "User not found", 404);
    }

    return fail(res, "Failed to resend OTP", 500);
  }
}
// ============================================
// VERIFY LOGIN OTP — UPDATED WITH branch_id
// ============================================

export async function verifyLoginOtpController(req, res) {
  try {
    const { temp_token, otp } = req.validated;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(temp_token, TEMP_TOKEN_SECRET);
    } catch (err) {
      return fail(res, "Invalid or expired session", 401);
    }

    if (decoded.purpose !== "login_otp") {
      return fail(res, "Invalid token", 401);
    }

    // Verify OTP with MessageCentral
    await verifyLoginOtp(decoded.user_id, otp);

    // ============================================
    // UPDATED: Fetch user WITH branch relation
    // ============================================
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
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

    if (!user) {
      return fail(res, "User not found", 404);
    }

    // Create session (invalidates existing sessions)
    const sessionToken = await createUserSession(user.user_id, req);

    // ============================================
    // UPDATED: JWT payload now includes branch_id
    // ============================================
    const jwtPayload = {
      user_id: user.user_id,
      shop_id: user.shop_id,
      branch_id: user.branch_id || null, // NEW: branch context
      role: user.role,
      status: user.status,
      session_id: sessionToken,
    };

    const accessToken = jwt.sign(jwtPayload, ACCESS_SECRET, {
      expiresIn: ACCESS_EXPIRES,
    });

    // Refresh token also includes branch_id for token refresh
    const refreshToken = jwt.sign(
      {
        user_id: user.user_id,
        branch_id: user.branch_id || null, // NEW
        session_id: sessionToken,
      },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES }
    );

    // Set refresh token cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ============================================
    // UPDATED: Role-aware next_step logic
    // ============================================
    let nextStep = -1; // Default: dashboard
    const shopStatus = user.shop?.verification_status;

    
    // Staff and Branch Admin: Created verified, go straight to dashboard
    if (user.role === "staff" || user.role === "branch_admin") {
      nextStep = -1;
      console.log(`✅ ${user.role} → dashboard`);
    }
    // Super Admin: May still be in onboarding
    else if (user.role === "super_admin") {
      if (user.status === "pending_setup") {
        // Still in onboarding wizard
        nextStep = user.onboarding_step || 4;
        console.log("📋 super_admin in onboarding, step:", nextStep);
      } else if (user.status === "pending_verification") {
        // Documents submitted, awaiting review
        if (shopStatus === "partially_rejected" || shopStatus === "rejected") {
          nextStep = 14; // Resubmission page
        } else {
          nextStep = 12; // Pending review page
        }
        console.log("⏳ super_admin pending verification, step:", nextStep);
      } else if (user.status === "verified" || user.status === "active") {
        // Fully verified
        if (!user.first_login_after_verification) {
          nextStep = 15; // Success/welcome page
        } else {
          nextStep = -1; // Dashboard
        }
        console.log("✅ super_admin verified, step:", nextStep);
      }
    }

    console.log("📍 FINAL next_step:", nextStep);

    // ============================================
    // UPDATED: Response includes branch info
    // ============================================
    return success(
      res,
      {
        access_token: accessToken,
        next_step: nextStep,
        user_id: user.user_id,
        shop_id: user.shop_id,
        branch_id: user.branch_id || null, // NEW
        branch_name: user.branch?.branch_name || null, // NEW
        shop_name: user.shop?.business_name || null,
        role: user.role, // NEW
        user_name: `${user.first_name} ${user.last_name || ""}`.trim(),
      },
      "Login successful"
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

// ============================================
// TOKEN REFRESH — UPDATED WITH branch_id
// ============================================

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
      return fail(res, "Invalid refresh token", 401);
    }

    // Validate session is still active
    if (decoded.session_id) {
      const session = await validateUserSession(
        decoded.user_id,
        decoded.session_id
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
          { code: "SESSION_INVALIDATED" }
        );
      }
    }

    // ============================================
    // UPDATED: Fetch fresh user data including branch_id
    // ============================================
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: {
        user_id: true,
        shop_id: true,
        branch_id: true, // NEW
        role: true,
        status: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      return fail(res, "Invalid user", 401);
    }

    // ============================================
    // UPDATED: New access token includes branch_id
    // ============================================
    const accessToken = jwt.sign(
      {
        user_id: user.user_id,
        shop_id: user.shop_id,
        branch_id: user.branch_id || null, // NEW
        role: user.role,
        status: user.status,
        session_id: decoded.session_id,
      },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    return success(res, { access_token: accessToken });
  } catch (err) {
    console.error(err);
    return fail(res, "Invalid refresh token", 401);
  }
}

// ============================================
// LOGOUT CONTROLLER (unchanged)
// ============================================

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