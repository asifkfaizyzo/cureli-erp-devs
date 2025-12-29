// src/modules/profile/profile.controller.js

import { success, fail } from "../../utils/response.js";
import {
  getProfileData,
  getUserSessions,
  updateBusinessInfo,
  changeUserPassword,
  logoutUserSession,
  logoutAllOtherSessions,
  initiateEmailChangeService,
  verifyEmailChangeService,
  initiatePhoneChangeOldService,
  initiatePhoneChangeNewService,
  verifyPhoneChangeNewService,
} from "./profile.service.js";

// ============================================
// GET PROFILE
// ============================================
export async function getProfile(req, res) {
  try {
    const profile = await getProfileData(req.user.user_id);
    const sessions = await getUserSessions(req.user.user_id, req.user.session_id);

    return success(res, {
      ...profile,
      sessions,
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return fail(res, err.message, err.code === "NOT_FOUND" ? 404 : 500);
  }
}

// ============================================
// UPDATE BUSINESS INFO
// ============================================
export async function updateBusiness(req, res) {
  try {
    await updateBusinessInfo(req.user.user_id, req.body);
    return success(res, { message: "Business information updated successfully" });
  } catch (err) {
    console.error("updateBusiness error:", err);
    return fail(res, err.message, err.code === "NO_SHOP" ? 404 : 500);
  }
}

// ============================================
// CHANGE PASSWORD
// ============================================
export async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    await changeUserPassword(req.user.user_id, current_password, new_password);
    return success(res, { message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    
    if (err.code === "INVALID_PASSWORD") {
      return fail(res, err.message, 400);
    }
    return fail(res, err.message, 500);
  }
}

// ============================================
// EMAIL CHANGE - INITIATE
// ============================================
export async function initiateEmailChange(req, res) {
  try {
    const { current_password, new_email } = req.body;
    const result = await initiateEmailChangeService(req.user.user_id, current_password, new_email);
    return success(res, { 
      message: "Verification code sent to new email",
      email: result.email,
    });
  } catch (err) {
    console.error("initiateEmailChange error:", err);
    
    if (["INVALID_PASSWORD", "SAME_EMAIL", "EMAIL_EXISTS"].includes(err.code)) {
      return fail(res, err.message, 400);
    }
    return fail(res, err.message, 500);
  }
}

// ============================================
// EMAIL CHANGE - VERIFY
// ============================================
export async function verifyEmailChange(req, res) {
  try {
    const { otp } = req.body;
    const result = await verifyEmailChangeService(req.user.user_id, otp);
    return success(res, { 
      message: "Email changed successfully",
      new_email: result.new_email,
    });
  } catch (err) {
    console.error("verifyEmailChange error:", err);
    
    if (["INVALID_OTP", "OTP_EXPIRED", "NO_CHANGE_REQUEST"].includes(err.code)) {
      return fail(res, err.message, 400);
    }
    return fail(res, err.message, 500);
  }
}

// ============================================
// PHONE CHANGE - STEP 1
// ============================================
export async function initiatePhoneChangeOld(req, res) {
  try {
    const result = await initiatePhoneChangeOldService(req.user.user_id);
    return success(res, { 
      message: "OTP sent to your current phone",
      timeout: result.timeout,
    });
  } catch (err) {
    console.error("initiatePhoneChangeOld error:", err);
    
    if (err.code === "OTP_COOLDOWN") {
      return fail(res, err.message, 429, { waitTime: err.waitTime });
    }
    if (err.code === "NO_PHONE") {
      return fail(res, err.message, 400);
    }
    return fail(res, err.message, 500);
  }
}

// ============================================
// PHONE CHANGE - STEP 2
// ============================================
export async function initiatePhoneChangeNew(req, res) {
  try {
    const { otp, new_phone } = req.body;
    const result = await initiatePhoneChangeNewService(req.user.user_id, otp, new_phone);
    return success(res, { 
      message: "OTP sent to your new phone",
      timeout: result.timeout,
      phone: result.phone,
    });
  } catch (err) {
    console.error("initiatePhoneChangeNew error:", err);
    
    if (["INVALID_OTP", "OTP_EXPIRED", "NO_OTP_REQUEST", "SAME_PHONE", "PHONE_EXISTS"].includes(err.code)) {
      return fail(res, err.message, 400);
    }
    return fail(res, err.message, 500);
  }
}

// ============================================
// PHONE CHANGE - STEP 3
// ============================================
export async function verifyPhoneChangeNew(req, res) {
  try {
    const { otp } = req.body;
    const result = await verifyPhoneChangeNewService(req.user.user_id, otp);
    return success(res, { 
      message: "Phone number changed successfully",
      new_phone: result.new_phone,
    });
  } catch (err) {
    console.error("verifyPhoneChangeNew error:", err);
    
    if (["INVALID_OTP", "OTP_EXPIRED", "INCOMPLETE_FLOW"].includes(err.code)) {
      return fail(res, err.message, 400);
    }
    return fail(res, err.message, 500);
  }
}

// ============================================
// GET SESSIONS
// ============================================
export async function getSessions(req, res) {
  try {
    const sessions = await getUserSessions(req.user.user_id, req.user.session_id);
    return success(res, { sessions });
  } catch (err) {
    console.error("getSessions error:", err);
    return fail(res, err.message, 500);
  }
}

// ============================================
// LOGOUT SESSION
// ============================================
export async function logoutSession(req, res) {
  try {
    const { sessionId } = req.params;
    await logoutUserSession(req.user.user_id, sessionId, req.user.session_id);
    return success(res, { message: "Session logged out successfully" });
  } catch (err) {
    console.error("logoutSession error:", err);
    
    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "CANNOT_LOGOUT_CURRENT") {
      return fail(res, err.message, 400);
    }
    return fail(res, err.message, 500);
  }
}

// ============================================
// LOGOUT OTHER SESSIONS
// ============================================
export async function logoutOtherSessions(req, res) {
  try {
    const result = await logoutAllOtherSessions(req.user.user_id, req.user.session_id);
    return success(res, { 
      message: `Logged out ${result.count} other sessions`,
      count: result.count,
    });
  } catch (err) {
    console.error("logoutOtherSessions error:", err);
    return fail(res, err.message, 500);
  }
}