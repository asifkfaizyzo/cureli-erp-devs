import { success, fail } from "../../../utils/response.js";
import {
  getMyProfileService,
  getPendingCountsService,
} from "./cadminProfile.service.js";

export async function getMyProfileController(req, res) {
  try {
    const { cadmin_id } = req.cadmin;
    const data = await getMyProfileService(cadmin_id);
    return success(res, data);
  } catch (err) {
    console.error("cadmin.profile.me", err);
    return fail(res, err.message || "Failed to fetch profile", err.status || 500);
  }
}

export async function getPendingCountsController(req, res) {
  try {
    const counts = await getPendingCountsService();
    return success(res, counts);
  } catch (err) {
    console.error("cadmin.profile.pendingCounts", err);
    return fail(res, err.message || "Failed to fetch counts", err.status || 500);
  }
}