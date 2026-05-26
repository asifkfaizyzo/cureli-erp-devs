// src/features/marketplace/constants/categoryDisplay.ts
//
// Frontend display layer for marketplace categories.
// Backend owns category existence + label + icon.
// Frontend owns visual styling + optional category images.
//
// NOTE:
// Image sources are intentionally null for now until real assets/URLs are added.
// The UI falls back to the backend-provided Ionicons icon safely.

import type { ImageSourcePropType } from "react-native";

export type GradientPair = [string, string];

// Soft, brand-aligned gradients. Each is a [start, end] pair.
const CATEGORY_GRADIENTS: Record<string, GradientPair> = {
  "PAIN ANALGESICS": ["#6366f1", "#4338ca"],
  "ANTI DIABETIC": ["#0ea5e9", "#2563eb"],
  CARDIAC: ["#f472b6", "#db2777"],
  RESPIRATORY: ["#38bdf8", "#0284c7"],
  DERMA: ["#a78bfa", "#7c3aed"],
  "GASTRO INTESTINAL": ["#34d399", "#059669"],
  "Vitamins & Nutrition": ["#fbbf24", "#f59e0b"],
  "Ayurveda Products": ["#4ade80", "#16a34a"],
  "Baby Care": ["#fda4af", "#fb7185"],
  "Personal Care Products": ["#818cf8", "#6366f1"],
};

const DEFAULT_GRADIENT: GradientPair = ["#6366f1", "#4338ca"];

// ── Optional category images ──────────────────────────────────
// Replace nulls with require(...) or { uri: "..." } later.
//
// Example:
// DERMA: require("../../../../assets/categories/derma.png")
// or
// DERMA: { uri: "https://cdn..." }

export type CategoryImageSource = ImageSourcePropType | null;

const CATEGORY_IMAGES: Record<string, CategoryImageSource> = {
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
};

export function getCategoryGradient(key: string): GradientPair {
  return CATEGORY_GRADIENTS[key] ?? DEFAULT_GRADIENT;
}

export function getCategoryAccent(key: string): string {
  return (CATEGORY_GRADIENTS[key] ?? DEFAULT_GRADIENT)[0];
}

export function getCategoryImage(key: string): CategoryImageSource {
  return CATEGORY_IMAGES[key] ?? null;
}