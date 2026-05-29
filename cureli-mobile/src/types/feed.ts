// src/types/feed.ts
//
// Types for the home feed endpoint (GET /mobile/medicines/feed).
//
// The feed returns named sections — one per curated category that has
// at least one result. Each section contains real MedicineVariant items.
//
// EnrichedFeedSection is what useHomeFeed exposes to the UI — the
// medicines have been run through generateMarketplaceData() so every
// item has its marketplace decoration attached.

import type { MedicineVariant, EnrichedMedicine } from "./medicine";

// ── REAL: what the backend returns ───────────────────────────

export interface FeedSection {
  /** Internal primary_category key, e.g. "PAIN ANALGESICS". */
  key: string;
  /** Consumer-facing label, e.g. "Pain Relief". */
  title: string;
  /** Ionicons name, e.g. "bandage-outline". */
  icon: string;
  medicines: MedicineVariant[];
}

export interface HomeFeedResponse {
  sections: FeedSection[];
}

// ── ENRICHED: what useHomeFeed exposes to the UI ─────────────

export interface EnrichedFeedSection {
  key: string;
  title: string;
  icon: string;
  /** Each medicine has marketplace decoration attached. */
  medicines: EnrichedMedicine[];
}