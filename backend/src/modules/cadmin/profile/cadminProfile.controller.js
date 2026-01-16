// ============================================
// backend\src\modules\cadmin\profile\cadminProfile.controller.js
// ============================================

import { success, fail } from "../../../utils/response.js";
import * as svc from "./cadminProfile.service.js";

/**
 * GET /cadmin/profile/me
 * Get current admin's profile with pending counts
 */
export async function getMyProfileController(req, res) {
  try {
    const { cadmin_id } = req.cadmin;
    const data = await svc.getMyProfileService(cadmin_id);
    return success(res, data);
  } catch (err) {
    console.error("cadmin.profile.me", err);
    return fail(res, err.message || "Failed to fetch profile", err.status || 500);
  }
}

/**
 * GET /cadmin/profile/pending-counts
 * Get counts of items needing attention
 */
export async function getPendingCountsController(req, res) {
  try {
    const counts = await svc.getPendingCountsService();
    return success(res, counts);
  } catch (err) {
    console.error("cadmin.profile.pendingCounts", err);
    return fail(res, err.message || "Failed to fetch counts", err.status || 500);
  }
}