// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\auth\auth.routes.js

import express from "express";
import { validateBody } from "../../middleware/validate.js";
import {
  loginController,
  verifyLoginOtpController,
  refreshTokenController,
  logoutController,
  completeOnboardingController,
  getOnboardingStatusController,
  updateOnboardingStepController,
} from "./login.controller.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyLoginOtpSchema,
} from "./auth.schema.js";
import { forgotPasswordController, resetPasswordController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Login flow
router.post("/login", validateBody(loginSchema), loginController);
router.post("/verify-login-otp", validateBody(verifyLoginOtpSchema), verifyLoginOtpController);
router.post("/refresh", refreshTokenController);

// Password reset
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPasswordController);

// ============================================
// PROTECTED ROUTES
// ============================================

// Logout
router.post("/logout", requireAuth, logoutController);

// Onboarding
router.get("/onboarding-status", requireAuth, getOnboardingStatusController);
router.post("/onboarding-step", requireAuth, updateOnboardingStepController);
router.post("/complete-onboarding", requireAuth, completeOnboardingController);

export default router;