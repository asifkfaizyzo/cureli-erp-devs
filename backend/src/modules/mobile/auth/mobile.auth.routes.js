// src/modules/mobile/auth/mobile.auth.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import { mobileAuthLimiter } from "../../../middleware/rateLimiter.js";
import { validate } from "../../../middleware/validate.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshSchema,
} from "./mobile.auth.schema.js";
import {
  handleSendOtp,
  handleVerifyOtp,
  handleRefresh,
  handleLogout,
  handleLogoutAll,
  handleMe,
} from "./mobile.auth.controller.js";

const router = Router();

// ── Public routes (no auth required) ─────────────────────────
// Both OTP endpoints share the stricter mobileAuthLimiter.
// 10 requests per 15 min per IP — covers send + verify combined.

router.post(
  "/auth/send-otp",
  mobileAuthLimiter,
  validate(sendOtpSchema),
  handleSendOtp
);

router.post(
  "/auth/verify-otp",
  mobileAuthLimiter,
  validate(verifyOtpSchema),
  handleVerifyOtp
);

router.post(
  "/auth/refresh",
  mobileAuthLimiter,
  validate(refreshSchema),
  handleRefresh
);

// ── Protected routes (access token required) ──────────────────
router.post("/auth/logout", mobileAuth, handleLogout);
router.post("/auth/logout-all", mobileAuth, handleLogoutAll);
router.get("/auth/me", mobileAuth, handleMe);

export default router;