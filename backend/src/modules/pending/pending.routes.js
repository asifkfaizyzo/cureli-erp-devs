import express from "express";
import { validateBody } from "../../middleware/validate.js";
import { pendingSignupSchema,usernameSchema } from "./pending.schema.js";
import { startPendingSignup, requestEmailOtp, verifyEmailOtpController,chooseUsernameController } from "./pending.controller.js";

const router = express.Router();

router.post("/signup/start", validateBody(pendingSignupSchema), startPendingSignup);
router.post("/signup/email-otp", requestEmailOtp);
router.post("/signup/verify-email", verifyEmailOtpController);


router.post("/signup/username", validateBody(usernameSchema), chooseUsernameController);

export default router;
