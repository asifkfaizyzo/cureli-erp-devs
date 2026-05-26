// src/features/marketplace/constants/categoryDisplay.ts
//
// Frontend display layer for the Quick Categories rail.
//
// The BACKEND (/mobile/medicines/categories) is the source of truth for which
// categories exist, their internal `key`, friendly `label`, Ionicons `icon`,
// and indicative `count`. This file adds the one thing the backend shouldn't
// own: VISUAL styling (gradient pairs) keyed by category `key`.
//
// Usage:
//   const grad = getCategoryGradient(category.key);
//   // -> ['#6366f1', '#4338ca']  (start, end) for a LinearGradient
//
// Gradients are tuned to the brand (deep indigo / purple) and kept soft —
// premium healthcare, not loud ecommerce. A sensible default is returned for
// any key not explicitly listed, so adding backend categories never crashes
// the UI.

export type GradientPair = [string, string];

// Soft, brand-aligned gradients. Each is a [start, end] pair.
const CATEGORY_GRADIENTS: Record<string, GradientPair> = {
  // ── DRUG keys ──
  "PAIN ANALGESICS": ["#6366f1", "#4338ca"],
  "ANTI DIABETIC": ["#0ea5e9", "#2563eb"],
  CARDIAC: ["#f472b6", "#db2777"],
  RESPIRATORY: ["#38bdf8", "#0284c7"],
  DERMA: ["#a78bfa", "#7c3aed"],
  "GASTRO INTESTINAL": ["#34d399", "#059669"],

  // ── OTC keys ──
  "Vitamins & Nutrition": ["#fbbf24", "#f59e0b"],
  "Ayurveda Products": ["#4ade80", "#16a34a"],
  "Baby Care": ["#fda4af", "#fb7185"],
  "Personal Care Products": ["#818cf8", "#6366f1"],
};

// Brand-default gradient for any unmapped category key.
const DEFAULT_GRADIENT: GradientPair = ["#6366f1", "#4338ca"];

export function getCategoryGradient(key: string): GradientPair {
  return CATEGORY_GRADIENTS[key] ?? DEFAULT_GRADIENT;
}

// A soft tint background (used behind the icon chip) derived from the gradient
// start. Kept as a separate, low-opacity overlay handled in the component via
// the theme; exposed here only if a component wants the raw start color.
export function getCategoryAccent(key: string): string {
  return (CATEGORY_GRADIENTS[key] ?? DEFAULT_GRADIENT)[0];
}