// src/modules/mobile/medicines/mobile.medicines.service.js
//
// PUBLIC mobile medicine discovery — service layer.
//
// Data philosophy (Cureli Mobile MVP showcase):
//   • REAL  → MasterMedicineVariant catalog data (name, brand, composition,
//             manufacturer, pack size, images) + its master's regulatory
//             fields (prescription_required, form, primary_category, type).
//   • FAKE  → pharmacy count, price, ETA, distance, stock. Generated on the
//             FRONTEND only. This service NEVER returns those.
//
// Isolation: this module talks to Prisma + the shared asset URL resolver
// ONLY. It does NOT import the cadmin master-medicines service, so the
// mobile contract stays independent of the admin tool.
//
// IMAGE NOTE: image_status RAW means scraped images EXIST and are valid.
// Only NONE means truly no image. We therefore resolve the variant's
// images JSON array directly; an empty resolved array is the single signal
// the frontend uses to show its branded placeholder.

import prisma from "../../../config/prisma.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";

// ── Helpers ───────────────────────────────────────────────────

/**
 * The variant.images column is a JSON array of storage keys, e.g.
 *   ["medicine_images/10005/img_00_high.jpg", ...]
 * Resolve each to a full CDN URL and drop nulls. RAW + VERIFIED images are
 * both valid and live here; we do NOT filter by source.
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
 * Only REAL fields. No pricing — pricing is faked client-side.
 */
function toFeedItem(variant) {
  const images = resolveVariantImages(variant.images);
  return {
    variantId: variant.variant_id,
    skuId: variant.sku_id,
    name: variant.name,
    brand: variant.brand,
    composition: variant.composition ?? [],
    strength: buildStrength(variant.strength_value, variant.strength_unit),
    manufacturer: variant.manufacturer,
    packSize: variant.pack_size,
    image: images[0] ?? null, // first image, or null → frontend placeholder
    // ── from master (regulatory / discovery) ──
    prescriptionRequired: variant.master?.prescription_required ?? false,
    form: variant.master?.form ?? null,
    category: variant.master?.primary_category ?? null, // internal code
    genericName: variant.master?.generic_name ?? null,
    type: variant.master?.type ?? null,
  };
}

// ── List variants (the feed) ──────────────────────────────────

/**
 * Paginated, per-variant feed for the mobile home screen.
 *
 * @param {Object} opts
 * @param {number} opts.page
 * @param {number} opts.limit
 * @param {"DRUG"|"OTC"} [opts.type]
 * @param {string} [opts.category]  internal primary_category
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

  // Build the variant-level where clause. Master-level filters (type,
  // category) go through the `master` relation, which is indexed.
  const where = {};

  // Filter on master fields via relation
  const masterWhere = {};
  if (type) masterWhere.type = type;
  if (category) {
    masterWhere.primary_category = { equals: category, mode: "insensitive" };
  }
  if (Object.keys(masterWhere).length > 0) {
    where.master = { is: masterWhere };
  }

  // Search matches the variant name/brand/manufacturer OR the master's
  // generic name — covers brand searches and composition searches.
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { manufacturer: { contains: search, mode: "insensitive" } },
      { master: { is: { generic_name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [variants, total] = await Promise.all([
    prisma.masterMedicineVariant.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      select: {
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
      },
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
 * Fetch one variant by variant UUID OR sku_id, plus sibling variants under
 * the same master (for the detail screen's "other brands" section).
 * Dual lookup mirrors the cadmin getMasterMedicineById pattern.
 *
 * @param {string} idOrSku
 * @returns {Promise<Object|null>}
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

  // Try sku_id first (the card routes by skuId), then fall back to UUID.
  let variant = await prisma.masterMedicineVariant.findUnique({
    where: { sku_id: idOrSku },
    select: baseSelect,
  });

  if (!variant) {
    // findUnique on variant_id requires a valid UUID; guard against bad input.
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

  // Sibling variants under the same master (exclude self).
  const siblings = await prisma.masterMedicineVariant.findMany({
    where: {
      master_medicine_id: variant.master_medicine_id,
      NOT: { variant_id: variant.variant_id },
    },
    take: 10,
    orderBy: { name: "asc" },
    select: {
      variant_id: true,
      sku_id: true,
      name: true,
      brand: true,
      strength_value: true,
      strength_unit: true,
      manufacturer: true,
      pack_size: true,
      images: true,
      master: {
        select: {
          prescription_required: true,
          form: true,
          primary_category: true,
          type: true,
          generic_name: true,
        },
      },
    },
  });

  return {
    variant: {
      ...toFeedItem(variant),
      marketer: variant.marketer ?? null,
      description: variant.description ?? null,
      images: resolveVariantImages(variant.images), // full gallery
    },
    siblings: siblings.map(toFeedItem),
  };
}