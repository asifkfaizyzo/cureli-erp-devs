import express from "express";
import inventoryController from "./inventory.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createAdjustmentSchema,updateInventorySchema   } from "./inventory.schema.js";

const router = express.Router();

router.use(requireAuth);

// Inventory queries
router.get("/", inventoryController.getInventory);
router.get("/summary", inventoryController.getStockSummary);
router.get("/low-stock", inventoryController.getLowStock);
router.get("/expiring-soon", inventoryController.getExpiringSoon);
router.get("/medicine/:medicineId", inventoryController.getByMedicine);

// Stock ledger
router.get("/ledger", inventoryController.getStockLedger);

// ✅ NEW: CRUD operations
router.put("/:inventoryId", validate(updateInventorySchema), inventoryController.updateInventory);
router.delete("/:inventoryId", inventoryController.deleteInventory);

// Stock adjustment
router.post("/adjustment", validate(createAdjustmentSchema), inventoryController.createAdjustment);

export default router;