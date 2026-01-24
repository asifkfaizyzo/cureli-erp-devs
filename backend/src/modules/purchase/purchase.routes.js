// backend/src/modules/purchase/purchase.routes.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createPurchaseInvoiceSchema,
  updatePurchaseInvoiceSchema,
  cancelInvoiceSchema,
} from "./purchase.schema.js";
import {
  createPurchaseInvoiceController,
  confirmPurchaseInvoiceController,
  getPurchaseInvoicesController,
  getInvoiceDetailsController,
  updatePurchaseInvoiceController,
  cancelPurchaseInvoiceController,
  getPurchaseStatsController,
} from "./purchase.controller.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Purchase invoice CRUD
router.post(
  "/",
  validateBody(createPurchaseInvoiceSchema),
  createPurchaseInvoiceController
);

router.get("/", getPurchaseInvoicesController);

router.get("/stats", getPurchaseStatsController);

router.get("/:invoiceId", getInvoiceDetailsController);

router.put(
  "/:invoiceId",
  validateBody(updatePurchaseInvoiceSchema),
  updatePurchaseInvoiceController
);

// Invoice actions
router.post("/:invoiceId/confirm", confirmPurchaseInvoiceController);

router.post(
  "/:invoiceId/cancel",
  validateBody(cancelInvoiceSchema),
  cancelPurchaseInvoiceController
);

export default router;