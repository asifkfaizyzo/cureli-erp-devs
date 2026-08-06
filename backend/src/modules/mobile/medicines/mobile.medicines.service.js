// src/modules/mobile/medicines/mobile.medicines.service.js
//
// PUBLIC mobile medicine discovery — service layer.
//
// FEED MODE
// ─────────
// MOBILE_SHOW_UNLISTED_MEDICINES=true  (demo / dev)
//   → Queries MasterMedicineVariant directly.
//     All catalog medicines are visible regardless of whether any shop
//     has listed them. Pricing and availability are generated on the
//     frontend by generateMarketplaceData().
//
// MOBILE_SHOW_UNLISTED_MEDICINES=false (production, safe default)
//   → Queries MarketplaceListing with full visibility chain:
//       listing.is_visible = true
//       listing.stock_status = IN_STOCK
//       branch.marketplaceSettings.marketplace_enabled = true
//       branch.marketplaceSettings.marketplaceProfile.is_live = true
//     Only medicines actively listed by a live branch appear in the feed.
//     Output shape is IDENTICAL to demo mode — frontend is unaware of
//     which path ran.
//
// FLAG IS READ ONCE AT MODULE LOAD — not per request.
// Falsy default: if the variable is absent or misspelled, production
// behavior is used. This is intentional — safe by default.
//
// IMAGE NOTE: image_status RAW means scraped images exist and are valid.
// Only NONE means truly no image. We resolve the variant's images JSON
// array directly; an empty resolved array signals the frontend to show
// its branded placeholder.
//
// listMobileMedicines — categories[] param (new):
//   Accepts an optional string[] of primary_category values.
//   When present, filters with primary_category IN categories[].
//   Cannot be combined with the single category param — the controller
//   enforces this before calling the service.
//   Used by the "English Medicine" top-level category on the home screen
//   which bundles all DRUG-type primary_category values into one view.
//
// getMedicineShops:
//   Returns all branches that have a visible, in-stock listing for a
//   given variant. One row per branch. Sorted by distance if lat/lng
//   provided, else by shop name. Uses the same Haversine + IST helpers
//   already established in mobile.shops.service.js — copied here to
//   avoid cross-module coupling. Marketplace assets resolved via
//   resolveMarketplaceAsset (backend origin), medicine images via
//   resolveAssetUrl (CloudFront).

import prisma from "../../../config/prisma.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";
import { CURATED_CATEGORIES } from "./mobile.medicines.categories.js";
import { getResolvedFeedSections } from "../../cadmin/app-config/cadmin.appConfig.service.js";
// ── Feed mode ─────────────────────────────────────────────────

const SHOW_UNLISTED = process.env.MOBILE_SHOW_UNLISTED_MEDICINES === "true";
const HOME_FEED_IMAGE_OVERSAMPLE_FACTOR = 5;

function filterItemsWithRealImages(items) {
  return items.filter((item) => Boolean(item.image));
}

console.log(
  `[mobile.feed] mode: ${
    SHOW_UNLISTED ? "UNLISTED VISIBLE (demo)" : "LISTINGS ONLY (production)"
  }`,
);

// ── Marketplace asset resolver ────────────────────────────────
// Mirrors the identical helper in mobile.shops.service.js.
// Marketplace assets (logo, banner, branch image) are served by the
// backend, NOT CloudFront. resolveAssetUrl would produce a 403.

const PUBLIC_API_ORIGIN = process.env.PUBLIC_API_ORIGIN || null;

if (!PUBLIC_API_ORIGIN) {
  console.warn(
    "[mobile.medicines] WARNING: PUBLIC_API_ORIGIN is not set. " +
      "Shop logo URLs in getMedicineShops will be returned as relative paths.",
  );
}

/**
 * Resolve a stored marketplace-asset path to a full backend URL.
 * @param {string|null} pathOrUrl
 * @returns {string|null}
 */
