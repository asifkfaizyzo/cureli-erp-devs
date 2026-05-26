// src/types/medicine.ts
//
// Canonical types for the Cureli marketplace medicine discovery feature.
//
// Split into two layers:
//   1. REAL  — shapes returned by GET /mobile/medicines* (catalog data).
//   2. FAKE  — frontend-generated marketplace decoration (pharmacy count,
//              price, ETA, distance, stock). Never comes from the backend.
//   3. ENRICHED — a real variant merged with its fake decoration; this is
//                 what the MedicineCard renders.

// ── Composition ───────────────────────────────────────────────
// variant.composition is a JSON array of { name, strength } from the catalog.

export interface CompositionItem {
  name: string;
  strength?: string | null;
}

export type MedicineType = "DRUG" | "OTC";

// ── REAL: feed item (GET /mobile/medicines) ───────────────────

export interface MedicineVariant {
  variantId: string;
  skuId: string;
  name: string;
  brand: string | null;
  composition: CompositionItem[];
  strength: string | null;
  manufacturer: string | null;
  packSize: string | null;
  /** First resolved CDN image URL, or null → frontend shows a placeholder. */
  image: string | null;
  // ── from master ──
  prescriptionRequired: boolean;
  form: string | null;
  /** Internal primary_category code, e.g. "DERMA" or "Ayurveda Products". */
  category: string | null;
  genericName: string | null;
  type: MedicineType | null;
}

// ── REAL: pagination meta ─────────────────────────────────────

export interface MarketplaceMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MedicineFeedResponse {
  medicines: MedicineVariant[];
  meta: MarketplaceMeta;
}

// ── REAL: single variant detail (GET /mobile/medicines/:id) ───

export interface MedicineVariantDetail extends MedicineVariant {
  marketer: string | null;
  description: string | null;
  /** Full resolved gallery (all images), not just the first. */
  images: string[];
}

export interface MedicineDetailResponse {
  variant: MedicineVariantDetail;
  siblings: MedicineVariant[];
}

// ── REAL: category (GET /mobile/medicines/categories) ─────────
// Backend curated list. `key` is the internal primary_category to filter by.

export interface MedicineCategory {
  key: string;
  label: string;
  type: MedicineType;
  /** Ionicons name. */
  icon: string;
  count?: number;
}

export interface CategoriesResponse {
  categories: MedicineCategory[];
}

// ── FAKE: marketplace decoration (frontend-generated) ─────────

export interface MarketplaceData {
  /** Number of nearby pharmacies stocking this medicine (fake). */
  pharmacyCount: number;
  /** Lowest "starts at" price in INR (fake). */
  startsAt: number;
  /** Estimated delivery time in minutes (fake). */
  etaMins: number;
  /** Distance to nearest pharmacy in km (fake). */
  distanceKm: number;
  /** Whether shown as in stock (fake; mostly true). */
  inStock: boolean;
  /** Human stock label, e.g. "In Stock" / "Limited Stock". */
  stockLabel: string;
}

// ── ENRICHED: what MedicineCard renders ───────────────────────

export interface EnrichedMedicine extends MedicineVariant {
  marketplace: MarketplaceData;
}

// ── Feed query params ─────────────────────────────────────────

export interface MedicineFeedParams {
  page?: number;
  limit?: number;
  type?: MedicineType;
  /** Internal category key (from MedicineCategory.key). */
  category?: string;
  search?: string;
}