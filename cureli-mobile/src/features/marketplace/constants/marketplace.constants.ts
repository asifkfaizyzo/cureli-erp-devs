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

// ── Hero Carousel ─────────────────────────────────────────────
// Static slides for the home screen carousel.
// Set imageUrl to a CDN URL to show a real banner image.
// When imageUrl is null, the placeholderIcon is rendered instead.
// gradient: [start, end] — diagonal gradient on the card background.

export interface HeroBannerSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaRoute: string;
  /** CDN image URL. null = show branded placeholder icon. */
  imageUrl: string | null;
  gradient: [string, string];
  /** Ionicons name shown when imageUrl is null. */
  placeholderIcon: string;
}

export const HERO_BANNERS: HeroBannerSlide[] = [
  {
    id: "welcome",
    title: "Welcome to Cureli",
    subtitle: "Order medicines from trusted\npharmacies near you",
    ctaLabel: "Let's Start",
    ctaRoute: "/search",
    imageUrl: null,
    gradient: ["#05015A", "#3b2fd4"],
    placeholderIcon: "medkit-outline",
  },
  {
    id: "fast-delivery",
    title: "Delivered in 10 Minutes",
    subtitle: "Nearby pharmacies fulfil\nyour order in real time",
    ctaLabel: "Order Now",
    ctaRoute: "/search",
    imageUrl: null,
    gradient: ["#0a0280", "#6366f1"],
    placeholderIcon: "bicycle-outline",
  },
  {
    id: "prescription",
    title: "Have a Prescription?",
    subtitle: "Upload once and we handle\nthe rest for you",
    ctaLabel: "Upload Now",
    ctaRoute: "/prescription/upload",
    imageUrl: null,
    gradient: ["#16044d", "#7c3aed"],
    placeholderIcon: "document-text-outline",
  },
];

export const HERO_CAROUSEL_HEIGHT = 180;
export const HERO_AUTO_SLIDE_INTERVAL_MS = 3500;

export const HEADER_HEIGHT = 172;
