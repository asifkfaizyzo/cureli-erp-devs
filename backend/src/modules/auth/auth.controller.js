//backend\src\modules\auth\auth.controller.js
import prisma from "../../config/prisma.js";
import { fail, success } from "../../utils/response.js";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET, ACCESS_EXPIRES, REFRESH_SECRET } from "../../config/jwt.js";
import { requestPasswordReset, resetPassword } from "./auth.service.js";
import * as audit from "../audit/index.js";

// No changes needed - token refresh is not an auditable event
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
    return fail(res, "Invalid refresh token", 401);
  }
}

// No changes needed - password reset request doesn't change state yet
export async function forgotPasswordController(req, res) {
  try {
    const { email } = req.validated;

    await requestPasswordReset(email);

    return success(
      res,
      {},
      "If that email exists, we've sent a password reset link"
    );
  } catch (err) {
    if (err.code === "GOOGLE_ACCOUNT") {
      return fail(res, err.message, 400);
    }
    console.error(err);
    return fail(res, "Failed to process request", 500);
  }
}

// ✅ UPDATED: Extract audit context for password reset completion
export async function resetPasswordController(req, res) {
  try {
    const { token, password } = req.validated;

    // Extract audit context (IP, user agent)
    const auditContext = audit.extractRequestContext(req);

    await resetPassword(token, password, auditContext);

    return success(res, {}, "Password reset successful. You can now log in.");
  } catch (err) {
    if (err.code === "INVALID_TOKEN") {
      return fail(res, err.message, 400);
    }
    console.error(err);
    return fail(res, "Failed to reset password", 500);
  }
}