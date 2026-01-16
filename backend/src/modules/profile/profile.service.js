// src/modules/profile/profile.service.js

import prisma from "../../config/prisma.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { getMCAuthToken } from "../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../providers/messageCentral/validateOtp.js";
import crypto from "crypto";
import { hashSessionToken } from "../../utils/session.js";
import { notifyAsync, notify } from "../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";
import * as audit from "../audit/index.js";

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

  const usersUsed = await prisma.user.count({
    where: {
      shop_id: user.shop_id,
      is_active: true,
      role: { in: ["staff", "branch_admin"] },
    },
  });

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

export async function changeUserPassword(user_id, current_password, new_password, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: { 
      password_hash: true, 
      email: true, 
      full_name: true,
      role: true,
      shop_id: true,
      branch_id: true,
    },
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

  // ✅ AUDIT: Security action
  await audit.log({
    action: audit.AuditAction.USER_PASSWORD_CHANGED,
    entity_type: audit.EntityType.USER,
    entity_id: user_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: user_id,
    actor_role: user.role,
    shop_id: user.shop_id,
    branch_id: user.branch_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.SECURITY_ACTION,
    metadata: {
      method: 'self_change',
    },
  });

  if (user.email) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.PASSWORD_CHANGED,
      context: {
        email: user.email,
        name: user.full_name,
        changed_at: new Date().toLocaleString(),
      },
    });
  }

  return { success: true };
}

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

  await notify({
    type: NOTIFICATION_EVENTS.EMAIL_CHANGE_OTP,
    context: {
      email: new_email,
      name: user.full_name,
      otp,
      expires_in_minutes: 10,
    },
  });

  return { success: true, email: new_email };
}

export async function verifyEmailChangeService(user_id, otp, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      email: true,
      full_name: true,
      role: true,
      shop_id: true,
      branch_id: true,
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

  // ✅ AUDIT: Email changed
  await audit.log({
    action: audit.AuditAction.USER_EMAIL_CHANGED,
    entity_type: audit.EntityType.USER,
    entity_id: user_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: user_id,
    actor_role: user.role,
    shop_id: user.shop_id,
    branch_id: user.branch_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      previous_email: oldEmail,
      new_email: newEmail,
    },
  });

  if (oldEmail) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.EMAIL_CHANGED,
      context: {
        email: oldEmail,
        name: user.full_name,
        old_email: oldEmail,
        new_email: newEmail,
        notification_type: "old_email",
      },
    });
  }

  notifyAsync({
    type: NOTIFICATION_EVENTS.EMAIL_CHANGED,
    context: {
      email: newEmail,
      name: user.full_name,
      old_email: oldEmail,
      new_email: newEmail,
      notification_type: "new_email",
    },
  });

  return { success: true, new_email: newEmail };
}

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

  await prisma.user.update({
    where: { user_id },
    data: {
      phone_change_old_verified: true,
      phone_change_verification_id: null,
      phone_change_expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return { success: true };
}

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

  if (!user.phone_change_old_verified) {
    const err = new Error("Please verify your current phone first");
    err.code = "OLD_NOT_VERIFIED";
    throw err;
  }

  if (new Date() > new Date(user.phone_change_expires)) {
    await clearPhoneChangeState(user_id);
    const err = new Error("Session expired. Please start again.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (user.phone_number === new_phone) {
    const err = new Error("New phone is same as current phone");
    err.code = "SAME_PHONE";
    throw err;
  }

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

  const isValid = await comparePassword(current_password, user.password_hash);
  if (!isValid) {
    const err = new Error("Incorrect password");
    err.code = "INVALID_PASSWORD";
    throw err;
  }

  if (user.phone_number === new_phone) {
    const err = new Error("New phone is same as current phone");
    err.code = "SAME_PHONE";
    throw err;
  }

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
      phone_change_old_verified: true,
      phone_change_new_number: new_phone,
      phone_change_expires: new Date(Date.now() + timeout * 1000),
    },
  });

  return { success: true, timeout, phone: new_phone };
}

export async function verifyPhoneChangeNewService(user_id, otp, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      phone_number: true,
      full_name: true,
      email: true,
      role: true,
      shop_id: true,
      branch_id: true,
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

  await prisma.activityLog.create({
    data: {
      user_id,
      action: "phone_changed",
      description: `Phone changed from ${oldPhone} to ${newPhone}`,
    },
  });

  // ✅ AUDIT: Phone changed
  await audit.log({
    action: audit.AuditAction.USER_PHONE_CHANGED,
    entity_type: audit.EntityType.USER,
    entity_id: user_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: user_id,
    actor_role: user.role,
    shop_id: user.shop_id,
    branch_id: user.branch_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      previous_phone: oldPhone,
      new_phone: newPhone,
    },
  });

  if (user.email) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.PHONE_CHANGED,
      context: {
        email: user.email,
        name: user.full_name,
        old_phone: oldPhone,
        new_phone: newPhone,
      },
    });
  }

  return { success: true, new_phone: newPhone };
}

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