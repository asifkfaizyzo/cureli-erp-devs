// src/modules/mobile/users/mobile.users.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import { mobileLimiter } from "../../../middleware/rateLimiter.js";
import { validate } from "../../../middleware/validate.js";
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
} from "./mobile.users.schema.js";
import {
  handleUpdateProfile,
  handleListAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleSetDefaultAddress,
  handleDeleteAddress,
} from "./mobile.users.controller.js";

const router = Router();

// All users routes require authentication
router.use(mobileAuth);
router.use(mobileLimiter);

// ── Profile ───────────────────────────────────────────────────
router.patch("/users/profile", validate(updateProfileSchema), handleUpdateProfile);

// ── Addresses ─────────────────────────────────────────────────
router.get("/users/addresses", handleListAddresses);
router.post("/users/addresses", validate(createAddressSchema), handleCreateAddress);
router.patch("/users/addresses/:id", validate(updateAddressSchema), handleUpdateAddress);
router.patch("/users/addresses/:id/default", handleSetDefaultAddress);
router.delete("/users/addresses/:id", handleDeleteAddress);

export default router;