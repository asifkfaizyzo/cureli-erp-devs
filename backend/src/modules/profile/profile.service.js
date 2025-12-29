// src/modules/profile/profile.service.js

import prisma from "../../config/prisma.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { sendMail } from "../../utils/email.js";
import { getMCAuthToken } from "../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../providers/messageCentral/validateOtp.js";
import crypto from "crypto";
import { hashSessionToken } from "../../utils/session.js";

// ============================================
// GET PROFILE
// ============================================
export async function getProfileData(user_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      full_name: true,
      username: true,
      email: true,
      phone_number: true,
      login_provider: true,
      role: true,
      status: true,
      last_login_at: true,
      created_at: true,
      shop_id: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.shop_id) {
    const err = new Error("Shop not found for user");
    err.code = "NO_SHOP";
    throw err;
  }

  // Get shop details
  const shop = await prisma.shop.findUnique({
    where: { shop_id: user.shop_id },
    select: {
      shop_id: true,
      business_name: true,
      legal_name: true,
      gst_number: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      current_subscription_id: true,
      _count: {
        select: {
          branches: true,
        },
      },
    },
  });

  // Correct user count
  const usersUsed = await prisma.user.count({
    where: {
      shop_id: user.shop_id,
      is_active: true,
      role: { in: ["staff", "branch_admin"] },
    },
  });

  // Get subscription details
  let subscription = null;

  if (shop.current_subscription_id) {
    const sub = await prisma.shopSubscription.findUnique({
      where: { subscription_id: shop.current_subscription_id },
      select: {
        subscription_id: true,
        status: true,
        billing_cycle: true,
        start_date: true,
        end_date: true,
        branch_limit_snapshot: true,
        user_limit_snapshot: true,
        plan: {
          select: {
            plan_id: true,
            name: true,
          },
        },
      },
    });

    if (sub) {
      const now = new Date();
      const endDate = new Date(sub.end_date);
      const daysRemaining = Math.max(
        0,
        Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
      );

      subscription = {
        subscription_id: sub.subscription_id,
        plan_id: sub.plan.plan_id,
        plan_name: sub.plan.name,
        status: sub.status,
        billing_cycle: sub.billing_cycle,
        start_date: sub.start_date,
        end_date: sub.end_date,
        days_remaining: daysRemaining,
        branch_limit: sub.branch_limit_snapshot,
        user_limit: sub.user_limit_snapshot,
        branches_used: shop._count.branches,
        users_used: usersUsed,
      };
    }
  }

  return {
    user: {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      login_provider: user.login_provider,
      role: user.role,
      status: user.status,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
    },
    shop: {
      shop_id: shop.shop_id,
      business_name: shop.business_name,
      legal_name: shop.legal_name,
      gst_number: shop.gst_number,
      address_line_1: shop.address_line_1,
      address_line_2: shop.address_line_2,
      city: shop.city,
      state: shop.state,
      pincode: shop.pincode,
    },
    subscription,
  };
}

// ============================================
// GET SESSIONS
// ============================================
export async function getUserSessions(user_id, currentSessionToken) {
  const sessions = await prisma.userSession.findMany({
    where: {
      user_id,
      is_active: true,
      expires_at: { gt: new Date() },
    },
    orderBy: { last_active_at: "desc" },
    take: 10,
    select: {
      id: true,
      session_token: true,
      device_info: true,
      ip_address: true,
      created_at: true,
      last_active_at: true,
    },
  });

  const currentHashedToken = currentSessionToken ? hashSessionToken(currentSessionToken) : null;

  return sessions.map((session) => ({
    id: session.id,
    device_info: session.device_info,
    ip_address: session.ip_address,
    created_at: session.created_at,
    last_active_at: session.last_active_at,
    is_current: currentHashedToken === session.session_token,
  }));
}

