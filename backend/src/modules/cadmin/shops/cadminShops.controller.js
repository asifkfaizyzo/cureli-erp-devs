// src/modules/cadmin/shops/cadminShops.controller.js

import {
  listShops,
  getShopById,
  updateShop,
  toggleShopActive,
  getShopStats,
  updateShopSubscription, // NEW
  uploadShopDocument, // NEW
} from "./cadminShops.service.js";
import { success, fail } from "../../../utils/response.js";


/**
 * Update shop subscription (change plan)
 */
export async function updateShopSubscriptionController(req, res) {
  try {
    const { shop_id } = req.params;
    const { plan_id } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!shop_id) {
      return fail(res, "Shop ID is required", 400);
    }

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    const result = await updateShopSubscription(shop_id, plan_id, cadmin_id);

    return success(res, result, "Subscription updated successfully");
  } catch (err) {
    console.error("updateShopSubscriptionController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "PLAN_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to update subscription", 500);
  }
}
/**
 * Upload document on behalf of shop
 */
export async function uploadShopDocumentController(req, res) {
  try {
    const { shop_id } = req.params;
    const { file_type } = req.body;
    const file = req.file;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!shop_id) {
      return fail(res, "Shop ID is required", 400);
    }

    if (!file_type) {
      return fail(res, "File type is required", 400);
    }

    if (!file) {
      return fail(res, "No file uploaded", 400);
    }

    const validFileTypes = [
      "drug_license",
      "pharmacy_registration",
      "gst_certificate",
      "business_registration_proof",
      "shop_establishment_license",
      "address_proof",
      "pan_card",
      "fssai_license",
    ];

    if (!validFileTypes.includes(file_type)) {
      return fail(res, `Invalid file type. Must be one of: ${validFileTypes.join(", ")}`, 400);
    }

    const result = await uploadShopDocument({
      shop_id,
      file_type,
      file,
      uploaded_by: cadmin_id,
    });

    return success(res, result, "Document uploaded successfully");
  } catch (err) {
    console.error("uploadShopDocumentController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to upload document", 500);
  }
}
/**
 * List shops with filters, sorting, and pagination
 */
export async function listShopsController(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      verification_status,
      subscription_status,
      is_active,
      city,
      state,
      date_start,
      date_end,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const result = await listShops({
      page: Number(page),
      limit: Number(limit),
      search,
      verification_status,
      subscription_status,
      is_active:
        is_active === "true" ? true : is_active === "false" ? false : undefined,
      city,
      state,
      date_start,
      date_end,
      sort_by,
      sort_order,
    });

    return success(res, result, "Shops fetched successfully");
  } catch (err) {
    console.error("listShopsController error:", err);
    return fail(res, err.message || "Failed to fetch shops", 500);
  }
}
/**
 * Get single shop with full details
 */
export async function getShopByIdController(req, res) {
  try {
    const { shop_id } = req.params;

    if (!shop_id) {
      return fail(res, "Shop ID is required", 400);
    }

    const shop = await getShopById(shop_id);

    if (!shop) {
      return fail(res, "Shop not found", 404);
    }

    return success(res, shop, "Shop fetched successfully");
  } catch (err) {
    console.error("getShopByIdController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to fetch shop", 500);
  }
}
/**
 * Update shop details
 */
export async function updateShopController(req, res) {
  try {
    const { shop_id } = req.params;
    const updates = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!shop_id) {
      return fail(res, "Shop ID is required", 400);
    }

    // Validate allowed fields
    const allowedFields = [
      "business_name",
      "legal_name",
      "gst_number",
      "business_type",
      "address_line_1",
      "address_line_2",
      "city",
      "state",
      "pincode",
      "verification_notes",
    ];

    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return fail(res, "No valid fields to update", 400);
    }

    const updatedShop = await updateShop(shop_id, filteredUpdates, cadmin_id);

    return success(res, updatedShop, "Shop updated successfully");
  } catch (err) {
    console.error("updateShopController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "DUPLICATE_GST") {
      return fail(res, err.message, 409);
    }

    return fail(res, err.message || "Failed to update shop", 500);
  }
}
/**
 * Toggle shop active status (suspend/activate)
 */
export async function toggleShopActiveController(req, res) {
  try {
    const { shop_id } = req.params;
    const { is_active } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!shop_id) {
      return fail(res, "Shop ID is required", 400);
    }

    if (typeof is_active !== "boolean") {
      return fail(res, "is_active must be a boolean", 400);
    }

    const updatedShop = await toggleShopActive(shop_id, is_active, cadmin_id);

    const action = is_active ? "activated" : "suspended";
    return success(res, updatedShop, `Shop ${action} successfully`);
  } catch (err) {
    console.error("toggleShopActiveController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to toggle shop status", 500);
  }
}
export async function getShopStatsController(req, res) {
  try {
    const stats = await getShopStats();
    return success(res, stats, "Shop stats fetched successfully");
  } catch (err) {
    console.error("getShopStatsController error:", err);
    return fail(res, err.message || "Failed to fetch stats", 500);
  }
}
