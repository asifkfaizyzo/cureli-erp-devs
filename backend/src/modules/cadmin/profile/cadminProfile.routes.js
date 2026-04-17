// backend/src/modules/cadmin/profile/cadminProfile.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  getMyProfileController,
  getPendingCountsController,
} from "./cadminProfile.controller.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE ROUTES — requireCAdmin only, no permission gate
//
// These are self-referential routes. Every authenticated CAdmin must be able
// to fetch their own profile and pending counts regardless of their role
// assignments. Gating these behind a permission would break the auth flow
// (the frontend calls /me immediately after login to load permissions).
// ─────────────────────────────────────────────────────────────────────────────

// GET /cadmin/me
router.get("/me", requireCAdmin, getMyProfileController);

// GET /cadmin/pending-counts
router.get("/pending-counts", requireCAdmin, getPendingCountsController);

export default router;