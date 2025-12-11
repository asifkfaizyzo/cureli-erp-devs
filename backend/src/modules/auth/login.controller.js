//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\auth\login.controller.js
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

    // Validate step is a number between 4 and 12
    if (typeof step !== "number" || step < 4 || step > 12) {
      return fail(res, "Invalid step value", 400);
    }

    // Get current step to prevent going backwards
    const user = await prisma.user.findUnique({
      where: { user_id },
      select: { onboarding_step: true },
    });

    if (!user) {
      return fail(res, "User not found", 404);
    }

    // Only allow moving forward, not backward
    if (step <= user.onboarding_step) {
      return success(res, { onboarding_step: user.onboarding_step }, "Step already completed");
    }

    // Update the step
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

export async function loginController(req, res) {
  try {
    const { username, password } = req.validated;

    // Find user
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      // Check if pending user
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

    // Check if active
    if (!user.is_active) {
      return fail(res, "Account disabled", 403);
    }

    // Verify password
    if (!user.password_hash) {
      return fail(res, "This account requires Google login", 400);
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return fail(res, "Invalid credentials", 401);
    }

    // ✅ Password correct → Send OTP
    await sendLoginOtp(user.user_id);

    // Generate temporary token (only for OTP verification)
    const tempToken = jwt.sign(
      { user_id: user.user_id, purpose: "login_otp" },
      TEMP_TOKEN_SECRET,
      { expiresIn: "10m" } // 10 minutes to complete OTP
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
      return fail(res, "No phone number registered. Please contact support.", 400);
    }
    
    if (err.code === "OTP_COOLDOWN") {
      return fail(res, err.message, 429);
    }

    return fail(res, "Login failed", 500);
  }
}

// backend/src/modules/auth/auth.controller.js


// backend/src/modules/auth/login.controller.js

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

    // Verify OTP
    await verifyLoginOtp(decoded.user_id, otp);

    // Get user details WITH shop info
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      include: {
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

    // Generate real tokens
    const accessToken = jwt.sign(
      {
        user_id: user.user_id,
        shop_id: user.shop_id,
        role: user.role,
        status: user.status,
      },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES }
    );

    // Set refresh token cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ FIXED: Determine next step based on user + shop status
    let nextStep = -1; // Default: dashboard
    
    const shopStatus = user.shop?.verification_status;

    console.log("🔍 LOGIN DEBUG:", {
      user_status: user.status,
      shop_verification_status: shopStatus,
      onboarding_step: user.onboarding_step,
      first_login_after_verification: user.first_login_after_verification,
    });

    // CASE 1: Still in onboarding (hasn't completed document upload)
    if (user.status === "pending_setup") {
      nextStep = user.onboarding_step || 4;
      console.log("📋 User in onboarding, step:", nextStep);
    }

    // CASE 2: Documents submitted, waiting for verification
    else if (user.status === "pending_verification") {
      if (shopStatus === "partially_rejected" || shopStatus === "rejected") {
        // Has rejected files → show resubmission page
        nextStep = 14;
        console.log("❌ Documents rejected, showing resubmission page");
      } else {
        // pending_review or other → show pending page
        nextStep = 12;
        console.log("⏳ Documents under review, showing pending page");
      }
    }

    // CASE 3: Fully verified
    else if (user.status === "verified") {
      if (!user.first_login_after_verification) {
        // First login after verification → show success page
        nextStep = 15; // ✅ FIXED: Changed from 13 to 15
        console.log("🎉 First login after verification, showing success");
      } else {
        // Already seen success → go to dashboard
        nextStep = -1;
        console.log("✅ Verified user, going to dashboard");
      }
    }

    console.log("📍 FINAL next_step:", nextStep);

    return success(
      res,
      {
        access_token: accessToken,
        next_step: nextStep,
        shop_id: user.shop_id,
        user_id: user.user_id,
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

// Keep existing controllers
export async function refreshTokenController(req, res) {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return fail(res, "No refresh token", 401);
    }
    
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
    });
    
    if (!user || !user.is_active) {
      return fail(res, "Invalid user", 401);
    }
    
    const accessToken = jwt.sign(
      {
        user_id: user.user_id,
        shop_id: user.shop_id,
        role: user.role,
        status: user.status,
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

export async function completeOnboardingController(req, res) {
  try {
    const user_id = req.user.user_id;

    await prisma.user.update({
      where: { user_id },
      data: { first_login_after_verification: true },
    });

    return success(res, {}, "Onboarding completed");
    
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to complete onboarding", 500);
  }
}