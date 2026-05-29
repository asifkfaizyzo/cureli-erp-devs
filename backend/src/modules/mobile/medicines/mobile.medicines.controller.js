// src/modules/mobile/medicines/mobile.medicines.controller.js
//
// PUBLIC mobile medicine discovery — controllers.
//
// These parse and validate req.query / req.params with zod directly (see the
// note in mobile.medicines.routes.js explaining why we don't use the shared
// `validate` middleware here). On a validation failure we return a clean 400
// via the shared fail() envelope rather than throwing.

import { success, fail } from "../../../utils/response.js";
import {
  listMedicinesQuerySchema,
  variantParamsSchema,
} from "./mobile.medicines.schema.js";
import {
  listMobileMedicines,
  listMobileFeed,
  getMobileMedicine,
} from "./mobile.medicines.service.js";
import { CURATED_CATEGORIES } from "./mobile.medicines.categories.js";

// ── GET /mobile/medicines/feed ────────────────────────────────
//
// Returns the complete home feed — one section per curated category
// that has at least one result. No query params — the feed is not
// filtered at the home screen level.
//
// The feed mode (demo vs production) is determined by the
// MOBILE_SHOW_UNLISTED_MEDICINES env flag, read once at service
// module load. The controller is unaware of which mode is active.
export async function handleGetFeed(_req, res) {
  try {
    const result = await listMobileFeed(8);
    return success(res, result, "Feed fetched");
  } catch (err) {
    console.error("[mobile.medicines] feed error:", err);
    return fail(res, "Failed to fetch feed", 500);
  }
}

// ── GET /mobile/medicines ─────────────────────────────────────
export async function handleListMedicines(req, res) {
  const parsed = listMedicinesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message || "Invalid query parameters";
    return fail(res, msg, 400);
  }

  try {
    const result = await listMobileMedicines(parsed.data);
    return success(res, result, "Medicines fetched");
  } catch (err) {
    console.error("[mobile.medicines] list error:", err);
    return fail(res, "Failed to fetch medicines", 500);
  }
}

// ── GET /mobile/medicines/categories ──────────────────────────
// Curated, display-ready category list driving the Quick Categories rail.
// Static curated set — not a live groupBy — for predictable demo polish.
export async function handleListCategories(_req, res) {
  return success(res, { categories: CURATED_CATEGORIES }, "Categories fetched");
}

// ── GET /mobile/medicines/:variantId ──────────────────────────
// Accepts a sku_id or a variant UUID.
// Returns the variant with availableNearYou: boolean.
// Never returns 404 for a known variant — the frontend disables
// order actions when availableNearYou is false.
export async function handleGetMedicine(req, res) {
  const parsed = variantParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return fail(res, "Invalid medicine identifier", 400);
  }

  try {
    const result = await getMobileMedicine(parsed.data.variantId);
    if (!result) {
      return fail(res, "Medicine not found", 404);
    }
    return success(res, result, "Medicine fetched");
  } catch (err) {
    console.error("[mobile.medicines] detail error:", err);
    return fail(res, "Failed to fetch medicine", 500);
  }
}