// ============================================
// UPDATE BUSINESS INFO
// ============================================
export async function updateBusinessInfo(user_id, data) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: { shop_id: true },
  });

  if (!user || !user.shop_id) {
    const err = new Error("Shop not found");
    err.code = "NO_SHOP";
    throw err;
  }

  await prisma.shop.update({
    where: { shop_id: user.shop_id },
    data: {
      business_name: data.business_name,
      address_line_1: data.address_line_1,
      address_line_2: data.address_line_2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      updated_at: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      user_id,
      action: "business_info_updated",
      description: "Updated business information",
    },
  });

  return { success: true };
}

// ============================================
// CHANGE PASSWORD
// ============================================
export async function changeUserPassword(user_id, current_password, new_password) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: { password_hash: true, email: true, full_name: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.password_hash) {
    const err = new Error("No password set for this account");
    err.code = "NO_PASSWORD";
    throw err;
  }

  const isValid = await comparePassword(current_password, user.password_hash);
  if (!isValid) {
    const err = new Error("Current password is incorrect");
    err.code = "INVALID_PASSWORD";
    throw err;
  }

  const newHash = await hashPassword(new_password);

  await prisma.user.update({
    where: { user_id },
    data: {
      password_hash: newHash,
      updated_at: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      user_id,
      action: "password_changed",
      description: "Password changed successfully",
    },
  });

  if (user.email) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000060;">Password Changed</h2>
        <p>Hi ${user.full_name},</p>
        <p>Your password was successfully changed on ${new Date().toLocaleString()}.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
        <p style="color: #999; font-size: 12px;">Cureli ERP - Pharmacy Management System</p>
      </div>
    `;
    await sendMail(user.email, "Password Changed - Cureli", html).catch(console.error);
  }

  return { success: true };
}

// ============================================
// LOGOUT SESSION
// ============================================
export async function logoutUserSession(user_id, session_id, currentSessionToken) {
  const session = await prisma.userSession.findUnique({
    where: { id: session_id },
    select: { user_id: true, session_token: true, is_active: true },
  });

  if (!session) {
    const err = new Error("Session not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (session.user_id !== user_id) {
    const err = new Error("Unauthorized");
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const currentHashedToken = currentSessionToken ? hashSessionToken(currentSessionToken) : null;
  if (currentHashedToken === session.session_token) {
    const err = new Error("Cannot logout current session. Use logout instead.");
    err.code = "CANNOT_LOGOUT_CURRENT";
    throw err;
  }

  await prisma.userSession.update({
    where: { id: session_id },
    data: {
      is_active: false,
      ended_at: new Date(),
      ended_reason: "manual_logout",
    },
  });

  return { success: true };
}

// ============================================
// LOGOUT OTHER SESSIONS
// ============================================
export async function logoutAllOtherSessions(user_id, currentSessionToken) {
  const currentHashedToken = currentSessionToken ? hashSessionToken(currentSessionToken) : null;

  const result = await prisma.userSession.updateMany({
    where: {
      user_id,
      is_active: true,
      session_token: { not: currentHashedToken },
    },
    data: {
      is_active: false,
      ended_at: new Date(),
      ended_reason: "logout_all_others",
    },
  });

  await prisma.activityLog.create({
    data: {
      user_id,
      action: "logout_all_sessions",
      description: `Logged out ${result.count} other sessions`,
    },
  });

  return { success: true, count: result.count };
}

// ============================================
// EMAIL CHANGE - INITIATE
// ============================================
export async function initiateEmailChangeService(user_id, current_password, new_email) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: { password_hash: true, email: true, full_name: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const isValid = await comparePassword(current_password, user.password_hash);
  if (!isValid) {
    const err = new Error("Incorrect password");
    err.code = "INVALID_PASSWORD";
    throw err;
  }

  if (user.email?.toLowerCase() === new_email.toLowerCase()) {
    const err = new Error("New email is same as current email");
    err.code = "SAME_EMAIL";
    throw err;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: new_email },
  });

  if (existingUser) {
    const err = new Error("Email already in use");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { user_id },
    data: {
      email_change_new_email: new_email,
      email_change_otp_hash: otpHash,
      email_change_expires: expiresAt,
    },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #000060;">Verify Your New Email</h2>
      <p>Hi ${user.full_name},</p>
      <p>You requested to change your email address to this one.</p>
      <p>Your verification code is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000060;">${otp}</span>
      </div>
      <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
      <p style="color: #999; font-size: 12px;">Cureli ERP - Pharmacy Management System</p>
    </div>
  `;

  await sendMail(new_email, "Verify Your New Email - Cureli", html);

  return { success: true, email: new_email };
}

