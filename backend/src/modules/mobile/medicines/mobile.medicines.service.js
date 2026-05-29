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

import prisma from "../../../config/prisma.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";
import { CURATED_CATEGORIES } from "./mobile.medicines.categories.js";

// ── Feed mode ─────────────────────────────────────────────────

const SHOW_UNLISTED = process.env.MOBILE_SHOW_UNLISTED_MEDICINES === "true";

console.log(
  `[mobile.feed] mode: ${
    SHOW_UNLISTED
      ? "UNLISTED VISIBLE (demo)"
      : "LISTINGS ONLY (production)"
  }`
);

// ── Helpers ───────────────────────────────────────────────────

/**
 * The variant.images column is a JSON array of storage keys, e.g.
 *   ["medicine_images/10005/img_00_high.jpg", ...]
 * Resolve each to a full CDN URL and drop nulls.
 *
 * @param {unknown} images
 * @returns {string[]}
 */
function resolveVariantImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((key) => resolveAssetUrl(key))
    .filter((url) => typeof url === "string" && url.length > 0);
}

/**
 * Build a strength display string from parsed strength fields.
 * @returns {string|null}
 */
function buildStrength(strengthValue, strengthUnit) {
  if (strengthValue === null || strengthValue === undefined) return null;
  return `${strengthValue}${strengthUnit || ""}`;
}

/**
 * Shape a single variant (with included master) into the mobile feed item.
 * Only REAL fields. No pricing — pricing is generated client-side.
 *
 * This function is the single source of truth for the feed item shape.
 * Both the demo path and the production path call it. The frontend
 * receives an identical structure regardless of which path ran.
 *
 * @param {object} variant - MasterMedicineVariant with master included
 * @returns {object}
 */
function toFeedItem(variant) {
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
    // ── from master (regulatory / discovery) ──
    prescriptionRequired: variant.master?.prescription_required ?? false,
    form: variant.master?.form ?? null,
    category: variant.master?.primary_category ?? null,
    genericName: variant.master?.generic_name ?? null,
    type: variant.master?.type ?? null,
  };
}

// ── Prisma select clauses (reused across paths) ───────────────

/**
 * The variant select used by both the demo path and the production
 * listing path. Centralised so both paths always return the same shape.
 */
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

/**
 * Query MasterMedicineVariant directly for a given category.
 * Used when SHOW_UNLISTED = true.
 *
 * @param {string} category - internal primary_category value
 * @param {number} limit
 * @returns {Promise<object[]>} shaped feed items
 */
async function listVariantsFromCatalog(category, limit) {
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
    take: limit,
    select: VARIANT_SELECT,
  });

  return variants.map(toFeedItem);
}

// ── Production path ───────────────────────────────────────────

/**
 * Query MarketplaceListing with full visibility chain for a given category.
 * Used when SHOW_UNLISTED = false.
 *
 * Visibility chain:
 *   listing.is_visible = true
 *   listing.stock_status = IN_STOCK
 *   branch.marketplaceSettings.marketplace_enabled = true
 *   branch.marketplaceSettings.marketplaceProfile.is_live = true
 *
 * @param {string} category - internal primary_category value
 * @param {number} limit
 * @returns {Promise<object[]>} shaped feed items, identical shape to demo path
 */
async function listVariantsFromListings(category, limit) {
  const listings = await prisma.marketplaceListing.findMany({
    where: {
      is_visible: true,
      stock_status: "IN_STOCK",
      branch: {
        marketplaceSettings: {
          marketplace_enabled: true,
          marketplaceProfile: {
            is_live: true,
          },
        },
      },
      linkedVariant: {
        master: {
          primary_category: { equals: category, mode: "insensitive" },
          is_active: true,
        },
      },
    },
    orderBy: {
      linkedVariant: { name: "asc" },
    },
    take: limit,
    select: {
      linkedVariant: {
        select: VARIANT_SELECT,
      },
    },
  });

  // Deduplicate by variant_id — multiple branches may list the same variant.
  // The feed should show each medicine once, not once per listing.
  const seen = new Set();
  const items = [];

  for (const listing of listings) {
    const v = listing.linkedVariant;
    if (!v || seen.has(v.variant_id)) continue;
    seen.add(v.variant_id);
    items.push(toFeedItem(v));
  }

  return items;
}

// ── Feed ──────────────────────────────────────────────────────

