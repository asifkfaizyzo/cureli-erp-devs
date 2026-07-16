// src/types/medicine.ts
//
// Canonical types for the Cureli marketplace medicine discovery feature.
//
// Split into layers:
//   1. REAL       — shapes returned by GET /mobile/medicines* (catalog data).
//   2. FAKE       — frontend-generated marketplace decoration. Never from backend.
//   3. ENRICHED   — real variant merged with fake decoration.
//   4. SHOP ROW   — per-branch listing returned by GET /mobile/medicines/:id/shops.

// ── Composition ───────────────────────────────────────────────

export interface CompositionItem {
  name: string;
  strength?: string | null;
}

export type MedicineType = "DRUG" | "OTC";

// ── REAL: feed item ───────────────────────────────────────────

export interface MedicineVariant {
  variantId: string;
  skuId: string;
  name: string;
  brand: string | null;
  composition: CompositionItem[];
  strength: string | null;
  manufacturer: string | null;
  packSize: string | null;
  image: string | null;
  prescriptionRequired: boolean;
  form: string | null;
  category: string | null;
  genericName: string | null;
  type: MedicineType | null;
  availableNearYou?: boolean;
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

// ── REAL: single variant detail ───────────────────────────────

export interface MedicineVariantDetail extends MedicineVariant {
  marketer: string | null;
  description: string | null;
  images: string[];
  availableNearYou: boolean;
}

export interface MedicineDetailResponse {
  variant: MedicineVariantDetail;
  siblings: MedicineVariant[];
}

// ── REAL: category ────────────────────────────────────────────

export interface MedicineCategory {
  key: string;
  label: string;
  type: MedicineType;
  icon: string;
  count?: number;
}

export interface CategoriesResponse {
  categories: MedicineCategory[];
}

// ── FAKE: marketplace decoration (frontend-generated) ─────────
// Used only on feed/category screens and sibling rails.
// Never shown on the product detail screen — real shop data is used there.

export interface MarketplaceData {
  pharmacyCount: number;
  startsAt: number;
  etaMins: number;
  distanceKm: number;
  inStock: boolean;
  stockLabel: string;
}

// ── ENRICHED: what MedicineCard and feed rails render ─────────

export interface EnrichedMedicine extends MedicineVariant {
  marketplace: MarketplaceData;
}

// ── ENRICHED DETAIL: what the product detail screen renders ───

export interface EnrichedMedicineDetail extends EnrichedMedicine {
  marketer: string | null;
  description: string | null;
  images: string[];
  availableNearYou: boolean;
}

// ── Feed query params ─────────────────────────────────────────
//
// categories (new):
//   Array of primary_category values for multi-category filtering.
//   Used by the "English Medicine" top-level home card which bundles
//   all DRUG-type primary_category keys into a single browsable view.
//   Serialised to a comma-separated query string by marketplace.api.ts.
//   Cannot be combined with category — mutually exclusive.

export interface MedicineFeedParams {
  page?: number;
  limit?: number;
  type?: MedicineType;
  category?: string;
  categories?: string[];
  search?: string;
}

// ── REAL: per-branch shop listing for medicine detail screen ──
//
// Returned by GET /mobile/medicines/:variantId/shops.
// One row per branch (not per shop) — cart enforcement is branch-level.
// listingPrice is null when the shop has not set a marketplace price.

export interface MedicineShopListing {
  shopId: string;
  shopName: string;
  logoUrl: string | null;

  branchId: string;
  branchName: string | null;
  address: string | null;

  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;

  isOpen: boolean;
  is24Hours: boolean;
  openingTime: string | null;
  closingTime: string | null;

  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  contact: string | null;

  listingPrice: number | null;
  stockStatus: "IN_STOCK" | "LOW_STOCK";
  requiresPrescription: boolean;
}

export interface MedicineShopsResponse {
  shops: MedicineShopListing[];
}