//backend\src\modules\auth\auth.routes.js
import express from "express";
import { validateBody } from "../../middleware/validate.js";
import {
  loginController,
  verifyLoginOtpController,
  refreshTokenController,
  logoutController,
  completeOnboardingController,
  getOnboardingStatusController,
  resendLoginOtpController,
  updateOnboardingStepController,
} from "./login.controller.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyLoginOtpSchema,
  resendLoginOtpSchema,
} from "./auth.schema.js";
import { forgotPasswordController, resetPasswordController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { getUserPermissionsHandler } from "../../middleware/rbac.js";

const router = express.Router();

router.post("/login", validateBody(loginSchema), loginController);
router.post("/verify-login-otp", validateBody(verifyLoginOtpSchema), verifyLoginOtpController);
router.post("/resend-login-otp", validateBody(resendLoginOtpSchema), resendLoginOtpController);
router.post("/refresh", refreshTokenController);

router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPasswordController);

router.post("/logout", requireAuth, logoutController);

router.get("/onboarding-status", requireAuth, getOnboardingStatusController);
router.post("/onboarding-step", requireAuth, updateOnboardingStepController);
router.post("/complete-onboarding", requireAuth, completeOnboardingController);

router.get("/permissions", requireAuth, getUserPermissionsHandler);

export default router;
