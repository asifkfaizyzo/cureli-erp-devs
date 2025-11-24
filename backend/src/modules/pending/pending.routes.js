import express from "express";
import { validateBody } from "../../middleware/validate.js";
import {
  pendingSignupSchema,
  usernameSchema
} from "./pending.schema.js";

import {
  startPendingSignup,
  requestEmailOtp,
  verifyEmailOtpController,
  requestSmsOtp,
  verifySmsOtpController,
  chooseUsernameController,
  completePendingSignupController,
  googleSetPasswordController,
  googleSignupController
} from "./pending.controller.js";

const router = express.Router();

router.post("/signup/start", validateBody(pendingSignupSchema), startPendingSignup);
router.post("/signup/google", googleSignupController);
router.post("/signup/google/set-password", googleSetPasswordController);

// Email OTP endpoints (existing)
router.post("/signup/email-otp", requestEmailOtp);
router.post("/signup/verify-email", verifyEmailOtpController);

// SMS OTP endpoints (new)
router.post("/signup/sms-otp", requestSmsOtp);
router.post("/signup/verify-sms", verifySmsOtpController);

// Username selection — now requires BOTH email && phone verified
router.post("/signup/username", validateBody(usernameSchema), chooseUsernameController);
router.post("/signup/complete", completePendingSignupController);

export default router;
