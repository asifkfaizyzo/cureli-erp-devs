// src/modules/mobile/auth/mobile.auth.schema.js

import { z } from "zod";
import { IS_REVIEW_MODE, REVIEW_PHONE } from "../../../config/reviewCredentials.js";

// ── Shared ────────────────────────────────────────────────────
//
// Indian mobile numbers:
//   - Must start with 6, 7, 8, or 9
//   - Exactly 10 digits after stripping country code
//   - Accept with or without +91 / 91 prefix
//   - Always normalized to +91XXXXXXXXXX before storage and SMS
//
// Exception: when IS_REVIEW_MODE is true, the reviewer phone '1234567890' 
// bypasses the starting digit constraints and is normalized to +911234567890.

const rawPhone = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ""))
  .refine(
    (val) => {
      const stripped = val.replace(/^\+?91/, "");
      
      // Allow review number ONLY if backend review mode is globally active
      if (IS_REVIEW_MODE && stripped === REVIEW_PHONE) {
        return true;
      }

      return /^[6-9]\d{9}$/.test(stripped);
    },
    { message: "Invalid Indian mobile number" }
  )
  .transform((val) => {
    const stripped = val.replace(/^\+?91/, "");
    return `+91${stripped}`;
  });

const otpCode = z
  .string()
  .trim()
  .length(6, { message: "OTP must be exactly 6 digits" })
  .regex(/^\d{6}$/, { message: "OTP must contain only digits" });

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(128, { message: "Password must not exceed 128 characters" });

// ── Device Info ───────────────────────────────────────────────

const deviceInfo = z
  .object({
    device_id:         z.string().max(255).optional(),
    device_name:       z.string().max(200).optional(),
    device_platform:   z.enum(["ios", "android"]).optional(),
    device_os_version: z.string().max(50).optional(),
    app_version:       z.string().max(20).optional(),
  })
  .optional();

// ── Schemas ───────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  phone: rawPhone,
});

export const verifyOtpSchema = z.object({
  phone:       rawPhone,
  otp:         otpCode,
  device_info: deviceInfo,
});

export const refreshSchema = z.object({
  refresh_token: z
    .string()
    .trim()
    .min(1, { message: "Refresh token required" }),
});

// ── Password Auth Schemas ─────────────────────────────────────

export const registerSchema = z.object({
  phone:       rawPhone,
  password:    passwordSchema,
  email:       z.string().trim().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  full_name:   z.string().trim().min(1, { message: "Name is required" }).optional(),
  device_info: deviceInfo,
});

export const registerVerifySchema = z.object({
  phone:       rawPhone,
  password:    passwordSchema,
  otp:         otpCode,
  email:       z.string().trim().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  full_name:   z.string().trim().min(1, { message: "Name is required" }).optional(),
  device_info: deviceInfo,
});

export const loginSchema = z.object({
  identifier:  z.string().trim().min(1, { message: "Phone or email is required" }),
  password:    z.string().min(1, { message: "Password is required" }),
  device_info: deviceInfo,
});

export const sendResetOtpSchema = z.object({
  phone: rawPhone,
});

export const resetPasswordSchema = z.object({
  phone:        rawPhone,
  otp:          otpCode,
  new_password: passwordSchema,
});

export const checkPhoneSchema = z.object({
  phone: rawPhone,
});