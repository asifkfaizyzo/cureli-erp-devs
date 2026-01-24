import inventoryService from "./inventory.service.js";
import { success, fail } from "../../utils/response.js";

class InventoryController {
  async getInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const filters = {
        branchId: req.query.branchId,
        medicineId: req.query.medicineId,
        search: req.query.search,
        includeExpired: req.query.includeExpired === "true",
        lowStock: req.query.lowStock === "true",
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
      };

      const result = await inventoryService.getInventory(shopId, filters);
      return success(res, result, "Inventory retrieved successfully");
    } catch (error) {
      console.error("getInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getByMedicine(req, res) {
    try {
      const shopId = req.user.shop_id;
      const { medicineId } = req.params;
      const filters = {
        branchId: req.query.branchId,
        includeExpired: req.query.includeExpired === "true",
      };

      const inventory = await inventoryService.getInventoryByMedicine(shopId, medicineId, filters);
      return success(res, inventory, "Medicine inventory retrieved successfully");
    } catch (error) {
      console.error("getByMedicine error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getLowStock(req, res) {
    try {
      const shopId = req.user.shop_id;
      const branchId = req.query.branchId;

      const items = await inventoryService.getLowStockItems(shopId, branchId);
      return success(res, items, "Low stock items retrieved successfully");
    } catch (error) {
      console.error("getLowStock error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getExpiringSoon(req, res) {
    try {
      const shopId = req.user.shop_id;
      const branchId = req.query.branchId;
      const daysAhead = parseInt(req.query.daysAhead) || 90;

      const items = await inventoryService.getExpiringSoonItems(shopId, daysAhead, branchId);
      return success(res, items, "Expiring items retrieved successfully");
    } catch (error) {
      console.error("getExpiringSoon error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getStockLedger(req, res) {
    try {
      const shopId = req.user.shop_id;
      const filters = {
        medicineId: req.query.medicineId,
        batchNumber: req.query.batchNumber,
        movementType: req.query.movementType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
      };

      const result = await inventoryService.getStockLedger(shopId, filters);
      return success(res, result, "Stock ledger retrieved successfully");
    } catch (error) {
      console.error("getStockLedger error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async createAdjustment(req, res) {
    try {
      const shopId = req.user.shop_id;
      const userId = req.user.user_id;

      const adjustment = await inventoryService.createStockAdjustment(
        { ...req.validated, shopId },
        userId
      );

      return success(res, adjustment, "Stock adjustment created successfully", 201);
    } catch (error) {
      console.error("createAdjustment error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getStockSummary(req, res) {
    try {
      const shopId = req.user.shop_id;
      const branchId = req.query.branchId;

      const summary = await inventoryService.getStockSummary(shopId, branchId);
      return success(res, summary, "Stock summary retrieved successfully");
    } catch (error) {
      console.error("getStockSummary error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }
}

export default new InventoryController();