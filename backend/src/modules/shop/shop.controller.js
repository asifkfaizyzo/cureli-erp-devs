import { success, fail } from "../../utils/response.js";
import {
  updateShopInfo,
  updateShopGst
} from "./shop.services.js";

export async function updateShopInfoController(req, res) {
  try {
    const data = req.validated; // validated by ZOD
    const user_id = req.user.user_id; // from JWT

    await updateShopInfo(user_id, data);

    return success(res, {}, "Business information updated");
  } catch (err) {
    console.error(err);
    return fail(res, err.message || "Failed to update business info", 400);
  }
}

export async function updateShopGstController(req, res) {
  try {
    const data = req.validated;
    const user_id = req.user.user_id;

    await updateShopGst(user_id, data);

    return success(res, {}, "Business GST updated");
  } catch (err) {
    console.error(err);
    return fail(res, err.message || "Failed to update GST info", 400);
  }
}
