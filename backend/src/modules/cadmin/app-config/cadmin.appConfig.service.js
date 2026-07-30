// backend/src/modules/cadmin/app-config/cadmin.appConfig.service.js
//
// Service layer for CAdmin App Config — category display overrides.
//
// Responsibilities:
//   - Merge registry with DB overrides for the CAdmin list view
//   - Upload image to S3 and upsert override row
//   - Delete image from S3 and clean up override row
//   - Toggle is_hidden on override row
//
// DB behaviour:
//   - A row is created on first image upload OR first hide action
//   - A row is deleted when image is removed AND is_hidden is false
//     (back to full default — no orphan rows)
//   - Upsert is used for all writes so duplicate-key errors are impossible

import prisma from "../../../config/prisma.js";
import {
  uploadFile,
  deleteFile,
} from "../../../services/fileStorage.service.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";
import {
  CATEGORY_KEY_REGISTRY,
  ALLOWED_CATEGORY_KEYS,
  CATEGORY_KEY_MAP,
} from "./categoryKeys.registry.js";

// ── Validation helper ─────────────────────────────────────────────────────────

/**
 * Throws a structured error if the key is not in the allowed registry.
 * @param {string} key
 */
function assertValidKey(key) {
  if (!ALLOWED_CATEGORY_KEYS.has(key)) {
    const err = new Error(`Unknown category key: "${key}"`);
    err.code = "INVALID_CATEGORY_KEY";
    err.status = 400;
    throw err;
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

/**
 * Returns all 12 registry entries merged with their current DB overrides.
 * Used by GET /cadmin/app-config/categories.
 *
 * @returns {Array<{
 *   key: string,
 *   label: string,
 *   scope: "curated"|"top_level",
 *   isHidden: boolean,
 *   hasImage: boolean,
 *   imageUrl: string|null,
 *   imageOriginalName: string|null,
 *   imageFileSize: number|null,
 *   updatedByName: string|null,
 *   updatedAt: Date|null,
 * }>}
 */
export async function listCategoryDisplayOverrides() {
  // Fetch all existing override rows in one query
  const rows = await prisma.marketplaceCategoryDisplayOverride.findMany();

  // Index by category_key for O(1) merge
  const rowByKey = Object.fromEntries(rows.map((r) => [r.category_key, r]));

  return CATEGORY_KEY_REGISTRY.map((entry) => {
    const row = rowByKey[entry.key] ?? null;

    const imageStorageKey = row?.image_storage_key ?? null;
    const imageUrl = imageStorageKey
      ? resolveAssetUrl(imageStorageKey)
      : null;

    return {
      key:               entry.key,
      label:             entry.label,
      scope:             entry.scope,
      isHidden:          row?.is_hidden ?? false,
      hasImage:          imageStorageKey !== null,
      imageUrl,
      imageOriginalName: row?.image_original_name ?? null,
      imageFileSize:     row?.image_file_size ?? null,
      updatedByName:     row?.updated_by_name ?? null,
      updatedAt:         row?.updated_at ?? null,
    };
  });
}

// ── Upload image ──────────────────────────────────────────────────────────────

/**
 * Upload or replace a category image.
 * Deletes the old S3 object if one already exists for this key.
 *
 * @param {string} categoryKey
 * @param {{ buffer, originalname, mimetype, size }} file  Multer file object
 * @param {{ cadminId: string, cadminName: string }} actor
 * @returns {{ imageUrl: string }}
 */
export async function uploadCategoryImage(categoryKey, file, actor) {
  assertValidKey(categoryKey);

  // Check if there is an existing image to delete first
  const existing = await prisma.marketplaceCategoryDisplayOverride.findUnique({
    where: { category_key: categoryKey },
    select: { image_storage_key: true },
  });

  if (existing?.image_storage_key) {
    // Best-effort delete — do not throw if S3 delete fails
    try {
      await deleteFile({
        folder: "category_images",
        filename: existing.image_storage_key.replace("category_images/", ""),
      });
    } catch (err) {
      console.warn(
        `[appConfig] Failed to delete old category image for "${categoryKey}":`,
        err.message
      );
    }
  }

  // Upload new file to S3
  const uploaded = await uploadFile({
    buffer:       file.buffer,
    folder:       "category_images",
    originalName: file.originalname,
    mimetype:     file.mimetype,
    size:         file.size,
  });

  // storage_key from uploadFile is filename only (e.g. "1234-abc.png")
  // We store the full S3 key path so resolveAssetUrl can build the CDN URL
  const fullStorageKey = `category_images/${uploaded.storage_key}`;

  // Upsert override row
  await prisma.marketplaceCategoryDisplayOverride.upsert({
    where:  { category_key: categoryKey },
    create: {
      category_key:        categoryKey,
      image_storage_key:   fullStorageKey,
      image_original_name: file.originalname,
      image_mime_type:     file.mimetype,
      image_file_size:     file.size,
      is_hidden:           false,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
    update: {
      image_storage_key:   fullStorageKey,
      image_original_name: file.originalname,
      image_mime_type:     file.mimetype,
      image_file_size:     file.size,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return {
    imageUrl: resolveAssetUrl(fullStorageKey),
  };
}

// ── Delete image ──────────────────────────────────────────────────────────────

/**
 * Remove a category image.
 * Falls back to icon rendering on mobile.
 * If the row has no other overrides (is_hidden = false), the row is deleted.
 *
 * @param {string} categoryKey
 * @param {{ cadminId: string, cadminName: string }} actor
 */
export async function deleteCategoryImage(categoryKey, actor) {
  assertValidKey(categoryKey);

  const row = await prisma.marketplaceCategoryDisplayOverride.findUnique({
    where: { category_key: categoryKey },
  });

  if (!row || !row.image_storage_key) {
    // Nothing to delete — idempotent
    return;
  }

  // Delete from S3
  try {
    await deleteFile({
      folder:   "category_images",
      filename: row.image_storage_key.replace("category_images/", ""),
    });
  } catch (err) {
    console.warn(
      `[appConfig] S3 delete failed for "${categoryKey}":`,
      err.message
    );
    // Do not throw — proceed to clear DB reference regardless
  }

  // If row has no remaining overrides, remove the row entirely
  if (!row.is_hidden) {
    await prisma.marketplaceCategoryDisplayOverride.delete({
      where: { category_key: categoryKey },
    });
    return;
  }

  // Row still has is_hidden = true — keep row, clear image fields only
  await prisma.marketplaceCategoryDisplayOverride.update({
    where: { category_key: categoryKey },
    data: {
      image_storage_key:   null,
      image_original_name: null,
      image_mime_type:     null,
      image_file_size:     null,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });
}

// ── Toggle visibility ─────────────────────────────────────────────────────────

/**
 * Show or hide a category on mobile.
 * Creates the override row if it does not exist yet.
 * Deletes the row if hiding is reversed AND no image is set.
 *
 * @param {string} categoryKey
 * @param {boolean} isHidden
 * @param {{ cadminId: string, cadminName: string }} actor
 * @returns {{ isHidden: boolean }}
 */
export async function setCategoryVisibility(categoryKey, isHidden, actor) {
  assertValidKey(categoryKey);

  if (typeof isHidden !== "boolean") {
    const err = new Error("isHidden must be a boolean");
    err.code = "VALIDATION_ERROR";
    err.status = 400;
    throw err;
  }

  // If un-hiding and no image exists, delete the row (back to full default)
  if (!isHidden) {
    const row = await prisma.marketplaceCategoryDisplayOverride.findUnique({
      where:  { category_key: categoryKey },
      select: { image_storage_key: true },
    });

    if (row && !row.image_storage_key) {
      await prisma.marketplaceCategoryDisplayOverride.delete({
        where: { category_key: categoryKey },
      });
      return { isHidden: false };
    }
  }

  // Upsert visibility
  await prisma.marketplaceCategoryDisplayOverride.upsert({
    where:  { category_key: categoryKey },
    create: {
      category_key:         categoryKey,
      is_hidden:            isHidden,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
    update: {
      is_hidden:            isHidden,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return { isHidden };
}

// ── Mobile helpers ────────────────────────────────────────────────────────────
// Used by mobile.appConfig.controller and mobile.medicines.controller
// to avoid duplicating the DB query + merge logic.

/**
 * Returns a map of category_key → { imageUrl, isHidden } for all rows that
 * have at least one override (image or hidden flag).
 * Keys with no row are absent from the map — callers treat absence as defaults.
 *
 * @returns {Record<string, { imageUrl: string|null, isHidden: boolean }>}
 */
export async function getCategoryOverrideMap() {
  const rows = await prisma.marketplaceCategoryDisplayOverride.findMany();

  return Object.fromEntries(
    rows.map((r) => [
      r.category_key,
      {
        imageUrl: r.image_storage_key
          ? resolveAssetUrl(r.image_storage_key)
          : null,
        isHidden: r.is_hidden,
      },
    ])
  );
}