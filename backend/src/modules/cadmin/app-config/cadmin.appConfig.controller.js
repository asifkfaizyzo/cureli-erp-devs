// backend/src/modules/cadmin/app-config/cadmin.appConfig.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  listCategoryDisplayOverrides,
  uploadCategoryImage,
  deleteCategoryImage,
  setCategoryVisibility,
} from "./cadmin.appConfig.service.js";
import { ALLOWED_CATEGORY_KEYS } from "./categoryKeys.registry.js";

// ── Helper — extract actor from CAdmin JWT payload ────────────────────────────
// req.cadmin is attached by requireCAdmin middleware.
// Shape confirmed from existing cadmin controllers.

function getActor(req) {
  return {
    cadminId:   req.cadmin?.cadmin_id ?? null,
    cadminName: req.cadmin?.name ?? req.cadmin?.username ?? "Unknown",
  };
}

// ── Helper — validate :key param ──────────────────────────────────────────────

function validateKey(req, res) {
  const key = decodeURIComponent(req.params.key ?? "");
  if (!ALLOWED_CATEGORY_KEYS.has(key)) {
    fail(res, `Unknown category key: "${key}"`, 400);
    return null;
  }
  return key;
}

// ── GET /cadmin/app-config/categories ─────────────────────────────────────────

export async function handleListCategories(req, res) {
  try {
    const categories = await listCategoryDisplayOverrides();
    return success(res, { categories }, "Category display overrides fetched");
  } catch (err) {
    console.error("[appConfig] list error:", err);
    return fail(res, "Failed to fetch category display overrides", 500);
  }
}

// ── POST /cadmin/app-config/categories/:key/image ─────────────────────────────

export async function handleUploadCategoryImage(req, res) {
  const key = validateKey(req, res);
  if (!key) return;

  if (!req.file) {
    return fail(res, "No file uploaded", 400);
  }

  try {
    const result = await uploadCategoryImage(key, req.file, getActor(req));
    return success(res, result, "Category image uploaded");
  } catch (err) {
    console.error("[appConfig] upload error:", err);

    if (err.code === "INVALID_MIME_TYPE") {
      return fail(res, err.message, 415);
    }
    if (err.code === "FILE_TOO_LARGE") {
      return fail(res, err.message, 413);
    }
    if (err.code === "INVALID_CATEGORY_KEY") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to upload category image", 500);
  }
}

// ── DELETE /cadmin/app-config/categories/:key/image ───────────────────────────

export async function handleDeleteCategoryImage(req, res) {
  const key = validateKey(req, res);
  if (!key) return;

  try {
    await deleteCategoryImage(key, getActor(req));
    return success(res, null, "Category image removed");
  } catch (err) {
    console.error("[appConfig] delete image error:", err);

    if (err.code === "INVALID_CATEGORY_KEY") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to remove category image", 500);
  }
}

// ── PATCH /cadmin/app-config/categories/:key/visibility ───────────────────────

export async function handleSetVisibility(req, res) {
  const key = validateKey(req, res);
  if (!key) return;

  const { isHidden } = req.body;

  if (typeof isHidden !== "boolean") {
    return fail(res, "isHidden must be a boolean", 400);
  }

  try {
    const result = await setCategoryVisibility(key, isHidden, getActor(req));
    return success(
      res,
      result,
      isHidden ? "Category hidden from mobile" : "Category visible on mobile"
    );
  } catch (err) {
    console.error("[appConfig] visibility error:", err);

    if (err.code === "INVALID_CATEGORY_KEY" || err.code === "VALIDATION_ERROR") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to update category visibility", 500);
  }
}