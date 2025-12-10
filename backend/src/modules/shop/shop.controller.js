import { success, fail } from "../../utils/response.js";
import { updateShopInfo, updateShopGst } from "./shop.services.js";

// backend/src/modules/shop/shop.controller.js

import prisma from "../../config/prisma.js";

/**
 * GET /api/shop/verification-status
 * Returns verification status for the current user's shop
 */
export async function getVerificationStatusController(req, res) {
  try {
    const user_id = req.user.user_id;
    const shop_id = req.user.shop_id;

    if (!shop_id) {
      return fail(res, "No shop associated with your account", 400);
    }

    // Get shop verification status
    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      select: {
        shop_id: true,
        business_name: true,
        verification_status: true,
        verification_notes: true,
      },
    });

    if (!shop) {
      return fail(res, "Shop not found", 404);
    }

    // Get user status too
    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        status: true,
        first_login_after_verification: true,
      },
    });

    return success(res, {
      verification_status: shop.verification_status,
      user_status: user?.status,
      first_login_after_verification: user?.first_login_after_verification,
      shop_id: shop.shop_id,
      business_name: shop.business_name,
    });

  } catch (err) {
    console.error("shop.getVerificationStatus", err);
    return fail(res, "Failed to get verification status", 500);
  }
}

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
