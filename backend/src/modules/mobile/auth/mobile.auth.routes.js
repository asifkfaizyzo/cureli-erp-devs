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

// ── Public routes ─────────────────────────────────────────────
// No mobileAuthLimiter here.
// send-otp is protected by the DB-backed OtpDailyLimit (20/day/phone).
// verify-otp is protected by service-level attempt counting (5 attempts,
// then 3 cycles locks account for 1 hour).
// Both are still covered by the global mobileLimiter from index.js.

router.post(
  "/send-otp",
  validate(sendOtpSchema),
  handleSendOtp
);

router.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  handleVerifyOtp
);

router.post(
  "/refresh",
  validate(refreshSchema),
  handleRefresh
);

// ── Protected routes ──────────────────────────────────────────
router.post("/logout", mobileAuth, handleLogout);
router.post("/logout-all", mobileAuth, handleLogoutAll);
router.get("/me", mobileAuth, handleMe);

export default router;