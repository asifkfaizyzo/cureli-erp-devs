// backend/src/modules/loyalty/loyalty.config.service.js
//
// Service layer for the LoyaltyConfig singleton.
// Follows the exact same pattern as getConfig() in mobile.checkout.service.js:
//   - Single row in DB, upserted on update
//   - In-memory cache with version-based invalidation
//   - Auto-creates the row with defaults on first read
//
// Responsibilities:
//   - getLoyaltyConfig()     → cached read, auto-seeds if missing
//   - updateLoyaltyConfig()  → validate + upsert + invalidate cache
//   - getLoyaltyConfigForMobile() → normalised config for mobile endpoint

import prisma from "../../config/prisma.js";
import { normaliseLoyaltyConfig } from "./loyalty.engine.js";

// ─────────────────────────────────────────────────────────────────────────────
// CACHE (same pattern as checkout service)
// ─────────────────────────────────────────────────────────────────────────────

let _configCache = null;
let _configVersion = null;

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULTS (used when seeding the singleton for the first time)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  is_enabled: false,
  earn_rate_amount: 100,
  earn_basis: "SUBTOTAL",
  redemption_value: 1,
  min_redeem_points: 50,
  min_order_amount: 299,
  max_redeem_points: null,
  max_redeem_percent: null,
  points_expiry_days: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RULES
// ─────────────────────────────────────────────────────────────────────────────

const VALIDATION_RULES = {
  is_enabled: (v) => typeof v === "boolean" || "is_enabled must be a boolean",

  earn_rate_amount: (v) =>
    (typeof v === "number" && v > 0) || "earn_rate_amount must be a positive number",

  earn_basis: (v) =>
    v === "SUBTOTAL" || "earn_basis must be 'SUBTOTAL'",

  redemption_value: (v) =>
    (typeof v === "number" && v > 0) || "redemption_value must be a positive number",

  min_redeem_points: (v) =>
    (Number.isInteger(v) && v >= 1) || "min_redeem_points must be a positive integer",

  min_order_amount: (v) =>
    (typeof v === "number" && v >= 0) || "min_order_amount must be a non-negative number",

  max_redeem_points: (v) =>
    v === null || v === undefined || (Number.isInteger(v) && v >= 1)
      ? true
      : "max_redeem_points must be null or a positive integer",

  max_redeem_percent: (v) =>
    v === null || v === undefined || (typeof v === "number" && v > 0 && v <= 100)
      ? true
      : "max_redeem_percent must be null or a number between 0 and 100",

  points_expiry_days: (v) =>
    v === null || v === undefined || (Number.isInteger(v) && v >= 1)
      ? true
      : "points_expiry_days must be null or a positive integer",
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CONFIG (cached)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the normalised loyalty config.
 * Auto-creates the singleton row with defaults if it doesn't exist yet.
 * Cached in memory — invalidated when version changes (i.e., after an update).
 *
 * @returns {import("./loyalty.engine.js").LoyaltyConfigInput}
 */
export async function getLoyaltyConfig() {
  let row = await prisma.loyaltyConfig.findFirst();

  // Auto-seed on first access
  if (!row) {
    row = await prisma.loyaltyConfig.create({
      data: DEFAULTS,
    });
  }

  const version = row.version;
  if (_configVersion !== version || !_configCache) {
    _configCache = normaliseLoyaltyConfig(row);
    _configVersion = version;
  }

  return _configCache;
}

/**
 * Returns the raw DB row (for CAdmin display with all fields including audit).
 * Not cached — CAdmin reads are infrequent.
 */
export async function getLoyaltyConfigRaw() {
  let row = await prisma.loyaltyConfig.findFirst();

  if (!row) {
    row = await prisma.loyaltyConfig.create({
      data: DEFAULTS,
    });
  }

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update the loyalty config singleton.
 * Validates all provided fields, upserts the row, increments version,
 * and invalidates the in-memory cache.
 *
 * @param {Object} updates - partial config fields to update
 * @param {{ cadminId: string, cadminName: string }} actor
 * @returns {Object} the updated raw config row
 */
export async function updateLoyaltyConfig(updates, actor) {
  // ── 1. Validate keys ───────────────────────────────────────
  const allowedKeys = new Set(Object.keys(VALIDATION_RULES));

  for (const key of Object.keys(updates)) {
    if (!allowedKeys.has(key)) {
      const err = new Error(`Unknown loyalty config key: "${key}"`);
      err.code = "VALIDATION_ERROR";
      err.status = 400;
      throw err;
    }
  }

  // ── 2. Validate values ─────────────────────────────────────
  for (const [key, value] of Object.entries(updates)) {
    const rule = VALIDATION_RULES[key];
    const result = rule(value);

    if (result !== true) {
      const err = new Error(result);
      err.code = "VALIDATION_ERROR";
      err.status = 400;
      throw err;
    }
  }

  // ── 3. Cross-field validation ──────────────────────────────
  // If both max_redeem_points and max_redeem_percent are being set,
  // ensure they don't contradict each other (informational only — both can coexist)

  // ── 4. Upsert ──────────────────────────────────────────────
  const existing = await prisma.loyaltyConfig.findFirst();

  const data = {
    ...updates,
    updated_by_cadmin_id: actor.cadminId,
    updated_by_name: actor.cadminName,
  };

  let row;

  if (existing) {
    row = await prisma.loyaltyConfig.update({
      where: { config_id: existing.config_id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  } else {
    row = await prisma.loyaltyConfig.create({
      data: {
        ...DEFAULTS,
        ...data,
        version: 1,
      },
    });
  }

  // ── 5. Invalidate cache ────────────────────────────────────
  _configCache = null;
  _configVersion = null;

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a mobile-friendly version of the loyalty config.
 * Strips internal fields, returns only what the app needs.
 *
 * @returns {Object}
 */
export async function getLoyaltyConfigForMobile() {
  const config = await getLoyaltyConfig();

  return {
    isEnabled: config.is_enabled,
    earnRateAmount: config.earn_rate_amount,
    redemptionValue: config.redemption_value,
    minRedeemPoints: config.min_redeem_points,
    minOrderAmount: config.min_order_amount,
    maxRedeemPoints: config.max_redeem_points,
    maxRedeemPercent: config.max_redeem_percent,
    pointsExpiryDays: config.points_expiry_days,
  };
}