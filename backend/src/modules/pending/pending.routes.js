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
  chooseUsernameController
} from "./pending.controller.js";

const router = express.Router();

router.post("/signup/start", validateBody(pendingSignupSchema), startPendingSignup);

// Email OTP endpoints (existing)
router.post("/signup/email-otp", requestEmailOtp);
router.post("/signup/verify-email", verifyEmailOtpController);

// SMS OTP endpoints (new)
router.post("/signup/sms-otp", requestSmsOtp);
router.post("/signup/verify-sms", verifySmsOtpController);

// Username selection — now requires BOTH email && phone verified
router.post("/signup/username", validateBody(usernameSchema), chooseUsernameController);

export default router;