// ============================================
// EMAIL CHANGE - VERIFY
// ============================================
export async function verifyEmailChangeService(user_id, otp) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      email: true,
      full_name: true,
      email_change_new_email: true,
      email_change_otp_hash: true,
      email_change_expires: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.email_change_new_email || !user.email_change_otp_hash) {
    const err = new Error("No email change request found");
    err.code = "NO_CHANGE_REQUEST";
    throw err;
  }

  if (new Date() > new Date(user.email_change_expires)) {
    await prisma.user.update({
      where: { user_id },
      data: {
        email_change_new_email: null,
        email_change_otp_hash: null,
        email_change_expires: null,
      },
    });

    const err = new Error("OTP expired. Please start again.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  if (otpHash !== user.email_change_otp_hash) {
    const err = new Error("Invalid OTP");
    err.code = "INVALID_OTP";
    throw err;
  }

  const oldEmail = user.email;
  const newEmail = user.email_change_new_email;

  await prisma.user.update({
    where: { user_id },
    data: {
      email: newEmail,
      email_change_new_email: null,
      email_change_otp_hash: null,
      email_change_expires: null,
      updated_at: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      user_id,
      action: "email_changed",
      description: `Email changed from ${oldEmail} to ${newEmail}`,
    },
  });

  if (oldEmail) {
    const htmlOld = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000060;">Email Address Changed</h2>
        <p>Hi ${user.full_name},</p>
        <p>Your email address has been changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
        <p style="color: #999; font-size: 12px;">Cureli ERP - Pharmacy Management System</p>
      </div>
    `;
    await sendMail(oldEmail, "Email Address Changed - Cureli", htmlOld).catch(console.error);
  }

  const htmlNew = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #000060;">Email Verified Successfully</h2>
      <p>Hi ${user.full_name},</p>
      <p>Your email has been successfully changed to this address.</p>
      <p>You will now receive all communications at this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
      <p style="color: #999; font-size: 12px;">Cureli ERP - Pharmacy Management System</p>
    </div>
  `;
  await sendMail(newEmail, "Welcome to Cureli", htmlNew).catch(console.error);

  return { success: true, new_email: newEmail };
}

// ============================================
// PHONE CHANGE - OTP METHOD - STEP 1: SEND OTP TO OLD
// ============================================
export async function initiatePhoneChangeOldService(user_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: { phone_number: true, phone_change_expires: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.phone_number) {
    const err = new Error("No phone number registered");
    err.code = "NO_PHONE";
    throw err;
  }

  // Check cooldown
  if (user.phone_change_expires && new Date() < new Date(user.phone_change_expires)) {
    const secondsRemaining = Math.ceil((new Date(user.phone_change_expires) - new Date()) / 1000);
    if (secondsRemaining > 240) {
      const err = new Error("Please wait before requesting a new OTP");
      err.code = "OTP_COOLDOWN";
      err.waitTime = 300 - secondsRemaining;
      throw err;
    }
  }

  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  const data = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: user.phone_number,
    otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
    countryCode: process.env.MC_COUNTRY || "91",
  });

  const verificationId = data?.verificationId || data?.verificationID || data?.verification_id;
  const timeout = Number(data?.timeout || data?.time || 300);

  await prisma.user.update({
    where: { user_id },
    data: {
      phone_change_verification_id: verificationId,
      phone_change_old_verified: false,
      phone_change_new_number: null,
      phone_change_expires: new Date(Date.now() + timeout * 1000),
    },
  });

  return { success: true, timeout };
}

