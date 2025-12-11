//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\auth\auth.routes.js
import express from "express";
import { validateBody } from "../../middleware/validate.js";
import { loginController, completeOnboardingController, verifyLoginOtpController,getOnboardingStatusController,updateOnboardingStepController} from "./login.controller.js";
import { loginSchema,forgotPasswordSchema,resetPasswordSchema, verifyLoginOtpSchema } from "./auth.schema.js";
import { refreshTokenController,forgotPasswordController,resetPasswordController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";
const router = express.Router();


router.post("/login", validateBody(loginSchema), loginController);
router.post("/refresh", refreshTokenController);
router.post("/complete-onboarding", requireAuth, completeOnboardingController);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPasswordController);
router.post("/verify-login-otp", validateBody(verifyLoginOtpSchema), verifyLoginOtpController);

router.get("/onboarding-status", requireAuth, getOnboardingStatusController);
router.post("/onboarding-step", requireAuth, updateOnboardingStepController);  
export default router;
