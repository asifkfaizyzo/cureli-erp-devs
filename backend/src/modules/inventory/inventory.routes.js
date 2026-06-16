// backend/src/modules/inventory/inventory.routes.js

import express from "express";
import inventoryController from "./inventory.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createAdjustmentSchema,
  updateInventorySchema,
  createInventoryWithMedicineSchema,
} from "./inventory.schema.js";

const router = express.Router();

router.use(requireAuth);

// ── Inventory queries ──────────────────────────────────────────────────────
router.get("/", inventoryController.getInventory);
router.get("/summary", inventoryController.getStockSummary);
router.get("/low-stock", inventoryController.getLowStock);
router.get("/expiring-soon", inventoryController.getExpiringSoon);
router.get("/medicine/:medicineId", inventoryController.getByMedicine);

// ── Stock ledger ───────────────────────────────────────────────────────────
router.get("/ledger", inventoryController.getStockLedger);

// ── NEW: Create inventory + medicine in one shot ───────────────────────────
// IMPORTANT: Must be defined BEFORE /:inventoryId routes so Express does not
// treat "create-with-medicine" as an inventoryId parameter value.
router.post(
  "/create-with-medicine",
  validate(createInventoryWithMedicineSchema),
  (req, res) => inventoryController.createInventoryWithMedicine(req, res),
);

// ── Stock adjustment ───────────────────────────────────────────────────────
router.post(
  "/adjustment",
  validate(createAdjustmentSchema),
  inventoryController.createAdjustment,
);

// ── CRUD on existing inventory items ──────────────────────────────────────
// These must come AFTER all fixed-path POST/GET routes above.
router.put(
  "/:inventoryId",
  validate(updateInventorySchema),
  inventoryController.updateInventory,
);
router.delete("/:inventoryId", inventoryController.deleteInventory);

export default router;