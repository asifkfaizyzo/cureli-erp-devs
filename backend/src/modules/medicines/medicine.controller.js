// backend/src/modules/medicines/medicine.controller.js
import { success, fail } from "../../utils/response.js";
import medicineService from "./medicine.service.js";

export async function createMedicineController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const userId = req.user.user_id;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.createMedicine(
      req.validated,
      shopId,
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

    const result = await medicineService.getMedicines(shopId, filters);
    return success(res, result, "Medicines retrieved successfully");
  } catch (error) {
    console.error("medicine.getAll ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getMedicineByIdController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { medicineId } = req.params;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.getMedicineById(
      medicineId,
      shopId
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
    const { medicineId } = req.params;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.updateMedicine(
      medicineId,
      shopId,
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

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const result = await medicineService.bulkCreateMedicines(
      req.validated.medicines,
      shopId,
      userId
    );

    return success(res, result, "Bulk medicine import completed");
  } catch (error) {
    console.error("medicine.bulkCreate ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}
