// backend/src/modules/mobile/app-config/mobile.appConfig.controller.js
//
// Public mobile endpoint for top-level category display overrides.
//
// GET /mobile/app-config/marketplace-display
//
// Returns a map of category_key → { imageUrl, isHidden } for all
// top-level category keys defined in CATEGORY_KEY_REGISTRY.
//
// The mobile app uses this to:
//   - Show/hide hero cards on the home screen top row
//   - Render remote images on top-level category cards
//
// Only top-level scoped keys are included in this response.
// Curated category overrides are served via /mobile/medicines/categories.
//
// Response shape:
// {
//   "overrides": {
//     "ENGLISH_MEDICINE":    { "imageUrl": "https://cdn.../...", "isHidden": false },
//     "Ayurveda Products":   { "imageUrl": null,                 "isHidden": false },
//     "Pet Care":            { "imageUrl": "https://cdn.../...", "isHidden": false }
//   }
// }
//
// All 3 top-level keys are always present in the response, even when
// no DB row exists (defaults: imageUrl = null, isHidden = false).
// This guarantees the mobile app never needs to handle missing keys.

import { success, fail } from "../../../utils/response.js";
import { getCategoryOverrideMap } from "../../cadmin/app-config/cadmin.appConfig.service.js";
import { CATEGORY_KEY_REGISTRY } from "../../cadmin/app-config/categoryKeys.registry.js";

// Pre-compute the top-level keys once at module load
const TOP_LEVEL_KEYS = CATEGORY_KEY_REGISTRY
  .filter((entry) => entry.scope === "top_level")
  .map((entry) => entry.key);

// ── GET /mobile/app-config/marketplace-display ────────────────

export async function handleGetMarketplaceDisplay(_req, res) {
  try {
    const overrideMap = await getCategoryOverrideMap();

    // Build response — all top-level keys always present
    const overrides = Object.fromEntries(
      TOP_LEVEL_KEYS.map((key) => {
        const override = overrideMap[key];
        return [
          key,
          {
            imageUrl: override?.imageUrl ?? null,
            isHidden: override?.isHidden ?? false,
          },
        ];
      })
    );

    return success(res, { overrides }, "Marketplace display config fetched");
  } catch (err) {
    console.error("[mobile.appConfig] marketplace display error:", err);
    return fail(res, "Failed to fetch marketplace display config", 500);
  }
}