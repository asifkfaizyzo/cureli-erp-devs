import { uploadShopFile } from "./shopFiles.service.js";
import { success, fail } from "../../utils/response.js";
import * as svc from "./shopFiles.service.js";


export async function uploadShopFileController(req, res) {
  try {
    const { file_type } = req.body;

    if (!file_type) {
      return fail(res, "file_type is required", 400);
    }

    if (!req.file) {
      return fail(res, "No file uploaded", 400);
    }

    // requireAuth already sets req.user with user_id & shop_id
    const shop_id = req.user.shop_id;
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

    const file = await uploadShopFile(fileData);

    return success(res, { file }, "File uploaded successfully");
  } catch (err) {
    console.error(err);
    return fail(res, err.message || "Failed to upload file", 500);
  }
}

export async function listRejectedController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    if (!shop_id) return fail(res, "Your account is not associated with a shop", 400);

    const files = await svc.listRejectedFilesForShop(shop_id);
    return success(res, { files });
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to list rejected files", 500);
  }
}

/**
 * POST /shop/files/:file_id/resubmit
 * multipart/form-data with "file" and optional owner_message
 */
export async function resubmitController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const user_id = req.user.user_id;
    const { file_id } = req.params;
    const owner_message = req.body.owner_message || null;

    if (!req.file) return fail(res, "No file uploaded", 400);

    // Optionally cleanup old file from disk here (you already have cleanup util)
    const old = await prisma.shopFile.findUnique({ where: { file_id } });
    cleanup.deleteStorageKey(old.storage_key);

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

    return success(res, { file: updated }, "File resubmitted");
  } catch (err) {
    console.error(err);
    if (err.code === "FORBIDDEN") return fail(res, "Forbidden", 403);
    if (err.code === "FILE_NOT_FOUND") return fail(res, "File not found", 404);
    return fail(res, "Failed to resubmit file", 500);
  }
}

/**
 * POST /shop/files/:file_id/message
 * Body: { message }
 */
export async function messageController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const { file_id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) return fail(res, "Message required", 400);

    await svc.ownerMessage({ file_id, shop_id, message });

    return success(res, {}, "Message sent to admin");
  } catch (err) {
    console.error(err);
    if (err.code === "FORBIDDEN") return fail(res, "Forbidden", 403);
    return fail(res, "Failed to send message", 500);
  }
}