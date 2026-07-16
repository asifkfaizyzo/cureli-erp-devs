// src/modules/mobile/users/mobile.users.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import { mobileLimiter, mobileAuthLimiter } from "../../../middleware/rateLimiter.js";
import { validate } from "../../../middleware/validate.js";
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  confirmDeleteAccountSchema,
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
} from "./mobile.users.schema.js";
import {
  handleUpdateProfile,
  handleListAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleSetDefaultAddress,
  handleDeleteAddress,
  handleSendDeleteOtp,
  handleConfirmDeleteAccount,
} from "./mobile.users.controller.js";
import {
  handleListMembers,
  handleCreateMember,
  handleUpdateMember,
  handleDeleteMember,
} from "./mobile.members.controller.js";

const router = Router();

// All users routes require authentication
router.use(mobileAuth);
router.use(mobileLimiter);

// ── Profile ───────────────────────────────────────────────────
// NOT gated by requireProfileComplete — this IS how they complete it
router.patch(
  "/profile",
  validate(updateProfileSchema),
  handleUpdateProfile,
);

// ── Addresses ─────────────────────────────────────────────────
// NOT gated — addresses can be added during onboarding flow
router.get("/addresses", handleListAddresses);
router.post("/addresses", validate(createAddressSchema), handleCreateAddress);
router.patch("/addresses/:id", validate(updateAddressSchema), handleUpdateAddress);
router.patch("/addresses/:id/default", handleSetDefaultAddress);
router.delete("/addresses/:id", handleDeleteAddress);

// ── Family Members ────────────────────────────────────────────
// NOT gated by requireProfileComplete —
// user must complete their OWN profile before adding members,
// but the gate is enforced at the onboarding screen level on the
// frontend. These routes are ungated so the add-member flow
// during checkout doesn't break if called in an edge case.
router.get("/members", handleListMembers);
router.post("/members", validate(createFamilyMemberSchema), handleCreateMember);
router.patch("/members/:id", validate(updateFamilyMemberSchema), handleUpdateMember);
router.delete("/members/:id", handleDeleteMember);

// ── Account Deletion ──────────────────────────────────────────
router.post("/account/delete/send-otp", mobileAuthLimiter, handleSendDeleteOtp);
router.post(
  "/account/delete/confirm",
  mobileAuthLimiter,
  validate(confirmDeleteAccountSchema),
  handleConfirmDeleteAccount,
);

export default router;