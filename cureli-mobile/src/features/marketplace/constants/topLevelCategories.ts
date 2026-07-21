// src/features/marketplace/constants/topLevelCategories.ts
//
// Defines the three top-level "hero" categories shown on the home screen.
//
// These are NOT backend-driven. They are hardcoded UI entry points that
// map to real primary_category values in the DB.
//
// ENGLISH_MEDICINE:
//   A virtual frontend-only key. Has no matching primary_category row.
//   When the user taps it, CategoryScreen detects this key and passes
//   ENGLISH_MEDICINE_CATEGORIES (the full list of DRUG-type keys) to
//   useMedicineFeed as a categories[] array instead of a single category.
//
// AYURVEDIC:
//   Maps directly to the real primary_category "Ayurveda Products".
//   Routed as a normal single-category filter.
//
// VETERINARY:
//   Maps directly to the real primary_category "Pet Care".
//   Routed as a normal single-category filter.
//
// ENGLISH_MEDICINE_CATEGORIES:
//   The exhaustive list of DRUG-type primary_category values from the
//   CCSP scrape. Used as the IN filter for the English Medicine view.
//   Keys must exactly match what is stored in master_medicines.primary_category.

import type { MedicineCategory } from "../types/marketplace.types";

// ── Virtual key for English Medicine ─────────────────────────
// Not a real DB primary_category. Detected by CategoryScreen to
// trigger multi-category filtering via ENGLISH_MEDICINE_CATEGORIES.

export const ENGLISH_MEDICINE_KEY = "ENGLISH_MEDICINE";

// ── All DRUG-type primary_category values from the catalog ────
// These are the exact strings stored in master_medicines.primary_category
// as seeded by the CCSP scraper. Case must match exactly.

export const ENGLISH_MEDICINE_CATEGORIES: string[] = [
  "ANTI INFECTIVES",
  "GASTRO INTESTINAL",
  "PAIN ANALGESICS",
  "NEURO CNS",
  "RESPIRATORY",
  "CARDIAC",
  "ANTI DIABETIC",
  "DERMA",
  "HORMONES",
  "VITAMINS MINERALS NUTRIENTS",
  "OPHTHAL",
  "GYNAECOLOGICAL",
  "BLOOD RELATED",
  "ANTI NEOPLASTICS",
  "UROLOGY",
  "ANTI MALARIALS",
  "OPHTHAL OTOLOGICALS",
  "SEX STIMULANTS REJUVENATORS",
  "STOMATOLOGICALS",
  "OTOLOGICALS",
  "OTHERS",
  "VACCINES",
];

// ── Top-level category definitions ───────────────────────────
// Shape matches MedicineCategory so CategoryCard can render them
// directly without any special casing in the card component itself.
// The card is unaware of whether a key is virtual or real.

export const TOP_LEVEL_CATEGORIES: MedicineCategory[] = [
  {
    key: ENGLISH_MEDICINE_KEY,
    label: "English Medicine",
    type: "DRUG",
    icon: "medical-outline",
  },
  {
    key: "Ayurveda Products",
    label: "Ayurvedic",
    type: "OTC",
    icon: "leaf-outline",
  },
  {
    key: "Pet Care",
    label: "Pet Care",
    type: "OTC",
    icon: "paw-outline",
  },
];