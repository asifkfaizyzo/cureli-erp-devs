/**
 * ═══════════════════════════════════════════════════════════════
 * CADMIN MASTER MEDICINES CONTROLLER
 * ═══════════════════════════════════════════════════════════════
 */

import {
  getMasterMedicines,
  getMasterMedicineById,
  getMasterMedicineByKey,
  getVariantBySkuId,
  getMasterMedicineStats,
  getFilterOptions,
  autocompleteSearch,
  getUnmappedMedicinesAggregated,
  getNeedsReviewMedicines,
  getLinkedMedicines,
  acceptReviewMatch,
  rejectReviewMatch,
  matchUnmappedToMaster,
  ignoreUnmappedMedicines,
  unlinkShopMedicine,
  uploadMasterImage,
  deleteMasterImage,
} from "./cadminMasterMedicines.service.js";


// ══════════════════════════════════════════════════════════════
// LIST MASTER MEDICINES
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines
 * List all master medicines with pagination, search, filters
 */
export async function listMasterMedicines(req, res) {
  try {
    const {
      search,
      type,
      form,
      category,
      prescriptionRequired,
      minVariants,
      maxVariants,
      page,
      limit,
      sort,
      order,
    } = req.query;

    const result = await getMasterMedicines({
      search,
      type,
      form,
      category,
      prescriptionRequired,
      minVariants,
      maxVariants,
      page,
      limit,
      sort,
      order,
    });
    // console.log(result);
    

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error listing master medicines:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch master medicines",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// GET SINGLE MASTER MEDICINE
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/:id
 * Get single master medicine by ID or master_key with all variants
 */
export async function getMasterMedicine(req, res) {
  try {
    const { id } = req.params;

    const medicine = await getMasterMedicineById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Master medicine not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Error getting master medicine:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch master medicine",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// GET VARIANT BY SKU ID
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/variants/:skuId
 * Get single variant by SKU ID
 */
export async function getVariant(req, res) {
  try {
    const { skuId } = req.params;

    const variant = await getVariantBySkuId(skuId);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error("Error getting variant:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch variant",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// GET STATISTICS
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/stats
 * Get statistics for master medicines
 */
export async function getMasterMedicinesStats(req, res) {
  try {
    const stats = await getMasterMedicineStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting master medicine stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// GET FILTER OPTIONS
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/filters
 * Get filter options for dropdowns
 */
export async function getFilters(req, res) {
  try {
    const filters = await getFilterOptions();

    return res.status(200).json({
      success: true,
      data: filters,
    });
  } catch (error) {
    console.error("Error getting filter options:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filter options",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// AUTOCOMPLETE SEARCH
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/autocomplete
 * Autocomplete search for medicines
 */
export async function autocomplete(req, res) {
  try {
    const { q, limit } = req.query;

    const result = await autocompleteSearch(q, parseInt(limit) || 10);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in autocomplete:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch suggestions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// UNMAPPED MEDICINES
// ══════════════════════════════════════════════════════════════

export async function listUnmappedMedicines(req, res) {
  try {
    const { search, type, page, limit, sort, order } = req.query;
    const result = await getUnmappedMedicinesAggregated({
      search, type, page, limit, sort, order,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error listing unmapped medicines:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch unmapped medicines" });
  }
}

// ══════════════════════════════════════════════════════════════
// NEEDS REVIEW
// ══════════════════════════════════════════════════════════════

export async function listNeedsReview(req, res) {
  try {
    const { search, confidenceFilter, page, limit } = req.query;
    const result = await getNeedsReviewMedicines({
      search, confidenceFilter, page, limit,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error listing needs review:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch review items" });
  }
}

// ══════════════════════════════════════════════════════════════
// LINKED MEDICINES
// ══════════════════════════════════════════════════════════════

export async function listLinkedMedicines(req, res) {
  try {
    const { id } = req.params;
    const linked = await getLinkedMedicines(id);
    return res.status(200).json({ success: true, data: linked });
  } catch (error) {
    console.error("Error listing linked medicines:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch linked medicines" });
  }
}

// ══════════════════════════════════════════════════════════════
// ACCEPT REVIEW
// ══════════════════════════════════════════════════════════════

export async function acceptMatch(req, res) {
  try {
    const { medicineId } = req.params;
    const cadminId = req.cadmin?.cadmin_id;
    const result = await acceptReviewMatch(medicineId, cadminId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error accepting match:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// REJECT REVIEW
// ══════════════════════════════════════════════════════════════

export async function rejectMatch(req, res) {
  try {
    const { medicineId } = req.params;
    const result = await rejectReviewMatch(medicineId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error rejecting match:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// MATCH UNMAPPED TO MASTER
// ══════════════════════════════════════════════════════════════

export async function matchToMaster(req, res) {
  try {
    const { medicineIds, masterMedicineId } = req.body;
    const cadminId = req.cadmin?.cadmin_id;

    if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
      return res.status(400).json({ success: false, message: "medicineIds array is required" });
    }
    if (!masterMedicineId) {
      return res.status(400).json({ success: false, message: "masterMedicineId is required" });
    }

    const result = await matchUnmappedToMaster(medicineIds, masterMedicineId, cadminId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error matching to master:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// IGNORE UNMAPPED
// ══════════════════════════════════════════════════════════════

export async function ignoreUnmapped(req, res) {
  try {
    const { medicineIds } = req.body;

    if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
      return res.status(400).json({ success: false, message: "medicineIds array is required" });
    }

    const result = await ignoreUnmappedMedicines(medicineIds);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error ignoring unmapped:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// UNLINK SHOP MEDICINE
// ══════════════════════════════════════════════════════════════

export async function unlinkMedicine(req, res) {
  try {
    const { medicineId } = req.params;
    const result = await unlinkShopMedicine(medicineId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error unlinking medicine:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// IMAGE UPLOAD
// ══════════════════════════════════════════════════════════════

export async function handleImageUpload(req, res) {
  try {
    const { id } = req.params;
    const cadminName = req.cadmin?.name || "CAdmin";

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const image = await uploadMasterImage(id, {
      filename: req.file.filename,
      type: req.body.type || "PRIMARY",
      skuId: req.body.skuId,
    }, cadminName);

    return res.status(200).json({ success: true, data: image });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// IMAGE DELETE
// ══════════════════════════════════════════════════════════════

export async function handleImageDelete(req, res) {
  try {
    const { imageId } = req.params;
    const result = await deleteMasterImage(imageId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}