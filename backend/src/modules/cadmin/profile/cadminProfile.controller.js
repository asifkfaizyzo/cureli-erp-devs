// backend/src/modules/cadmin/profile/cadminProfile.controller.js

import { success, fail } from "../../../utils/response.js";
import * as svc from "./cadminProfile.service.js";

export async function getMyProfileController(req, res) {
  try {
    const { cadmin_id } = req.cadmin;
    const data = await svc.getMyProfileService(cadmin_id);
    // ✅ correct argument order: success(res, data, message)
    return success(res, data, "Profile fetched");
  } catch (err) {
    console.error("cadmin.profile.me", err);
    return fail(res, err.message || "Failed to fetch profile", err.status || 500);
  }
}

export async function getPendingCountsController(req, res) {
  try {
    const counts = await svc.getPendingCountsService();
    // ✅ correct argument order
    return success(res, counts, "Pending counts fetched");
  } catch (err) {
    console.error("cadmin.profile.pendingCounts", err);
    return fail(res, err.message || "Failed to fetch counts", err.status || 500);
  }
}