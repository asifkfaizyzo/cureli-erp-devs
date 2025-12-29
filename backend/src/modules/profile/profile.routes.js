// src/modules/profile/profile.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  getProfile,
  updateBusiness,
  changePassword,
  initiateEmailChange,
  verifyEmailChange,
  initiatePhoneChangeOld,
  initiatePhoneChangeNew,
  verifyPhoneChangeNew,
  getSessions,
  logoutSession,
  logoutOtherSessions,
} from "./profile.controller.js";
import {
  updateBusinessSchema,
  changePasswordSchema,
  initiateEmailChangeSchema,
  verifyEmailChangeSchema,
  initiatePhoneChangeNewSchema,
  verifyPhoneChangeNewSchema,
} from "./profile.schema.js";

const router = Router();

// All routes require authentication and super_admin role
router.use(requireAuth);
router.use(requireRole("super_admin"));

// ============================================
// GET PROFILE
// ============================================
router.get("/", getProfile);

// ============================================
// BUSINESS INFO
// ============================================
router.put("/business", validate(updateBusinessSchema), updateBusiness);

// ============================================
// PASSWORD CHANGE
// ============================================
router.post("/password", validate(changePasswordSchema), changePassword);

// ============================================
// EMAIL CHANGE (2-step)
// ============================================
router.post("/email/initiate", validate(initiateEmailChangeSchema), initiateEmailChange);
router.post("/email/verify", validate(verifyEmailChangeSchema), verifyEmailChange);

// ============================================
// PHONE CHANGE (3-step)
// ============================================
router.post("/phone/verify-old", initiatePhoneChangeOld);
router.post("/phone/initiate-new", validate(initiatePhoneChangeNewSchema), initiatePhoneChangeNew);
router.post("/phone/verify-new", validate(verifyPhoneChangeNewSchema), verifyPhoneChangeNew);

// ============================================
// SESSIONS
// ============================================
router.get("/sessions", getSessions);
router.delete("/sessions/others", logoutOtherSessions);
router.delete("/sessions/:sessionId", logoutSession);

export default router;