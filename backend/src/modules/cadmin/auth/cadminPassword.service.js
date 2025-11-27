import prisma from "../../../config/prisma.js";
import { generateResetToken, hashToken } from "../../../utils/resetToken.js";
import { hashPassword } from "../../../utils/hash.js";
import { sendMail } from "../../../utils/email.js";

export async function requestCAdminPasswordReset(email) {
  // Find admin by email
  const admin = await prisma.cAdmin.findUnique({ where: { email } });

  if (!admin) {
    // avoid email enumeration
    return { success: true };
  }

  // Always password login, no provider checks needed

  // Generate token
  const resetToken = generateResetToken();
  const hashedToken = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.cAdmin.update({
    where: { cadmin_id: admin.cadmin_id },
    data: {
      reset_token: hashedToken,
      reset_token_expires: expiresAt,
    },
  });

  const resetUrl = `${process.env.ADMIN_FRONTEND_ORIGIN}/admin-reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: 'Arial', sans-serif; background:#f4f6fb; padding:40px 0;">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; padding:30px 35px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="text-align:center; margin-bottom:25px;">
      <img src="https://i.imgur.com/GyV5IrU.png" alt="Cureli Logo" style="width:100px; margin-bottom:10px;" />
      <h2 style="color:#000060; margin:0; font-size:24px; font-weight:700;">
        Cureli Admin Panel
      </h2>
      <p style="color:#555; font-size:14px; margin-top:5px;">
        Secure Access Management
      </p>
    </div>

    <!-- Title -->
    <h3 style="color:#000060; font-size:22px; margin-bottom:10px;">
      Reset Your Password
    </h3>

    <!-- Body -->
    <p style="font-size:15px; color:#333; line-height:1.6;">
      Hello <strong>${admin.cadmin_id}</strong>,
    </p>

    <p style="font-size:15px; color:#333; line-height:1.6;">
      We received a request to reset your password for your Cureli Admin account.
      If this was you, use the button below to choose a new password.
    </p>

    <!-- Button -->
    <div style="text-align:center; margin:30px 0;">
      <a href="${resetUrl}"
        style="
          background:#000060;
          color:white;
          padding:14px 28px;
          border-radius:8px;
          text-decoration:none;
          font-weight:bold;
          display:inline-block;
          font-size:16px;
        ">
        Reset Password
      </a>
    </div>

    <!-- Fallback link -->
    <p style="font-size:14px; color:#666; line-height:1.6;">
      If the button doesn’t work, copy and paste the following link into your browser:
    </p>

    <p style="word-break:break-all; font-size:14px; color:#000060;">
      <a href="${resetUrl}" style="color:#000060; text-decoration:none;">${resetUrl}</a>
    </p>

    <!-- Expiry -->
    <p style="font-size:13px; color:#666; margin-top:25px;">
      <strong>This link will expire in 15 minutes.</strong>
    </p>

    <!-- Footer Separator -->
    <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />

    <!-- Footer -->
    <p style="color:#999; font-size:12px; text-align:center; line-height:1.5;">
      This email was sent from the Cureli Admin Panel.<br/>
      If you did not request this password reset, you can safely ignore this email.
    </p>

  </div>
</div>

  `;

  await sendMail(admin.email, "Reset Your Cureli Admin Password", html);

  return { success: true };
}

export async function resetCAdminPassword(token, newPassword) {
  const hashed = hashToken(token);

  const admin = await prisma.cAdmin.findFirst({
    where: {
      reset_token: hashed,
      reset_token_expires: { gt: new Date() },
    },
  });

  if (!admin) {
    const err = new Error("Invalid or expired reset token");
    err.code = "INVALID_TOKEN";
    throw err;
  }

  const newHash = await hashPassword(newPassword);

  await prisma.cAdmin.update({
    where: { cadmin_id: admin.cadmin_id },
    data: {
      password_hash: newHash,
      reset_token: null,
      reset_token_expires: null,
    },
  });

  return { success: true };
}
