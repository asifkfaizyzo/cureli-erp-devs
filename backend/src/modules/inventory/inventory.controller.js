import inventoryService from "./inventory.service.js";
import { success, fail } from "../../utils/response.js";

/**
 * Extract branch context from request headers
 */
function extractBranchContext(req) {
  const branchMode = req.headers["x-branch-mode"] || "BRANCH";
  const headerBranchId = req.headers["x-branch-id"] || null;
  
  // For super_admin: use header branch context
  if (req.user.role === "super_admin") {
    return {
      branchId: branchMode === "GLOBAL" ? null : headerBranchId,
      branchMode,
    };
  }
  
  // branch_admin/staff: always use their assigned branch
  return {
    branchId: req.user.branch_id,
    branchMode: "BRANCH",
  };
}

class InventoryController {
  async getInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      console.log("📦 getInventory request:", { shopId, role, branchId, branchMode });

      const filters = {
        medicineId: req.query.medicineId,
        search: req.query.search,
        includeExpired: req.query.includeExpired === "true",
        lowStock: req.query.lowStock === "true",
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
      };

      const result = await inventoryService.getInventory(
        shopId, 
        branchId, 
        role, 
        branchMode, 
        filters
      );
      
      return success(res, result, "Inventory retrieved successfully");
    } catch (error) {
      console.error("getInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getByMedicine(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { medicineId } = req.params;
      const { branchId, branchMode } = extractBranchContext(req);

      const filters = {
        includeExpired: req.query.includeExpired === "true",
      };

      const inventory = await inventoryService.getInventoryByMedicine(
        shopId, 
        medicineId, 
        branchId,
        role,
        branchMode,
        filters
      );
      
      return success(res, inventory, "Medicine inventory retrieved successfully");
    } catch (error) {
      console.error("getByMedicine error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getLowStock(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const items = await inventoryService.getLowStockItems(
        shopId, 
        branchId,
        role,
        branchMode
      );
      
      return success(res, items, "Low stock items retrieved successfully");
    } catch (error) {
      console.error("getLowStock error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getExpiringSoon(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);
      const daysAhead = parseInt(req.query.daysAhead) || 90;

      const items = await inventoryService.getExpiringSoonItems(
        shopId, 
        daysAhead, 
        branchId,
        role,
        branchMode
      );
      
      return success(res, items, "Expiring items retrieved successfully");
    } catch (error) {
      console.error("getExpiringSoon error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getStockLedger(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const filters = {
        medicineId: req.query.medicineId,
        batchNumber: req.query.batchNumber,
        movementType: req.query.movementType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
      };

      const result = await inventoryService.getStockLedger(
        shopId, 
        branchId,
        role,
        branchMode,
        filters
      );
      
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
      const { branchId } = extractBranchContext(req);

      if (!branchId) {
        return fail(res, "Please select a specific branch to create adjustments", 400, {
          code: "BRANCH_REQUIRED"
        });
      }

      const adjustment = await inventoryService.createStockAdjustment(
        { ...req.validated, shopId, branchId },
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
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const summary = await inventoryService.getStockSummary(
        shopId, 
        branchId,
        role,
        branchMode
      );
      
      return success(res, summary, "Stock summary retrieved successfully");
    } catch (error) {
      console.error("getStockSummary error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  // ✅ NEW: Update inventory item
  async updateInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const userId = req.user.user_id;
      const { inventoryId } = req.params;
      const { branchId } = extractBranchContext(req);

      console.log("📝 updateInventory request:", { 
        inventoryId, 
        shopId, 
        branchId,
        data: req.validated 
      });

      // Validate branch for write operation
      if (!branchId) {
        return fail(res, "Please select a specific branch to update inventory", 400, {
          code: "BRANCH_REQUIRED"
        });
      }

      const updated = await inventoryService.updateInventory(
        inventoryId,
        shopId,
        branchId,
        req.validated,
        userId
      );

      return success(res, updated, "Inventory updated successfully");
    } catch (error) {
      console.error("updateInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  // ✅ NEW: Delete inventory item (soft delete)
  async deleteInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const userId = req.user.user_id;
      const { inventoryId } = req.params;
      const { branchId } = extractBranchContext(req);

      console.log("🗑️ deleteInventory request:", { inventoryId, shopId, branchId });

      if (!branchId) {
        return fail(res, "Please select a specific branch to delete inventory", 400, {
          code: "BRANCH_REQUIRED"
        });
      }

      const result = await inventoryService.deleteInventory(
        inventoryId,
        shopId,
        branchId,
        userId
      );

      return success(res, result, "Inventory item deleted successfully");
    } catch (error) {
      console.error("deleteInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }
}

export default new InventoryController();