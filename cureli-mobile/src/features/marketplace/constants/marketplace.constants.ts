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

export interface HeroBannerSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaRoute: string;
  imageUrl: string | null;
  placeholderIcon: string;
  gradientIndex: number;
  // Custom gradient from cadmin — when present, overrides gradientIndex
  gradientColor1: string | null;
  gradientColor2: string | null;
  gradientAngle:  number | null;
  layoutMode: "FULL_IMAGE" | "TEXT_WITH_IMAGE";
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
    gradientColor1: null,
    gradientColor2: null,
    gradientAngle:  null,
    layoutMode: "TEXT_WITH_IMAGE",
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
    gradientColor1: null,
    gradientColor2: null,
    gradientAngle:  null,
    layoutMode: "TEXT_WITH_IMAGE",
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
    gradientColor1: null,
    gradientColor2: null,
    gradientAngle:  null,
    layoutMode: "TEXT_WITH_IMAGE",
  },
];

export const HERO_BANNER_ASPECT_RATIO = 2.04;
export const HERO_AUTO_SLIDE_INTERVAL_MS = 3500;
export const HEADER_HEIGHT = 172;