// ============================================
// PHONE CHANGE - OTP METHOD - STEP 1b: VERIFY OLD OTP
// ============================================
export async function verifyPhoneChangeOldOtpService(user_id, otp) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      phone_number: true,
      phone_change_verification_id: true,
      phone_change_old_verified: true,
      phone_change_expires: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.phone_change_verification_id) {
    const err = new Error("Please request OTP first");
    err.code = "NO_OTP_REQUEST";
    throw err;
  }

  if (new Date() > new Date(user.phone_change_expires)) {
    await clearPhoneChangeState(user_id);
    const err = new Error("OTP expired. Please start again.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  const result = await mcValidateOtp({
    authToken,
    verificationId: user.phone_change_verification_id,
    code: otp,
    mobileNumber: user.phone_number,
  });

  if (result?.verificationStatus !== "VERIFICATION_COMPLETED") {
    const respCode = Number(result?.responseCode || result?.response_code || 0);

    if (respCode === 702) {
      const err = new Error("Invalid OTP");
      err.code = "INVALID_OTP";
      throw err;
    }
    if (respCode === 705) {
      await clearPhoneChangeState(user_id);
      const err = new Error("OTP expired");
      err.code = "OTP_EXPIRED";
      throw err;
    }

    const err = new Error("OTP verification failed");
    err.code = "VERIFICATION_FAILED";
    throw err;
  }

  // Mark old phone as verified
  await prisma.user.update({
    where: { user_id },
    data: {
      phone_change_old_verified: true,
      phone_change_verification_id: null, // Clear old verification ID
      phone_change_expires: new Date(Date.now() + 10 * 60 * 1000), // 10 min to enter new phone
    },
  });

  return { success: true };
}

// ============================================
// PHONE CHANGE - OTP METHOD - STEP 2: SEND OTP TO NEW
// ============================================
export async function initiatePhoneChangeNewService(user_id, new_phone) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      phone_number: true,
      phone_change_old_verified: true,
      phone_change_expires: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Check if old phone was verified
  if (!user.phone_change_old_verified) {
    const err = new Error("Please verify your current phone first");
    err.code = "OLD_NOT_VERIFIED";
    throw err;
  }

  // Check if verification window expired
  if (new Date() > new Date(user.phone_change_expires)) {
    await clearPhoneChangeState(user_id);
    const err = new Error("Session expired. Please start again.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // Check if new phone is same as current
  if (user.phone_number === new_phone) {
    const err = new Error("New phone is same as current phone");
    err.code = "SAME_PHONE";
    throw err;
  }

  // Check if new phone already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      phone_number: new_phone,
      user_id: { not: user_id },
    },
  });

  if (existingUser) {
    const err = new Error("Phone number already in use");
    err.code = "PHONE_EXISTS";
    throw err;
  }

  // Send OTP to new phone
  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  const data = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: new_phone,
    otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
    countryCode: process.env.MC_COUNTRY || "91",
  });

  const verificationId = data?.verificationId || data?.verificationID || data?.verification_id;
  const timeout = Number(data?.timeout || data?.time || 300);

  await prisma.user.update({
    where: { user_id },
    data: {
      phone_change_verification_id: verificationId,
      phone_change_new_number: new_phone,
      phone_change_expires: new Date(Date.now() + timeout * 1000),
    },
  });

  return { success: true, timeout, phone: new_phone };
}

