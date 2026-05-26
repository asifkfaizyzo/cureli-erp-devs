// src/features/marketplace/constants/marketplace.constants.ts
//
// Tunable ranges for the FAKE marketplace decoration generated per variant.
// Centralised so the showcase numbers can be tweaked in one place without
// touching the generator logic.
//
// All values here feed generateMarketplaceData(). None of this is real.

export const MARKETPLACE_RANGES = {
  pharmacyCount: { min: 2, max: 6 },
  /** "Starts at" price in INR. */
  startsAt: { min: 29, max: 499 },
  /** Estimated delivery in minutes. */
  etaMins: { min: 15, max: 45 },
  /** Distance to nearest pharmacy in km (one decimal). */
  distanceKm: { min: 0.4, max: 3.2 },
} as const;

/** Probability a variant is shown in stock (the rest show "Limited Stock"). */
export const IN_STOCK_PROBABILITY = 0.9;

export const STOCK_LABELS = {
  inStock: "In Stock",
  limited: "Limited Stock",
} as const;

/** Location label shown in the header — fake "near" location for the demo. */
export const DEMO_LOCATION = {
  area: "Kakkanad",
  addressLine: "Kochi, Kerala 682030",
} as const;