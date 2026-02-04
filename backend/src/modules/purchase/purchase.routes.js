// backend/src/modules/purchase/purchase.routes.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createPurchaseInvoiceSchema,
  updatePurchaseInvoiceSchema,
  cancelInvoiceSchema,
  updatePaymentStatusSchema,
  recordPaymentSchema,
} from "./purchase.schema.js";
import {
  createPurchaseInvoiceController,
  confirmPurchaseInvoiceController,
  getPurchaseInvoicesController,
  getInvoiceDetailsController,
  updatePurchaseInvoiceController,
  cancelPurchaseInvoiceController,
  getPurchaseStatsController,
  updatePaymentStatusController,
  recordPaymentController,
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

// ✅ NEW: Payment status update (Super Admin only)
router.patch(
  "/:invoiceId/payment-status",
  validateBody(updatePaymentStatusSchema),
  updatePaymentStatusController
);

// ✅ NEW: Record payment
router.post(
  "/:invoiceId/payments",
  validateBody(recordPaymentSchema),
  recordPaymentController
);

export default router;