/**
 * Build the complete home feed — one section per CURATED_CATEGORIES entry
 * that returns at least one result.
 *
 * Runs all category queries concurrently via Promise.all().
 * From the mobile app's perspective this is one network round trip
 * instead of one per category.
 *
 * Sections with zero results are omitted from the response so the
 * frontend never renders an empty rail.
 *
 * @param {number} [itemsPerSection=8]
 * @returns {Promise<{ sections: object[] }>}
 */
export async function listMobileFeed(itemsPerSection = 8) {
  const queryFn = SHOW_UNLISTED
    ? listVariantsFromCatalog
    : listVariantsFromListings;

  const results = await Promise.all(
    CURATED_CATEGORIES.map(async (cat) => {
      const medicines = await queryFn(cat.key, itemsPerSection);
      return { cat, medicines };
    })
  );

  const sections = results
    .filter(({ medicines }) => medicines.length > 0)
    .map(({ cat, medicines }) => ({
      key: cat.key,
      title: cat.label,
      icon: cat.icon,
      medicines,
    }));

  return { sections };
}

// ── List variants (paginated catalog — CategoryScreen) ────────

/**
 * Paginated, per-variant feed for the category browse screen.
 * This endpoint is NOT affected by SHOW_UNLISTED — it always
 * queries the full catalog. Category browsing is always public.
 *
 * Used by GET /mobile/medicines (CategoryScreen infinite scroll).
 *
 * @param {Object} opts
 * @param {number} opts.page
 * @param {number} opts.limit
 * @param {"DRUG"|"OTC"} [opts.type]
 * @param {string} [opts.category]
 * @param {string} [opts.search]
 */
export async function listMobileMedicines({
  page = 1,
  limit = 20,
  type,
  category,
  search,
}) {
  const skip = (page - 1) * limit;

  const where = {};

  const masterWhere = { is_active: true };
  if (type) masterWhere.type = type;
  if (category) {
    masterWhere.primary_category = { equals: category, mode: "insensitive" };
  }
  if (Object.keys(masterWhere).length > 0) {
    where.master = { is: masterWhere };
  }

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
      skip,
      take: limit,
      select: VARIANT_SELECT,
    }),
    prisma.masterMedicineVariant.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    medicines: variants.map(toFeedItem),
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ── Single variant (detail) ───────────────────────────────────

/**
 * Fetch one variant by variant UUID OR sku_id, plus sibling variants
 * under the same master (for the detail screen's "Other options" rail).
 *
 * In production mode (SHOW_UNLISTED = false), also checks whether any
 * visible listing exists for this variant across any live branch.
 * Returns availableNearYou: boolean so the frontend can disable order
 * actions without hiding the product page.
 *
 * In demo mode (SHOW_UNLISTED = true), availableNearYou is always true —
 * the check is skipped entirely.
 *
 * @param {string} idOrSku - variant UUID or sku_id
 * @returns {Promise<object|null>}
 */
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

  // Try sku_id first (cards route by skuId), then fall back to UUID.
  let variant = await prisma.masterMedicineVariant.findUnique({
    where: { sku_id: idOrSku },
    select: baseSelect,
  });

  if (!variant) {
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSku
      );
    if (looksLikeUuid) {
      variant = await prisma.masterMedicineVariant.findUnique({
        where: { variant_id: idOrSku },
        select: baseSelect,
      });
    }
  }

  if (!variant) return null;

  // ── availableNearYou ──────────────────────────────────────
  // Demo mode: skip the DB check entirely — always true.
  // Production mode: check if any live branch has this variant
  // listed and visible. One findFirst with a short-circuit is
  // cheaper than a count.
  let availableNearYou = false;

  if (!SHOW_UNLISTED) {
    const visibleListing = await prisma.marketplaceListing.findFirst({
      where: {
        linked_variant_id: variant.variant_id,
        is_visible: true,
        stock_status: "IN_STOCK",
        branch: {
          marketplaceSettings: {
            marketplace_enabled: true,
            marketplaceProfile: {
              is_live: true,
            },
          },
        },
      },
      select: { listing_id: true },
    });

    availableNearYou = visibleListing !== null;
  }

  // ── Siblings ──────────────────────────────────────────────
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
      ...toFeedItem(variant),
      marketer: variant.marketer ?? null,
      description: variant.description ?? null,
      images: resolveVariantImages(variant.images),
      availableNearYou,
    },
    siblings: siblings.map(toFeedItem),
  };
}