// src/features/marketplace/utils/generateMarketplaceData.ts
//
// DETERMINISTIC fake marketplace decoration.
//
// THE KEY REQUIREMENT: the same medicine must always produce the SAME
// pharmacy count / price / ETA / distance — across re-renders, scrolls, and
// refetches. If this were Math.random(), every FlatList recycle would change
// the numbers and the demo would look broken. So we seed a tiny PRNG from the
// variantId and derive every value from it.
//
// Nothing here touches the network or the backend. Pure function of the id.

import type { MarketplaceData } from "../types/marketplace.types";
import {
  MARKETPLACE_RANGES,
  IN_STOCK_PROBABILITY,
  STOCK_LABELS,
} from "../constants/marketplace.constants";

// ── Seeded PRNG ───────────────────────────────────────────────
// xmur3 produces a 32-bit seed from a string; mulberry32 is a fast,
// well-distributed PRNG. Together: deterministic [0,1) values from any string.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed: string): () => number {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}

// ── Range helpers ─────────────────────────────────────────────

function intIn(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function floatIn(
  rng: () => number,
  min: number,
  max: number,
  decimals = 1,
): number {
  const v = rng() * (max - min) + min;
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

// Round a price to a "nice" retail-looking value (…9 endings feel real).
function nicePrice(raw: number): number {
  if (raw <= 49) return Math.max(19, Math.round(raw / 10) * 10 - 1); // 19,29,39
  return Math.round(raw / 10) * 10 - 1; // 99, 149, 199, ...
}

// ── Public API ────────────────────────────────────────────────

/**
 * Generate deterministic fake marketplace data for a variant.
 *
 * @param seed  A stable identifier — pass variant.variantId (or skuId).
 * @returns     Marketplace decoration; identical for identical seeds.
 */
export function generateMarketplaceData(seed: string): MarketplaceData {
  const rng = makeRng(seed || "fallback-seed");

  const pharmacyCount = intIn(
    rng,
    MARKETPLACE_RANGES.pharmacyCount.min,
    MARKETPLACE_RANGES.pharmacyCount.max,
  );

  const startsAt = nicePrice(
    intIn(rng, MARKETPLACE_RANGES.startsAt.min, MARKETPLACE_RANGES.startsAt.max),
  );

  const etaMins = intIn(
    rng,
    MARKETPLACE_RANGES.etaMins.min,
    MARKETPLACE_RANGES.etaMins.max,
  );

  const distanceKm = floatIn(
    rng,
    MARKETPLACE_RANGES.distanceKm.min,
    MARKETPLACE_RANGES.distanceKm.max,
    1,
  );

  const inStock = rng() < IN_STOCK_PROBABILITY;

  return {
    pharmacyCount,
    startsAt,
    etaMins,
    distanceKm,
    inStock,
    stockLabel: inStock ? STOCK_LABELS.inStock : STOCK_LABELS.limited,
  };
}