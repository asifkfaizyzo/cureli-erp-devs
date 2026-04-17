// backend/src/modules/cadmin/auth/cadminAuth.routes.js

import express from "express";
import {
  loginCAdminController,
  verifyCAdminOtpController,
  loginCAdminDirectController,
  refreshCAdminController,
  logoutCAdminController,
} from "./cadminAuth.controller.js";
import {
  forgotCAdminPasswordController,
  resetCAdminPasswordController,
} from "./cadminPassword.controller.js";
import {
  cadminForgotPasswordSchema,
  cadminResetPasswordSchema,
} from "./cadminPassword.schema.js";
import { validateBody } from "../../../middleware/validate.js";
import {
  cadminLoginSchema,
  cadminVerifyOtpSchema,
} from "./cadminAuth.schema.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES — No permission gates required
// These are pre-authentication endpoints. requireCAdmin cannot run here
// because the admin does not have a token yet.
// ─────────────────────────────────────────────────────────────────────────────

// POST /cadmin/login
router.post("/login", validateBody(cadminLoginSchema), loginCAdminController);

// POST /cadmin/login-direct (dev/special use)
router.post("/login-direct", validateBody(cadminLoginSchema), loginCAdminDirectController);

// POST /cadmin/verify-otp
router.post("/verify-otp", validateBody(cadminVerifyOtpSchema), verifyCAdminOtpController);

// GET /cadmin/refresh — uses httpOnly cookie, no Bearer token
router.get("/refresh", refreshCAdminController);

// POST /cadmin/logout
// requireCAdmin intentionally omitted — logout should always succeed
// even if the token is near-expired. The cookie is cleared regardless.
router.post("/logout", logoutCAdminController);

// POST /cadmin/forgot-password
router.post(
  "/forgot-password",
  validateBody(cadminForgotPasswordSchema),
  forgotCAdminPasswordController
);

// POST /cadmin/reset-password
router.post(
  "/reset-password",
  validateBody(cadminResetPasswordSchema),
  resetCAdminPasswordController
);

export default router;