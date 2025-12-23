import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  getMyProfileController,
  getPendingCountsController,
} from "./cadminProfile.controller.js";

const router = express.Router();

// GET /cadmin/me - Get logged-in admin profile + pending counts
router.get("/me", requireCAdmin, getMyProfileController);

// GET /cadmin/pending-counts - Just the notification counts (for polling)
router.get("/pending-counts", requireCAdmin, getPendingCountsController);

export default router;