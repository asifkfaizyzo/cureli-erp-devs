//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\auth\auth.service.js
import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import { generateResetToken, hashToken } from "../../utils/tokens.js";
import { sendMail } from "../../utils/email.js";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET, REFRESH_SECRET, ACCESS_EXPIRES, REFRESH_EXPIRES } from "../../config/jwt.js";

/**
 * Create owner user, shop and main branch in a transaction.
 * Returns { user, shop, branch, tokens }
 */
export async function createOwnerAccount({ first_name, last_name, email, password }) {
  // check existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // if existing user was google signup, instruct login with google
    if (existing.login_provider === "google") {
      const err = new Error("Email already registered via Google. Please login with Google.");
      err.code = "EMAIL_GOOGLE_EXISTS";
      throw err;
    }
    const err = new Error("Email already registered.");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  // hash password
  const password_hash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`,
      email,
      password_hash,
      login_provider: "password",
      role: "super_admin",
      status: "pending_setup",
      is_active: true,
    },
  });


  // issue tokens
  const accessToken = jwt.sign(
    { user_id: user.user_id,  role: user.role, status: user.status },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { user_id: user.user_id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );

  return {
    user,
    tokens: { accessToken, refreshToken },
  };
}


export async function requestPasswordReset(email) {
  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal if email exists (security best practice)
    // But still return success to prevent email enumeration
    return { success: true };
  }

  // Check if user uses Google login
  if (user.login_provider === "google" && !user.password_hash) {
    const err = new Error("This account uses Google login. Please sign in with Google.");
    err.code = "GOOGLE_ACCOUNT";
    throw err;
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const hashedToken = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Save hashed token to database
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      reset_token: hashedToken,
      reset_token_expires: expiresAt,
    },
  });

  // Create reset link
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Send email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #000060;">Reset Your Password</h2>
      <p>Hi ${user.first_name},</p>
      <p>You requested to reset your password for your Cureli account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #000060; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 8px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color: #000060;">${resetUrl}</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        <strong>This link will expire in 15 minutes.</strong>
      </p>
      <p style="color: #666; font-size: 14px;">
        If you didn't request this, please ignore this email. Your password will remain unchanged.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
      <p style="color: #999; font-size: 12px;">
        Cureli ERP - Pharmacy Management System
      </p>
    </div>
  `;

  await sendMail(user.email, "Reset Your Password - Cureli", html);

  return { success: true };
}


export async function resetPassword(token, newPassword) {
  // Hash the token to match database
  const hashedToken = hashToken(token);

  // Find user with valid token
  const user = await prisma.user.findFirst({
    where: {
      reset_token: hashedToken,
      reset_token_expires: {
        gt: new Date(), // Token not expired
      },
    },
  });

  if (!user) {
    const err = new Error("Invalid or expired reset token");
    err.code = "INVALID_TOKEN";
    throw err;
  }

  // Hash new password
  const password_hash = await hashPassword(newPassword);

  // Update password and clear reset token
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      password_hash,
      reset_token: null,
      reset_token_expires: null,
    },
  });

  return { success: true };
}