// backend/src/modules/cadmin/marketplace-orders/cadminMarketplaceOrders.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  listOrders,
  getOrder,
  updateStatus,
} from "./cadminMarketplaceOrders.controller.js";

const router = express.Router();

router.use(requireCAdmin);

/**
 * GET /cadmin/marketplace-orders
 */
router.get("/marketplace-orders", listOrders);

/**
 * GET /cadmin/marketplace-orders/:orderId
 */
router.get("/marketplace-orders/:orderId", getOrder);

/**
 * PATCH /cadmin/marketplace-orders/:orderId/status
 */
router.patch("/marketplace-orders/:orderId/status", updateStatus);

export default router;