// backend/src/modules/sales/sales.routes.js

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createSalesInvoiceSchema,
  addItemsSchema,
  confirmInvoiceSchema,
  cancelInvoiceSchema,
  parkInvoiceSchema,
  recordPaymentSchema,
  createSalesReturnSchema,
  cancelSalesReturnSchema,
} from "./sales.schema.js";
import {
  getAvailableBatchesController,
  createDraftSaleController,
  addItemsController,
  removeItemController,
  parkInvoiceController,
  resumeParkedInvoiceController,
  getParkedInvoicesController,
  confirmSaleController,
  cancelInvoiceController,
  recordPaymentController,
  getSalesInvoicesController,
  getInvoiceDetailsController,
  getSalesStatsController,
  createSalesReturnController,
  getSalesReturnsController,
  getReturnDetailsController,
  getReturnableItemsController,
  cancelSalesReturnController,
} from "./sales.controller.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════════
// STOCK/BATCH ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

router.get("/batches/:medicineId", getAvailableBatchesController);

// ═══════════════════════════════════════════════════════════════════════
// PARKED INVOICES
// ═══════════════════════════════════════════════════════════════════════

router.get("/parked", getParkedInvoicesController);

// ═══════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════

router.get("/stats", getSalesStatsController);

// ═══════════════════════════════════════════════════════════════════════
// SALES RETURNS (Must come before /:invoiceId routes)
// ═══════════════════════════════════════════════════════════════════════

router.get("/returns", getSalesReturnsController);

router.post(
  "/returns",
  validateBody(createSalesReturnSchema),
  createSalesReturnController
);

router.get("/returns/:returnId", getReturnDetailsController);

router.post(
  "/returns/:returnId/cancel",
  validateBody(cancelSalesReturnSchema),
  cancelSalesReturnController
);

// ═══════════════════════════════════════════════════════════════════════
// INVOICE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

router.post(
  "/",
  validateBody(createSalesInvoiceSchema),
  createDraftSaleController
);

router.get("/", getSalesInvoicesController);

router.get("/:invoiceId", getInvoiceDetailsController);

router.get("/:invoiceId/returnable-items", getReturnableItemsController);

router.post(
  "/:invoiceId/items",
  validateBody(addItemsSchema),
  addItemsController
);

router.delete("/:invoiceId/items/:itemId", removeItemController);

router.post(
  "/:invoiceId/park",
  validateBody(parkInvoiceSchema),
  parkInvoiceController
);

router.post("/:invoiceId/resume", resumeParkedInvoiceController);

router.post(
  "/:invoiceId/confirm",
  validateBody(confirmInvoiceSchema),
  confirmSaleController
);

router.post(
  "/:invoiceId/cancel",
  validateBody(cancelInvoiceSchema),
  cancelInvoiceController
);

router.post(
  "/:invoiceId/payments",
  validateBody(recordPaymentSchema),
  recordPaymentController
);

export default router;