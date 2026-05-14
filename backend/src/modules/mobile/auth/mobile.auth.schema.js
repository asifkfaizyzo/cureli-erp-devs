// src/modules/mobile/auth/mobile.auth.schema.js

import { z } from "zod";

// ── Shared ────────────────────────────────────────────────────
//
// Indian mobile numbers:
//   - Must start with 6, 7, 8, or 9
//   - Exactly 10 digits after stripping country code
//   - Accept with or without +91 / 91 prefix
//   - Always normalized to +91XXXXXXXXXX before storage and SMS

const rawPhone = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ""))
  .refine(
    (val) => {
      // Strip +91 or 91 prefix if present
      const stripped = val.replace(/^\+?91/, "");
      return /^[6-9]\d{9}$/.test(stripped);
    },
    { message: "Invalid Indian mobile number" }
  )
  .transform((val) => {
    // Normalize to +91XXXXXXXXXX
    const stripped = val.replace(/^\+?91/, "");
    return `+91${stripped}`;
  });

const otpCode = z
  .string()
  .trim()
  .length(6, { message: "OTP must be exactly 6 digits" })
  .regex(/^\d{6}$/, { message: "OTP must contain only digits" });

// ── Device Info ───────────────────────────────────────────────
// Optional block sent by client on login.
// All fields are optional — we degrade gracefully if client omits them.

const deviceInfo = z
  .object({
    device_id: z.string().max(255).optional(),
    device_name: z.string().max(200).optional(),
    device_platform: z.enum(["ios", "android"]).optional(),
    device_os_version: z.string().max(50).optional(),
    app_version: z.string().max(20).optional(),
  })
  .optional();

// ── Schemas ───────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  phone: rawPhone,
});

export const verifyOtpSchema = z.object({
  phone: rawPhone,
  otp: otpCode,
  device_info: deviceInfo,
});

export const refreshSchema = z.object({
  refresh_token: z
    .string()
    .trim()
    .min(1, { message: "Refresh token required" }),
});