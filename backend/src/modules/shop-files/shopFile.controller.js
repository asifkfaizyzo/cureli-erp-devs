import { ALLOWED_FILE_TYPES } from "./fileTypes.js";
import { saveShopFile } from "./shopFile.service.js";
import { success, fail } from "../../utils/response.js";

export async function uploadSingleFile(req, res) {
  try {
    const file_type = req.params.file_type;

    if (!ALLOWED_FILE_TYPES.includes(file_type)) {
      return fail(res, "Invalid document type", 400);
    }

    if (!req.file) {
      return fail(res, "No file uploaded", 400);
    }

    const { user_id, shop_id } = req.user;

    const saved = await saveShopFile({
      shop_id,
      user_id,
      file: req.file,
      file_type,
    });

    return success(res, { file: saved }, "File uploaded");
  } catch (err) {
    console.error(err);
    return fail(res, "Upload failed", 500, { error: err.message });
  }
}
