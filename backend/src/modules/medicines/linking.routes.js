/**
 * ═══════════════════════════════════════════════════════════════
 * MEDICINE LINKING ROUTES
 * ═══════════════════════════════════════════════════════════════
 */

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getSuggestionsForMedicine,
  manuallyLinkMedicine,
  unlinkMedicine,
  bulkAutoLinkMedicines,
  getUnlinkedMedicines,
  searchMasterCatalog,
} from "./linking.service.js";
import { success, fail } from "../../utils/response.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ══════════════════════════════════════════════════════════════
// SEARCH MASTER CATALOG
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/medicines/linking/search-catalog
 * Search master catalog for manual linking
 */
router.get("/search-catalog", async (req, res) => {
  try {
    const { q, limit } = req.query;
    const results = await searchMasterCatalog(q, parseInt(limit) || 10);
    return success(res, { results }, "Search results");
  } catch (error) {
    console.error("linking.searchCatalog ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// GET UNLINKED MEDICINES
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/medicines/linking/unlinked
 * Get all unlinked medicines for current shop
 */
router.get("/unlinked", async (req, res) => {
  try {
    const shopId = req.user.shop_id;
    const branchId = req.headers["x-branch-id"] || null;
    const { status, page, limit } = req.query;
    
    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }
    
    const result = await getUnlinkedMedicines(shopId, branchId, {
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    return success(res, result, "Unlinked medicines retrieved");
  } catch (error) {
    console.error("linking.getUnlinked ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// GET SUGGESTIONS FOR MEDICINE
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/medicines/linking/:medicineId/suggestions
 * Get link suggestions for a medicine
 */
router.get("/:medicineId/suggestions", async (req, res) => {
  try {
    const { medicineId } = req.params;
    const result = await getSuggestionsForMedicine(medicineId);
    return success(res, result, "Suggestions retrieved");
  } catch (error) {
    console.error("linking.getSuggestions ERROR:", error);
    return fail(res, error.message, error.message === "Medicine not found" ? 404 : 500);
  }
});

// ══════════════════════════════════════════════════════════════
// MANUAL LINK
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/medicines/linking/:medicineId/link
 * Manually link medicine to master catalog
 */
router.post("/:medicineId/link", async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { masterMedicineId } = req.body;
    const userId = req.user.user_id;
    
    if (!masterMedicineId) {
      return fail(res, "masterMedicineId is required", 400);
    }
    
    const result = await manuallyLinkMedicine(medicineId, masterMedicineId, userId);
    return success(res, result, "Medicine linked successfully");
  } catch (error) {
    console.error("linking.manualLink ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// UNLINK
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/medicines/linking/:medicineId/unlink
 * Unlink medicine from master catalog
 */
router.post("/:medicineId/unlink", async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { reject } = req.body;
    
    const result = await unlinkMedicine(medicineId, reject === true);
    return success(res, result, `Medicine ${reject ? "rejected" : "unlinked"} successfully`);
  } catch (error) {
    console.error("linking.unlink ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// BULK AUTO-LINK
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/medicines/linking/bulk-auto-link
 * Auto-link all pending medicines for shop
 */
router.post("/bulk-auto-link", async (req, res) => {
  try {
    const shopId = req.user.shop_id;
    const branchId = req.headers["x-branch-id"] || null;
    
    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }
    
    const result = await bulkAutoLinkMedicines(shopId, branchId);
    return success(res, result, "Bulk auto-link completed");
  } catch (error) {
    console.error("linking.bulkAutoLink ERROR:", error);
    return fail(res, error.message, 500);
  }
});

export default router;