// ============================================
// PHONE CHANGE - PASSWORD METHOD: VERIFY PASSWORD & SEND OTP TO NEW
// ============================================
export async function initiatePhoneChangeWithPasswordService(user_id, current_password, new_phone) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      password_hash: true,
      phone_number: true,
      phone_change_expires: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Verify password
  const isValid = await comparePassword(current_password, user.password_hash);
  if (!isValid) {
    const err = new Error("Incorrect password");
    err.code = "INVALID_PASSWORD";
    throw err;
  }

  // Check if new phone is same as current
  if (user.phone_number === new_phone) {
    const err = new Error("New phone is same as current phone");
    err.code = "SAME_PHONE";
    throw err;
  }

  // Check if new phone already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      phone_number: new_phone,
      user_id: { not: user_id },
    },
  });

  if (existingUser) {
    const err = new Error("Phone number already in use");
    err.code = "PHONE_EXISTS";
    throw err;
  }

  // Check cooldown
  if (user.phone_change_expires && new Date() < new Date(user.phone_change_expires)) {
    const secondsRemaining = Math.ceil((new Date(user.phone_change_expires) - new Date()) / 1000);
    if (secondsRemaining > 240) {
      const err = new Error("Please wait before requesting a new OTP");
      err.code = "OTP_COOLDOWN";
      err.waitTime = 300 - secondsRemaining;
      throw err;
    }
  }

  // Send OTP to new phone
  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  const data = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: new_phone,
    otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
    countryCode: process.env.MC_COUNTRY || "91",
  });

  const verificationId = data?.verificationId || data?.verificationID || data?.verification_id;
  const timeout = Number(data?.timeout || data?.time || 300);

  // Save state - mark old as verified since password was used
  await prisma.user.update({
    where: { user_id },
    data: {
      phone_change_verification_id: verificationId,
      phone_change_old_verified: true, // Password verification counts
      phone_change_new_number: new_phone,
      phone_change_expires: new Date(Date.now() + timeout * 1000),
    },
  });

  return { success: true, timeout, phone: new_phone };
}

// ============================================
// PHONE CHANGE - STEP 3: VERIFY NEW PHONE OTP
// ============================================
export async function verifyPhoneChangeNewService(user_id, otp) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      phone_number: true,
      full_name: true,
      email: true,
      phone_change_verification_id: true,
      phone_change_old_verified: true,
      phone_change_new_number: true,
      phone_change_expires: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.phone_change_old_verified || !user.phone_change_new_number) {
    const err = new Error("Please complete previous steps first");
    err.code = "INCOMPLETE_FLOW";
    throw err;
  }

  if (new Date() > new Date(user.phone_change_expires)) {
    await clearPhoneChangeState(user_id);
    const err = new Error("OTP expired. Please start again.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD
  );

  const result = await mcValidateOtp({
    authToken,
    verificationId: user.phone_change_verification_id,
    code: otp,
    mobileNumber: user.phone_change_new_number,
  });

  if (result?.verificationStatus !== "VERIFICATION_COMPLETED") {
    const respCode = Number(result?.responseCode || result?.response_code || 0);

    if (respCode === 702) {
      const err = new Error("Invalid OTP");
      err.code = "INVALID_OTP";
      throw err;
    }
    if (respCode === 705) {
      await clearPhoneChangeState(user_id);
      const err = new Error("OTP expired");
      err.code = "OTP_EXPIRED";
      throw err;
    }

    const err = new Error("OTP verification failed");
    err.code = "VERIFICATION_FAILED";
    throw err;
  }

  const oldPhone = user.phone_number;
  const newPhone = user.phone_change_new_number;

  // Update phone number and clear change state
  await prisma.user.update({
    where: { user_id },
    data: {
      phone_number: newPhone,
      phone_change_verification_id: null,
      phone_change_old_verified: false,
      phone_change_new_number: null,
      phone_change_expires: null,
      updated_at: new Date(),
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      user_id,
      action: "phone_changed",
      description: `Phone changed from ${oldPhone} to ${newPhone}`,
    },
  });

  // Send email notification if email exists
  if (user.email) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000060;">Phone Number Changed</h2>
        <p>Hi ${user.full_name},</p>
        <p>Your phone number has been changed from <strong>${oldPhone}</strong> to <strong>${newPhone}</strong>.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
        <p style="color: #999; font-size: 12px;">Cureli ERP - Pharmacy Management System</p>
      </div>
    `;
    await sendMail(user.email, "Phone Number Changed - Cureli", html).catch(console.error);
  }

  return { success: true, new_phone: newPhone };
}

// ============================================
// HELPER: Clear phone change state
// ============================================
async function clearPhoneChangeState(user_id) {
  await prisma.user.update({
    where: { user_id },
    data: {
      phone_change_verification_id: null,
      phone_change_old_verified: false,
      phone_change_new_number: null,
      phone_change_expires: null,
    },
  });
}