function resolveMarketplaceAsset(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  if (!PUBLIC_API_ORIGIN) return pathOrUrl;
  const origin = PUBLIC_API_ORIGIN.endsWith("/")
    ? PUBLIC_API_ORIGIN.slice(0, -1)
    : PUBLIC_API_ORIGIN;
  const suffix = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin}${suffix}`;
}

// ── IST helpers ───────────────────────────────────────────────
// Mirrors mobile.shops.service.js — kept local to avoid coupling.

function getNowIST() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + 5.5 * 60 * 60_000;
  const ist = new Date(istMs);
  return { hours: ist.getHours(), minutes: ist.getMinutes() };
}

function toMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function computeIsOpen(is24Hours, openingTime, closingTime) {
  if (is24Hours) return true;
  const open = toMinutes(openingTime);
  const close = toMinutes(closingTime);
  if (open === null || close === null) return false;
  const { hours, minutes } = getNowIST();
  const nowMins = hours * 60 + minutes;
  if (open <= close) {
    return nowMins >= open && nowMins < close;
  } else {
    return nowMins >= open || nowMins < close;
  }
}

// ── Haversine distance ────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * The variant.images column is a JSON array of storage keys.
 * Resolve each to a full CDN URL and drop nulls.
 */
function resolveVariantImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((key) => resolveAssetUrl(key))
    .filter((url) => typeof url === "string" && url.length > 0);
}

/**
 * Build a strength display string from parsed strength fields.
 */
function buildStrength(strengthValue, strengthUnit) {
  if (strengthValue === null || strengthValue === undefined) return null;
  return `${strengthValue}${strengthUnit || ""}`;
}

/**
 * Shape a single variant into the mobile feed item.
 *
 * @param {object} variant - The Prisma variant record
 * @param {boolean|null} listingRxOverride - The branch-specific setting.
 *        If null, falls back to master (scraped) data.
 */
function toFeedItem(variant, listingRxOverride = null) {
  const images = resolveVariantImages(variant.images);
  return {
    variantId: variant.variant_id,
    skuId: variant.sku_id,
    name: variant.name,
    brand: variant.brand ?? null,
    composition: variant.composition ?? [],
    strength: buildStrength(variant.strength_value, variant.strength_unit),
    manufacturer: variant.manufacturer ?? null,
    packSize: variant.pack_size ?? null,
    image: images[0] ?? null,
    prescriptionRequired:
      listingRxOverride !== null
        ? listingRxOverride
        : (variant.master?.prescription_required ?? false),
    form: variant.master?.form ?? null,
    category: variant.master?.primary_category ?? null,
    genericName: variant.master?.generic_name ?? null,
    type: variant.master?.type ?? null,
  };
}

// ── Prisma select clauses ─────────────────────────────────────

const VARIANT_SELECT = {
  variant_id: true,
  sku_id: true,
  name: true,
  brand: true,
  composition: true,
  strength_value: true,
  strength_unit: true,
  manufacturer: true,
  pack_size: true,
  images: true,
  master: {
    select: {
      generic_name: true,
      type: true,
      form: true,
      prescription_required: true,
      primary_category: true,
    },
  },
};

// ── Demo path ─────────────────────────────────────────────────

async function listVariantsFromCatalog(category, limit, options = {}) {
  const { hasImage = false } = options;
  const rawLimit = hasImage
    ? Math.max(limit, limit * HOME_FEED_IMAGE_OVERSAMPLE_FACTOR)
    : limit;

  const variants = await prisma.masterMedicineVariant.findMany({
    where: {
      master: {
        is: {
          primary_category: { equals: category, mode: "insensitive" },
          is_active: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take: rawLimit,
    select: VARIANT_SELECT,
  });

  const items = variants.map((v) => toFeedItem(v));
  return hasImage ? filterItemsWithRealImages(items).slice(0, limit) : items;
}

// ── Production path ───────────────────────────────────────────

async function listVariantsFromListings(category, limit, options = {}) {
  const { hasImage = false } = options;
  const rawLimit = hasImage
    ? Math.max(limit, limit * HOME_FEED_IMAGE_OVERSAMPLE_FACTOR)
    : limit;

  const listings = await prisma.marketplaceListing.findMany({
    where: {
      is_visible: true,
      stock_status: "IN_STOCK",
      branch: {
        marketplaceSettings: {
          marketplace_enabled: true,
          marketplaceProfile: { is_live: true },
        },
      },
      linkedVariant: {
        master: {
          primary_category: { equals: category, mode: "insensitive" },
          is_active: true,
        },
      },
    },
    orderBy: { linkedVariant: { name: "asc" } },
    take: rawLimit,
    select: {
      requires_prescription: true,
      linkedVariant: { select: VARIANT_SELECT },
    },
  });

  const rxRequiredVariants = new Set();
  listings.forEach((l) => {
    if (l.requires_prescription && l.linkedVariant) {
      rxRequiredVariants.add(l.linkedVariant.variant_id);
    }
  });

  const seen = new Set();
  const items = [];
  for (const listing of listings) {
    const v = listing.linkedVariant;
    if (!v || seen.has(v.variant_id)) continue;
    seen.add(v.variant_id);
    items.push(toFeedItem(v, rxRequiredVariants.has(v.variant_id)));
  }

  const filtered = hasImage ? filterItemsWithRealImages(items) : items;
  return filtered.slice(0, limit);
}

// ── Feed ──────────────────────────────────────────────────────

export async function listMobileFeed(itemsPerSection = 8) {
  const queryFn = SHOW_UNLISTED
    ? listVariantsFromCatalog
    : listVariantsFromListings;

  // Fetch DB-resolved sections (visibility + order + label overrides applied)
  // Falls back gracefully: if DB has no override rows, registry defaults are used.
  const feedSections = await getResolvedFeedSections();

  const results = await Promise.all(
    feedSections.map(async (section) => {
      const medicines = await queryFn(section.key, itemsPerSection, {
        hasImage: true,
      });
      return { section, medicines };
    }),
  );

  const sections = results
    .filter(({ medicines }) => medicines.length > 0)
    .map(({ section, medicines }) => ({
      key: section.key,
      title: section.label,
      icon: section.icon,
      type: section.type,
      medicines,
    }));

  return { sections };
}

// ── List variants (paginated catalog) ─────────────────────────
//
// Accepts either:
//   category   string   — single primary_category equals filter
//   categories string[] — multi primary_category IN filter
// These are mutually exclusive — the controller enforces this.
// When neither is provided, no category filter is applied.

export async function listMobileMedicines({
  page = 1,
  limit = 20,
  type,
  category,
  categories,
  search,
  hasImage = false,
}) {
  const IMAGE_OVERSAMPLE_FACTOR = 5;
  const rawLimit = hasImage
    ? Math.max(limit, limit * IMAGE_OVERSAMPLE_FACTOR)
    : limit;

  const rawSkip = hasImage ? (page - 1) * rawLimit : (page - 1) * limit;

  // ── Build master where clause ────────────────────────────────
  const masterWhere = { is_active: true };

  if (type) {
    masterWhere.type = type;
  }

  if (categories && categories.length > 0) {
    masterWhere.primary_category = { in: categories };
  } else if (category) {
    masterWhere.primary_category = { equals: category, mode: "insensitive" };
  }

  // ── Build variant where clause ────────────────────────────────
  const where = {
    master: { is: masterWhere },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { manufacturer: { contains: search, mode: "insensitive" } },
      {
        master: {
          is: { generic_name: { contains: search, mode: "insensitive" } },
        },
      },
    ];
  }

  const [variants, total] = await Promise.all([
    prisma.masterMedicineVariant.findMany({
      where,
      orderBy: { name: "asc" },
      skip: rawSkip,
      take: rawLimit,
      select: VARIANT_SELECT,
    }),
    prisma.masterMedicineVariant.count({ where }),
  ]);

  const totalPages = Math.ceil(total / rawLimit);
  const medicinesRaw = variants.map((v) => toFeedItem(v));
  const medicines = hasImage
    ? medicinesRaw.filter((item) => Boolean(item.image)).slice(0, limit)
    : medicinesRaw;

  return {
    medicines,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: rawSkip + rawLimit < total,
      hasPrev: page > 1,
    },
  };
}

// ── Single variant (detail) ───────────────────────────────────

export async function getMobileMedicine(idOrSku) {
  const baseSelect = {
    variant_id: true,
    sku_id: true,
    name: true,
    brand: true,
    composition: true,
    strength_value: true,
    strength_unit: true,
    manufacturer: true,
    marketer: true,
    pack_size: true,
    description: true,
    images: true,
    master_medicine_id: true,
    master: {
      select: {
        master_medicine_id: true,
        generic_name: true,
        type: true,
        form: true,
        prescription_required: true,
        primary_category: true,
        composition: true,
      },
    },
  };

  let variant = await prisma.masterMedicineVariant.findUnique({
    where: { sku_id: idOrSku },
    select: baseSelect,
  });

  if (!variant) {
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSku,
      );
    if (looksLikeUuid) {
      variant = await prisma.masterMedicineVariant.findUnique({
        where: { variant_id: idOrSku },
        select: baseSelect,
      });
    }
  }

  if (!variant) return null;

  let availableNearYou = true;
  let prescriptionRequired = variant.master?.prescription_required ?? false;

  if (!SHOW_UNLISTED) {
    const visibleListing = await prisma.marketplaceListing.findFirst({
      where: {
        linked_variant_id: variant.variant_id,
        is_visible: true,
        stock_status: "IN_STOCK",
        branch: {
          marketplaceSettings: {
            marketplace_enabled: true,
            marketplaceProfile: { is_live: true },
          },
        },
      },
      select: { listing_id: true },
    });
    availableNearYou = visibleListing !== null;

    const rxListing = await prisma.marketplaceListing.findFirst({
      where: {
        linked_variant_id: variant.variant_id,
        requires_prescription: true,
        is_visible: true,
        branch: {
          marketplaceSettings: {
            marketplace_enabled: true,
            marketplaceProfile: { is_live: true },
          },
        },
      },
      select: { listing_id: true },
    });
    prescriptionRequired = !!rxListing;
  }

  const siblings = await prisma.masterMedicineVariant.findMany({
    where: {
      master_medicine_id: variant.master_medicine_id,
      NOT: { variant_id: variant.variant_id },
    },
    take: 10,
    orderBy: { name: "asc" },
    select: VARIANT_SELECT,
  });

  return {
    variant: {
      ...toFeedItem(variant, prescriptionRequired),
      marketer: variant.marketer ?? null,
      description: variant.description ?? null,
      images: resolveVariantImages(variant.images),
      availableNearYou,
    },
    siblings: siblings.map((s) => toFeedItem(s)),
  };
}

// ── getMedicineShops ──────────────────────────────────────────
//
// Returns all branches that have a visible listing for a given variant.
// One row per branch — cart enforcement is at the branch level.
// Sorted by distance asc if lat/lng provided, else by shop name asc.

export async function getMedicineShops(variantId, lat, lng) {
  const hasLocation = lat != null && lng != null;

  const listings = await prisma.marketplaceListing.findMany({
    where: {
      linked_variant_id: variantId,
      is_visible: true,
      stock_status: "IN_STOCK",
      branch: {
        marketplaceSettings: {
          marketplace_enabled: true,
          marketplaceProfile: { is_live: true },
        },
      },
    },
    select: {
      listing_id: true,
      marketplace_price: true,
      requires_prescription: true,
      stock_status: true,
      shop: {
        select: {
          shop_id: true,
          business_name: true,
          marketplaceProfile: {
            select: {
              storefront_name: true,
              logo_url: true,
            },
          },
        },
      },
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
          marketplaceSettings: {
            select: {
              latitude: true,
              longitude: true,
              formatted_address: true,
              opening_time: true,
              closing_time: true,
              is_24_hours: true,
              pickup_enabled: true,
              delivery_enabled: true,
              contact_override: true,
            },
          },
        },
      },
    },
  });

  // ── Deduplicate by branchId ───────────────────────────────
  // A branch may appear multiple times if the shop has linked
  // multiple medicine records to the same master variant.
  // Keep the listing with the lowest price per branch.
  const byBranch = new Map();
  for (const l of listings) {
    const branchId = l.branch?.branch_id;
    if (!branchId) continue;

    const existing = byBranch.get(branchId);
    if (!existing) {
      byBranch.set(branchId, l);
      continue;
    }

    // Keep whichever has a lower price
    const existingPrice = existing.marketplace_price
      ? Number(existing.marketplace_price)
      : Infinity;
    const newPrice = l.marketplace_price
      ? Number(l.marketplace_price)
      : Infinity;

    if (newPrice < existingPrice) {
      byBranch.set(branchId, l);
    }
  }

  const deduped = Array.from(byBranch.values());
  // ─────────────────────────────────────────────────────────

  const rows = deduped.map((l) => {
    const bs = l.branch?.marketplaceSettings;
    const branchLat = bs?.latitude ? Number(bs.latitude) : null;
    const branchLng = bs?.longitude ? Number(bs.longitude) : null;

    const shopName =
      l.shop?.marketplaceProfile?.storefront_name ||
      l.shop?.business_name ||
      "Unknown Shop";

    return {
      shopId: l.shop?.shop_id ?? null,
      shopName,
      logoUrl: resolveMarketplaceAsset(
        l.shop?.marketplaceProfile?.logo_url ?? null,
      ),
      branchId: l.branch?.branch_id ?? null,
      branchName: l.branch?.branch_name ?? null,
      address: bs?.formatted_address ?? null,
      latitude: branchLat,
      longitude: branchLng,
      distanceKm: haversineKm(
        hasLocation ? lat : null,
        hasLocation ? lng : null,
        branchLat,
        branchLng,
      ),
      isOpen: computeIsOpen(
        bs?.is_24_hours ?? false,
        bs?.opening_time ?? null,
        bs?.closing_time ?? null,
      ),
      is24Hours: bs?.is_24_hours ?? false,
      openingTime: bs?.opening_time ?? null,
      closingTime: bs?.closing_time ?? null,
      pickupEnabled: bs?.pickup_enabled ?? false,
      deliveryEnabled: bs?.delivery_enabled ?? false,
      contact: bs?.contact_override ?? null,
      listingPrice: l.marketplace_price ? Number(l.marketplace_price) : null,
      stockStatus: l.stock_status,
      requiresPrescription: l.requires_prescription,
    };
  });

  rows.sort((a, b) => {
    if (hasLocation) {
      const dA = a.distanceKm ?? Infinity;
      const dB = b.distanceKm ?? Infinity;
      return dA - dB;
    }
    return (a.shopName ?? "").localeCompare(b.shopName ?? "");
  });

  return rows;
}
