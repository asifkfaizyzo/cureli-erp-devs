// src/modules/mobile/medicines/mobile.medicines.schema.js
//
// Validation schemas for the PUBLIC mobile medicine discovery endpoints.
// Mirrors the style of mobile.users.schema.js — zod, trimmed, coerced.
//
// These endpoints are READ-ONLY and PUBLIC (no auth). Validation here is
// purely about sanitising query params so the Prisma layer receives safe,
// bounded values (e.g. capping limit, coercing page to a positive int).

import { z } from "zod";

// ── Shared primitives ─────────────────────────────────────────

const pageParam = z.coerce
  .number()
  .int()
  .min(1, { message: "page must be >= 1" })
  .default(1);

// Hard cap at 50 — this is a per-variant feed, we never want a mobile
// client pulling hundreds of rows in one request.
const limitParam = z.coerce
  .number()
  .int()
  .min(1)
  .max(50, { message: "limit must be <= 50" })
  .default(20);

const typeParam = z
  .enum(["DRUG", "OTC"], { errorMap: () => ({ message: "type must be DRUG or OTC" }) })
  .optional();

// Category is the INTERNAL primary_category string (e.g. "DERMA",
// "Ayurveda Products"). The frontend maps internal → friendly labels and
// sends the internal value back here. Free-form but length-bounded.
const categoryParam = z.string().trim().min(1).max(100).optional();

const searchParam = z.string().trim().min(1).max(100).optional();

// ── Feed (list) query ─────────────────────────────────────────

export const listMedicinesQuerySchema = z.object({
  page: pageParam,
  limit: limitParam,
  type: typeParam,
  category: categoryParam,
  search: searchParam,
});

// ── Single variant params ─────────────────────────────────────
// Accepts EITHER a variant UUID or a sku_id (e.g. "10005").
// The service does a dual lookup, mirroring the cadmin getMasterMedicineById
// pattern, so the mobile card can route by the stable skuId while the future
// detail screen can also resolve by variantId.

export const variantParamsSchema = z.object({
  variantId: z.string().trim().min(1).max(100),
});