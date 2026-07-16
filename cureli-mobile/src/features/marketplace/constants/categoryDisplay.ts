// src/features/marketplace/constants/categoryDisplay.ts
//
// Frontend display layer for marketplace categories.
// Backend owns category existence + label + icon.
// Frontend owns visual styling + optional category images.
//
// Includes entries for:
//   - All original CURATED_CATEGORIES keys
//   - The three top-level home card keys:
//       ENGLISH_MEDICINE (virtual frontend key)
//       Ayurveda Products (also in curated list)
//       Pet Care (OTC catalog key)
//
// NOTE:
// Image sources are intentionally null for now until real assets are added.
// The UI falls back to the backend-provided Ionicons icon safely.

import type { ImageSourcePropType } from "react-native";

export type GradientPair = [string, string];

// ── Accent colours ────────────────────────────────────────────
// Each value is a [start, end] gradient pair.
// The accent (start colour) is also used as the icon tint and
// selected border colour in CategoryCard.

const CATEGORY_GRADIENTS: Record<string, GradientPair> = {
  // ── Original curated DRUG categories ──────────────────────
  "PAIN ANALGESICS": ["#6366f1", "#4338ca"],
  "ANTI DIABETIC": ["#0ea5e9", "#2563eb"],
  CARDIAC: ["#f472b6", "#db2777"],
  RESPIRATORY: ["#38bdf8", "#0284c7"],
  DERMA: ["#a78bfa", "#7c3aed"],
  "GASTRO INTESTINAL": ["#34d399", "#059669"],

  // ── Original curated OTC categories ───────────────────────
  "Vitamins & Nutrition": ["#fbbf24", "#f59e0b"],
  "Ayurveda Products": ["#4ade80", "#16a34a"],
  "Baby Care": ["#fda4af", "#fb7185"],
  "Personal Care Products": ["#818cf8", "#6366f1"],

  // ── Top-level home card keys ──────────────────────────────
  // ENGLISH_MEDICINE is a virtual frontend key — never sent to the DB.
  // It gets a distinct indigo/blue accent to feel authoritative.
  ENGLISH_MEDICINE: ["#4f46e5", "#3730a3"],

  // Pet Care — warm amber to feel friendly and approachable.
  "Pet Care": ["#f59e0b", "#d97706"],
};

const DEFAULT_GRADIENT: GradientPair = ["#6366f1", "#4338ca"];

// ── Optional category images ──────────────────────────────────
// Replace nulls with require(...) or { uri: "..." } when assets exist.
//
// Example:
//   ENGLISH_MEDICINE: require("../../../../assets/categories/english-medicine.png")
//   "Pet Care": require("../../../../assets/categories/pet-care.png")

export type CategoryImageSource = ImageSourcePropType | null;

const CATEGORY_IMAGES: Record<string, CategoryImageSource> = {
  // Original curated categories
  "PAIN ANALGESICS": null,
  "ANTI DIABETIC": null,
  CARDIAC: null,
  RESPIRATORY: null,
  DERMA: null,
  "GASTRO INTESTINAL": null,
  "Vitamins & Nutrition": null,
  "Ayurveda Products": null,
  "Baby Care": null,
  "Personal Care Products": null,

  // Top-level home card keys
  ENGLISH_MEDICINE: null,
  "Pet Care": null,
};

// ── Exported helpers ──────────────────────────────────────────

export function getCategoryGradient(key: string): GradientPair {
  return CATEGORY_GRADIENTS[key] ?? DEFAULT_GRADIENT;
}

export function getCategoryAccent(key: string): string {
  return (CATEGORY_GRADIENTS[key] ?? DEFAULT_GRADIENT)[0];
}

export function getCategoryImage(key: string): CategoryImageSource {
  return CATEGORY_IMAGES[key] ?? null;
}