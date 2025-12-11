// src/modules/cadmin/shops/cadminShops.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { upload } from "../../../config/multer.js"; // ✅ Import existing multer config

import {
  listShopsController,
  getShopByIdController,
  updateShopController,
  toggleShopActiveController,
  getShopStatsController,
  updateShopSubscriptionController,
  uploadShopDocumentController,
} from "./cadminShops.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// Stats route MUST be before :shop_id route (order matters!)
router.get("/shops/stats", getShopStatsController);

// List shops with filters & pagination
router.get("/shops", listShopsController);

// Get single shop with full details
router.get("/shops/:shop_id", getShopByIdController);

// Update shop details
router.patch("/shops/:shop_id", updateShopController);

// Toggle shop active status
router.patch("/shops/:shop_id/toggle-active", toggleShopActiveController);

// Update shop subscription
router.patch("/shops/:shop_id/subscription", updateShopSubscriptionController);

// Upload document on behalf of shop
router.post(
  "/shops/:shop_id/documents",
  upload.single("file"),
  uploadShopDocumentController
);

export default router;