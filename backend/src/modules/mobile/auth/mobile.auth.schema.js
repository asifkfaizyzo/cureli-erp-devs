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
// Exception: when REVIEW_MODE=true the review phone passes through
// as-is without normalization so the service can match it exactly.

const rawPhone = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ""))
  .refine(
    (val) => {
      // Let the review number through when review mode is active
      if (IS_REVIEW_MODE && val === REVIEW_PHONE) return true;

      const stripped = val.replace(/^\+?91/, "");
      return /^[6-9]\d{9}$/.test(stripped);
    },
    { message: "Invalid Indian mobile number" }
  )
  .transform((val) => {
    // Do NOT normalize the review number — service compares it as-is
    if (IS_REVIEW_MODE && val === REVIEW_PHONE) return val;

    const stripped = val.replace(/^\+?91/, "");
    return `+91${stripped}`;
  });

const otpCode = z
  .string()
  .trim()
  .length(6, { message: "OTP must be exactly 6 digits" })
  .regex(/^\d{6}$/, { message: "OTP must contain only digits" });

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