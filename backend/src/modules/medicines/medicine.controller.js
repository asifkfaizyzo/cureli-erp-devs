// backend/src/modules/medicines/medicine.controller.js

import { success, fail } from "../../utils/response.js";
import medicineService from "./medicine.service.js";

/**
 * Extract branch context from request headers
 * Frontend sends: X-Branch-Mode and X-Branch-Id headers
 */
function extractBranchContext(req) {
  const branchMode = req.headers["x-branch-mode"] || "BRANCH";
  const headerBranchId = req.headers["x-branch-id"] || null;
  
  // For super_admin: use header branch context
  // For others: use their assigned branch_id from JWT
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

export async function createMedicineController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const { branchId } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.createMedicine(
      req.validated,
      shopId,
      branchId,  // ✅ NEW: Pass branch
      userId
    );

    return success(res, medicine, "Medicine created successfully", 201);
  } catch (error) {
    console.error("medicine.create ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getMedicinesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      search: req.query.search,
      isActive: req.query.isActive === "true",
      manufacturer: req.query.manufacturer,
      category: req.query.category,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await medicineService.getMedicines(
      shopId, 
      branchId,      // ✅ NEW
      role,          // ✅ NEW
      branchMode,    // ✅ NEW
      filters
    );
    
    return success(res, result, "Medicines retrieved successfully");
  } catch (error) {
    console.error("medicine.getAll ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getMedicineByIdController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { medicineId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.getMedicineById(
      medicineId,
      shopId,
      branchId,
      role,
      branchMode
    );

    return success(res, medicine, "Medicine retrieved successfully");
  } catch (error) {
    console.error("medicine.getById ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function updateMedicineController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { medicineId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.updateMedicine(
      medicineId,
      shopId,
      branchId,
      role,
      branchMode,
      req.validated
    );

    return success(res, medicine, "Medicine updated successfully");
  } catch (error) {
    console.error("medicine.update ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function bulkCreateMedicinesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const { branchId } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const result = await medicineService.bulkCreateMedicines(
      req.validated.medicines,
      shopId,
      branchId,  // ✅ NEW
      userId
    );

    return success(res, result, "Bulk medicine import completed");
  } catch (error) {
    console.error("medicine.bulkCreate ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// ✅ NEW: Search endpoint for autocomplete
export async function searchMedicinesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);
    const searchTerm = req.query.q || req.query.search || "";

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicines = await medicineService.searchMedicines(
      shopId,
      branchId,
      role,
      branchMode,
      searchTerm,
      parseInt(req.query.limit) || 20
    );

    return success(res, { medicines }, "Search results");
  } catch (error) {
    console.error("medicine.search ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}