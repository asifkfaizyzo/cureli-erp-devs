// src/modules/mobile/users/mobile.users.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import { mobileLimiter, mobileAuthLimiter  } from "../../../middleware/rateLimiter.js";
import { validate } from "../../../middleware/validate.js";
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  confirmDeleteAccountSchema,
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

const router = Router();

// All users routes require authentication
router.use(mobileAuth);
router.use(mobileLimiter);

// ── Profile ───────────────────────────────────────────────────
router.patch(
  "/users/profile",
  validate(updateProfileSchema),
  handleUpdateProfile,
);

// ── Addresses ─────────────────────────────────────────────────
router.get("/users/addresses", handleListAddresses);
router.post(
  "/users/addresses",
  validate(createAddressSchema),
  handleCreateAddress,
);
router.patch(
  "/users/addresses/:id",
  validate(updateAddressSchema),
  handleUpdateAddress,
);
router.patch("/users/addresses/:id/default", handleSetDefaultAddress);
router.delete("/users/addresses/:id", handleDeleteAddress);

// ── Account Deletion ──────────────────────────────────────────
// Uses stricter mobileAuthLimiter — same as OTP endpoints.
// Sending the delete OTP is a sensitive action.
router.post(
  "/users/account/delete/send-otp",
  mobileAuthLimiter,
  handleSendDeleteOtp,
);
router.post(
  "/users/account/delete/confirm",
  mobileAuthLimiter,
  validate(confirmDeleteAccountSchema),
  handleConfirmDeleteAccount,
);
export default router;
