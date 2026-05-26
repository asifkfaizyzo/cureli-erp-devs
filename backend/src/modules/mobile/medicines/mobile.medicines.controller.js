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
  getMobileMedicine,
} from "./mobile.medicines.service.js";
import { CURATED_CATEGORIES } from "./mobile.medicines.categories.js";

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
// Static curated set (not a live groupBy) for predictable demo polish.
export async function handleListCategories(_req, res) {
  return success(res, { categories: CURATED_CATEGORIES }, "Categories fetched");
}

// ── GET /mobile/medicines/:variantId ──────────────────────────
// Accepts a sku_id or a variant UUID.
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