// src/features/marketplace/types/marketplace.types.ts
//
// Re-export the canonical medicine types so feature code imports stay local.

export type {
  CompositionItem,
  MedicineType,
  MedicineVariant,
  MarketplaceMeta,
  MedicineFeedResponse,
  MedicineVariantDetail,
  MedicineDetailResponse,
  MedicineCategory,
  CategoriesResponse,
  MarketplaceData,
  EnrichedMedicine,
  EnrichedMedicineDetail,
  MedicineFeedParams,
  MedicineShopListing,
  MedicineShopsResponse,
} from "../../../types/medicine";

export type {
  FeedSection,
  HomeFeedResponse,
  EnrichedFeedSection,
} from "../../../types/feed";

// ── Display config ─────────────────────────────────────────────────────────
// Re-exported from src/types/medicine.ts for convenience.
export type {
  CategoryDisplayOverride,
  MarketplaceDisplayResponse,
} from "../../../types/medicine";