// src/features/marketplace/types/marketplace.types.ts
//
// Re-export the canonical medicine types so feature code imports stay local
// (e.g. `import { EnrichedMedicine } from '../types/marketplace.types'`),
// mirroring the profile feature's local types convention.

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
  MedicineFeedParams,
} from "../../../types/medicine";