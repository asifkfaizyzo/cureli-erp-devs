// backend/src/modules/shopFiles/shopFiles.controller.js

import prisma from "../../config/prisma.js";
import { success, fail } from "../../utils/response.js";
import * as svc from "./shopFiles.service.js";

/**
 * Helper: Resolve shop_id for a user
 * Checks both user.shop_id (member) and owned shops (owner)
 */
async function resolveShopId(user) {
  // First check if shop_id is set on user token
  if (user.shop_id) {
    return user.shop_id;
  }

  // Fallback: Check if user owns a shop
  const ownedShop = await prisma.shop.findFirst({
    where: { owner_user_id: user.user_id },
    select: { shop_id: true },
  });

  return ownedShop?.shop_id || null;
}

/**
 * GET /api/shop/files/verification-status
 * Returns verification status for the current user's shop
 */


export async function getVerificationStatusController(req, res) {
  try {
    const user_id = req.user.user_id;
    const shop_id = await resolveShopId(req.user);

    console.log("=== VERIFICATION STATUS DEBUG ===");
    console.log("user_id:", user_id);
    console.log("resolved shop_id:", shop_id);

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

    // Get user status
    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        status: true,
        first_login_after_verification: true,
        first_verified_at: true,
        first_name: true,
        last_name: true,
      },
    });

    const isFirstVerification = !user?.first_verified_at;

    console.log("=== IS_FIRST_VERIFICATION DEBUG ===");
    console.log("user_id:", user_id);
    console.log("first_verified_at:", user?.first_verified_at);
    console.log("first_login_after_verification:", user?.first_login_after_verification);
    console.log("is_first_verification:", isFirstVerification);
    console.log("=== END DEBUG ===");

    return success(res, {
      verification_status: shop.verification_status,
      user_status: user?.status,
      first_login_after_verification: user?.first_login_after_verification,
      first_verified_at: user?.first_verified_at,
      // ✅ FIXED: Use first_verified_at to determine first-time vs returning
      is_first_verification: isFirstVerification,
      shop_id: shop.shop_id,
      business_name: shop.business_name,
      user_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
    });
  } catch (err) {
    console.error("shopFiles.getVerificationStatus", err);
    return fail(res, "Failed to get verification status", 500);
  }
}

/**
 * POST /api/shop/files/upload
 * Initial file upload during shop onboarding
 */
export async function uploadShopFileController(req, res) {
  try {
    const { file_type } = req.body;

    if (!file_type) {
      return fail(res, "file_type is required", 400);
    }

    if (!req.file) {
      return fail(res, "No file uploaded", 400);
    }

    const shop_id = await resolveShopId(req.user);
    const user_id = req.user.user_id;

    if (!shop_id) {
      return fail(res, "No shop associated with your account", 400);
    }

    const fileData = {
      shop_id,
      user_id,
      file_type,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      storage_key: req.file.filename,
    };

    const file = await svc.uploadShopFile(fileData);

    return success(res, { file }, "File uploaded successfully");
  } catch (err) {
    console.error("shopFiles.upload", err);
    return fail(res, err.message || "Failed to upload file", 500);
  }
}

/**
 * GET /api/shop/files/rejected
 * Get all rejected files for the owner's shop
 */
export async function listRejectedController(req, res) {
  try {
    const shop_id = await resolveShopId(req.user);

    console.log("=== LIST REJECTED DEBUG ===");
    console.log("req.user:", JSON.stringify(req.user, null, 2));
    console.log("resolved shop_id:", shop_id);

    if (!shop_id) {
      console.log("❌ No shop_id found!");
      return fail(res, "Your account is not associated with a shop", 400);
    }

    const files = await svc.listRejectedFilesForShop(shop_id);

    console.log("📄 Found rejected files:", files.length);
    console.log("📄 Files:", JSON.stringify(files, null, 2));
    console.log("=== END DEBUG ===");

    return success(res, { files });
  } catch (err) {
    console.error("shopFiles.listRejected", err);
    return fail(res, "Failed to list rejected files", 500);
  }
}

/**
 * POST /api/shop/files/:file_id/resubmit
 * Owner resubmits a rejected file
 */
export async function resubmitController(req, res) {
  try {
    const shop_id = await resolveShopId(req.user);
    const { file_id } = req.params;
    const owner_message = req.body.owner_message || null;

    if (!shop_id) {
      return fail(res, "Your account is not associated with a shop", 400);
    }

    if (!req.file) {
      return fail(res, "No file uploaded", 400);
    }

    const fileData = {
      file_id,
      shop_id,
      storage_key: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      owner_message,
    };

    const updated = await svc.resubmitFile(fileData);

    return success(res, { file: updated }, "File resubmitted for review");
  } catch (err) {
    console.error("shopFiles.resubmit", err);
    if (err.code === "FORBIDDEN") {
      return fail(res, "You do not have permission to resubmit this file", 403);
    }
    if (err.code === "FILE_NOT_FOUND") {
      return fail(res, "File not found", 404);
    }
    return fail(res, "Failed to resubmit file", 500);
  }
}

/**
 * POST /api/shop/files/:file_id/message
 * Owner sends a message to admin about a file
 */
export async function messageController(req, res) {
  try {
    const shop_id = await resolveShopId(req.user);
    const { file_id } = req.params;
    const { message } = req.body;

    if (!shop_id) {
      return fail(res, "Your account is not associated with a shop", 400);
    }

    if (!message || !message.trim()) {
      return fail(res, "Message is required", 400);
    }

    await svc.ownerMessage({ file_id, shop_id, message });

    return success(res, {}, "Message sent to admin");
  } catch (err) {
    console.error("shopFiles.message", err);
    if (err.code === "FORBIDDEN") {
      return fail(
        res,
        "You do not have permission to message on this file",
        403
      );
    }
    return fail(res, "Failed to send message", 500);
  }
}
