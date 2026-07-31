// backend/src/modules/rider/auth/rider.auth.schema.js

import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
  device_id:        z.string().optional(),
  device_name:      z.string().optional(),
  device_platform:  z.string().optional(),
  device_os_version: z.string().optional(),
  app_version:      z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});