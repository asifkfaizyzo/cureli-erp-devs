import { uploadShopFile } from "./shopFiles.service.js";
import { success, fail } from "../../utils/response.js";

export async function uploadShopFileController(req, res) {
  try {
    const { file_type } = req.body;

    if (!file_type) {
      return fail(res, "file_type is required", 400);
    }

    if (!req.file) {
      return fail(res, "No file uploaded", 400);
    }

    const fileData = {
      shop_id: req.user.shop_id,
      user_id: req.user.user_id,
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
