// src/features/marketplace/constants/marketplace.constants.ts

export const MARKETPLACE_RANGES = {
  pharmacyCount: { min: 2, max: 6 },
  startsAt: { min: 29, max: 499 },
  etaMins: { min: 15, max: 45 },
  distanceKm: { min: 0.4, max: 3.2 },
} as const;

export const IN_STOCK_PROBABILITY = 0.9;

export const STOCK_LABELS = {
  inStock: "In Stock",
  limited: "Limited Stock",
} as const;

// ── Hero Carousel ─────────────────────────────────────────────
// Static slides for the home screen carousel.
// Set imageUrl to a CDN URL to show a real banner image.
// When imageUrl is null, the placeholderIcon is rendered instead.
//
// Gradients now use theme keys instead of hardcoded hex values.
// The PromoCard component resolves them at render time from
// the active color palette.

export interface HeroBannerSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaRoute: string;
  /** CDN image URL. null = show branded placeholder icon. */
  imageUrl: string | null;
  /** Ionicons name shown when imageUrl is null. */
  placeholderIcon: string;
  /**
   * Index into the hero gradient palette defined in colors.ts.
   * Each slide picks a different gradient pair from the theme.
   */
  gradientIndex: number;
}

export const HERO_BANNERS: HeroBannerSlide[] = [
  {
    id: "welcome",
    title: "Welcome to Cureli",
    subtitle: "Order medicines from trusted\npharmacies near you",
    ctaLabel: "Let's Start",
    ctaRoute: "/search",
    imageUrl: null,
    placeholderIcon: "medkit-outline",
    gradientIndex: 0,
  },
  {
    id: "fast-delivery",
    title: "Delivered in 10 Minutes",
    subtitle: "Nearby pharmacies fulfil\nyour order in real time",
    ctaLabel: "Order Now",
    ctaRoute: "/search",
    imageUrl: null,
    placeholderIcon: "bicycle-outline",
    gradientIndex: 1,
  },
  {
    id: "savings",
    title: "Save on Every Order",
    subtitle: "Compare prices across\npharmacies near you",
    ctaLabel: "Browse Medicines",
    ctaRoute: "/search",
    imageUrl: null,
    placeholderIcon: "pricetag-outline",
    gradientIndex: 2,
  },
];

export const HERO_CAROUSEL_HEIGHT = 180;
export const HERO_AUTO_SLIDE_INTERVAL_MS = 3500;

export const HEADER_HEIGHT = 172;