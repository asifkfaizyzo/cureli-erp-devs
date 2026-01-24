// backend/src/modules/suppliers/supplier.controller.js
import { success, fail } from "../../utils/response.js";
import supplierService from "./supplier.service.js";

export async function createSupplierController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const userId = req.user.user_id;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const supplier = await supplierService.createSupplier(
      req.validated,
      shopId,
      userId
    );

    return success(res, supplier, "Supplier created successfully", 201);
  } catch (error) {
    console.error("supplier.create ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// backend/src/modules/suppliers/supplier.controller.js
export async function getSuppliersController(req, res) {
  try {
    const shopId = req.user.shop_id;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      search: req.query.search,
      // ✅ FIX: Only set isActive if explicitly provided
      isActive: req.query.isActive !== undefined 
        ? req.query.isActive === "true" 
        : undefined,  // Don't filter by active status if not specified
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };

    console.log("Supplier filters:", filters); // DEBUG

    const result = await supplierService.getSuppliers(shopId, filters);
    
    console.log("Suppliers found:", result.total); // DEBUG
    
    return success(res, result, "Suppliers retrieved successfully");
  } catch (error) {
    console.error("supplier.getAll ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getSupplierByIdController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { supplierId } = req.params;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const supplier = await supplierService.getSupplierById(
      supplierId,
      shopId
    );

    return success(res, supplier, "Supplier retrieved successfully");
  } catch (error) {
    console.error("supplier.getById ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function updateSupplierController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { supplierId } = req.params;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const supplier = await supplierService.updateSupplier(
      supplierId,
      shopId,
      req.validated
    );

    return success(res, supplier, "Supplier updated successfully");
  } catch (error) {
    console.error("supplier.update ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}
