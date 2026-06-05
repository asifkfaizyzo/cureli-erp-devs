// src/modules/mobile/shops/mobile.shops.service.js
//
// PUBLIC mobile shop discovery — service layer.
//
// All queries require:
//   MarketplaceProfile.is_live = true
//   BranchMarketplaceSettings.marketplace_enabled = true
//
// Distance is computed via the Haversine formula — straight-line km between
// user coordinates and branch coordinates. No Google Maps API call. Fast,
// free, accurate enough for "nearby" ordering.
//
// is_open is computed in IST (UTC+5:30). opening_time and closing_time are
// stored as "HH:MM" strings with no timezone — all shops are India-based.
//
// Rating: field is present in all response shapes, always null for now.
// No rating data exists in the schema. Field is reserved for future use.
//
// Delivery time: field is present in types, always null for now. May be
// computed from Google Maps Distance Matrix API in a future phase.
//
// ── IMAGE RESOLUTION NOTE ─────────────────────────────────────
// Marketplace assets (logo, banner, branch image) are NOT stored as S3
// keys. The marketplace upload pipeline stores them as backend-served
// route paths, e.g. "/api/files/marketplace_assets/logo-<shop>-<ts>.png".
// These are served by the backend's own filesRoutes, NOT from CloudFront.
//
// Therefore they must be resolved against the backend's public origin,
// the same way the ERP web client does (it prepends VITE_API_URL).
// Passing them through resolveAssetUrl (which prepends the CloudFront
// domain) produces a URL CloudFront has no object for → 403/404 →
// React Native <Image> renders a silent blank.
//
// Medicine images DO live in the bucket, so they continue to use
// resolveAssetUrl. Only marketplace assets use resolveMarketplaceAsset.

import prisma from "../../../config/prisma.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";

// ── Marketplace asset resolver ────────────────────────────────
//
// PUBLIC_API_ORIGIN is the backend's own externally-reachable origin:
//   prod → https://api.cureliofficial.com
//   dev  → http://<LAN-IP>:5000   (NOT localhost — the phone cannot
//          reach the dev machine's localhost; use the same host the
//          mobile app points CONFIG.BASE_URL at)
//
// If the var is unset we warn once and return the path unchanged, which
// keeps already-absolute (http...) values working and fails loudly-ish
// in logs rather than crashing.

const PUBLIC_API_ORIGIN = process.env.PUBLIC_API_ORIGIN || null;

if (!PUBLIC_API_ORIGIN) {
  console.warn(
    "[mobile.shops] WARNING: PUBLIC_API_ORIGIN is not set. " +
      "Marketplace asset URLs (logo/banner/branch image) will be returned " +
      "as relative paths and will not load in the mobile app."
  );
}

/**
 * Resolve a stored marketplace-asset path to a full backend URL.
 *
 * Mirrors the ERP web resolveImageUrl():
 *   - null/empty            → null
 *   - already absolute http → returned unchanged
 *   - otherwise             → PUBLIC_API_ORIGIN + path
 *
 * @param {string|null} pathOrUrl  e.g. "/api/files/marketplace_assets/logo-x.png"
 * @returns {string|null}
 */
function resolveMarketplaceAsset(pathOrUrl) {
  if (!pathOrUrl) return null;

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  if (!PUBLIC_API_ORIGIN) return pathOrUrl; // no config — return as-is

  // Avoid double slashes at the join.
  const origin = PUBLIC_API_ORIGIN.endsWith("/")
    ? PUBLIC_API_ORIGIN.slice(0, -1)
    : PUBLIC_API_ORIGIN;
  const suffix = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;

  return `${origin}${suffix}`;
}

// ── IST helpers ───────────────────────────────────────────────

/**
 * Get current time in IST as { hours, minutes }.
 * IST = UTC + 5h30m.
 */
function getNowIST() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + 5.5 * 60 * 60_000;
  const ist = new Date(istMs);
  return { hours: ist.getHours(), minutes: ist.getMinutes() };
}

/**
 * Parse "HH:MM" string → total minutes since midnight.
 * Returns null if input is null/undefined/malformed.
 *
 * @param {string|null} timeStr
 * @returns {number|null}
 */
function toMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Compute is_open from branch timing fields.
 * Handles overnight windows (e.g. 22:00 → 06:00).
 *
 * @param {boolean} is24Hours
 * @param {string|null} openingTime  "HH:MM"
 * @param {string|null} closingTime  "HH:MM"
 * @returns {boolean}
 */
function computeIsOpen(is24Hours, openingTime, closingTime) {
  if (is24Hours) return true;

  const open = toMinutes(openingTime);
  const close = toMinutes(closingTime);

  if (open === null || close === null) return false;

  const { hours, minutes } = getNowIST();
  const nowMins = hours * 60 + minutes;

  if (open <= close) {
    // Normal window: 09:00 → 21:00
    return nowMins >= open && nowMins < close;
  } else {
    // Overnight window: 22:00 → 06:00
    return nowMins >= open || nowMins < close;
  }
}

// ── Haversine distance ────────────────────────────────────────

/**
 * Compute straight-line distance in km between two lat/lng points.
 * Returns null if any coordinate is missing.
 *
 * @param {number|null} lat1
 * @param {number|null} lng1
 * @param {number|null} lat2
 * @param {number|null} lng2
 * @returns {number|null}
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;

  // Round to 1 decimal place
  return Math.round(km * 10) / 10;
}

// ── toFeedItem (medicines) ────────────────────────────────────
// Mirrors the shape produced by mobile.medicines.service.js toFeedItem.
// Kept local to avoid cross-module coupling.

function resolveVariantImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((key) => resolveAssetUrl(key))
    .filter((url) => typeof url === "string" && url.length > 0);
}

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
    // Use branch override if provided, else fall back to master
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

// Shared variant select — mirrors VARIANT_SELECT in medicines service
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

// ── Shape helpers ─────────────────────────────────────────────

/**
 * Shape a BranchMarketplaceSettings row into a BranchResult.
 * Used by both search results and shop profile.
 *
 * @param {object} bs - BranchMarketplaceSettings with branch relation
 * @param {number|null} userLat
 * @param {number|null} userLng
 * @param {number} listedMedicineCount
 * @returns {object}
 */
function shapeBranch(bs, userLat, userLng, listedMedicineCount = 0) {
  const lat = bs.latitude ? Number(bs.latitude) : null;
  const lng = bs.longitude ? Number(bs.longitude) : null;

  return {
    branchId: bs.branch_id,
    branchName: bs.branch?.branch_name ?? null,
    address: bs.formatted_address ?? null,
    latitude: lat,
    longitude: lng,
    distanceKm: haversineKm(userLat, userLng, lat, lng),
    isOpen: computeIsOpen(bs.is_24_hours, bs.opening_time, bs.closing_time),
    is24Hours: bs.is_24_hours,
    openingTime: bs.opening_time ?? null,
    closingTime: bs.closing_time ?? null,
    pickupEnabled: bs.pickup_enabled,
    deliveryEnabled: bs.delivery_enabled,
    contact: bs.contact_override ?? bs.branch?.contact_number ?? null,
    marketplaceEnabled: bs.marketplace_enabled,
    listedMedicineCount,
    // Reserved for future use — Google Maps Distance Matrix ETA
    deliveryTimeEstimate: null,
  };
}

// ── SEARCH SHOPS ──────────────────────────────────────────────

/**
 * Search live shops by name, description, or address.
 * Returns one result per shop with its nearest branch.
 *
 * @param {object} opts
 * @param {string} [opts.q]
 * @param {number} [opts.lat]
 * @param {number} [opts.lng]
 * @param {number} [opts.page]
 * @param {number} [opts.limit]
 */
export async function searchShops({ q, lat, lng, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const hasLocation = lat != null && lng != null;

  // ── Build search filter ───────────────────────────────────
  // Match against storefront_name, storefront_description on
  // MarketplaceProfile, and formatted_address on branch settings.
  // If q is absent or too short, return all live shops.

  const hasQuery = q && q.trim().length >= 2;

  const profileWhere = {
    is_live: true,
    ...(hasQuery
      ? {
          OR: [
            {
              storefront_name: {
                contains: q.trim(),
                mode: "insensitive",
              },
            },
            {
              storefront_description: {
                contains: q.trim(),
                mode: "insensitive",
              },
            },
            {
              shop: {
                business_name: {
                  contains: q.trim(),
                  mode: "insensitive",
                },
              },
            },
            {
              branchSettings: {
                some: {
                  marketplace_enabled: true,
                  formatted_address: {
                    contains: q.trim(),
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  // ── Fetch profiles with branch settings ───────────────────
  const [profiles, total] = await Promise.all([
    prisma.marketplaceProfile.findMany({
      where: profileWhere,
      select: {
        marketplace_profile_id: true,
        shop_id: true,
        storefront_name: true,
        storefront_description: true,
        logo_url: true,
        shop: {
          select: {
            business_name: true,
            shop_id: true,
          },
        },
        branchSettings: {
          where: { marketplace_enabled: true },
          select: {
            branch_id: true,
            marketplace_enabled: true,
            latitude: true,
            longitude: true,
            formatted_address: true,
            opening_time: true,
            closing_time: true,
            is_24_hours: true,
            pickup_enabled: true,
            delivery_enabled: true,
            contact_override: true,
            branch: {
              select: {
                branch_name: true,
                contact_number: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.marketplaceProfile.count({ where: profileWhere }),
  ]);

  // ── Get listing counts for all shops in one query ─────────
  // One aggregation query instead of N per-shop queries.
  const shopIds = profiles.map((p) => p.shop_id);

  const listingCounts = await prisma.marketplaceListing.groupBy({
    by: ["shop_id"],
    where: {
      shop_id: { in: shopIds },
      is_visible: true,
      stock_status: "IN_STOCK",
    },
    _count: { listing_id: true },
  });

  const countMap = new Map(
    listingCounts.map((lc) => [lc.shop_id, lc._count.listing_id])
  );

  // ── Shape results ─────────────────────────────────────────
  const shops = profiles
    .map((profile) => {
      const name = profile.storefront_name || profile.shop.business_name;

      const listedMedicineCount = countMap.get(profile.shop_id) ?? 0;

      // Find nearest branch
      let nearestBranch = null;

      if (profile.branchSettings.length > 0) {
        if (hasLocation) {
          // Sort by distance and pick the closest
          const withDistance = profile.branchSettings.map((bs) => ({
            bs,
            dist: haversineKm(
              lat,
              lng,
              bs.latitude ? Number(bs.latitude) : null,
              bs.longitude ? Number(bs.longitude) : null
            ),
          }));

          withDistance.sort((a, b) => {
            if (a.dist === null) return 1;
            if (b.dist === null) return -1;
            return a.dist - b.dist;
          });

          nearestBranch = shapeBranch(
            withDistance[0].bs,
            lat,
            lng,
            listedMedicineCount
          );
        } else {
          // No location — pick first alphabetically by branch name
          const sorted = [...profile.branchSettings].sort((a, b) => {
            const nameA = a.branch?.branch_name ?? "";
            const nameB = b.branch?.branch_name ?? "";
            return nameA.localeCompare(nameB);
          });

          nearestBranch = shapeBranch(
            sorted[0],
            null,
            null,
            listedMedicineCount
          );
        }
      }

      return {
        shopId: profile.shop_id,
        name,
        description: profile.storefront_description ?? null,
        // CHANGED: marketplace asset, resolve against backend origin
        logoUrl: resolveMarketplaceAsset(profile.logo_url),
        nearestBranch,
        totalBranches: profile.branchSettings.length,
        listedMedicineCount,
        // Rating — reserved, no data yet
        rating: null,
      };
    })
    // Sort: if location provided → by nearest branch distance asc
    //       otherwise → by listing count desc
    .sort((a, b) => {
      if (hasLocation) {
        const dA = a.nearestBranch?.distanceKm ?? Infinity;
        const dB = b.nearestBranch?.distanceKm ?? Infinity;
        return dA - dB;
      }
      return b.listedMedicineCount - a.listedMedicineCount;
    });

  const totalPages = Math.ceil(total / limit);

  return {
    shops,
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

// ── GET SHOP PROFILE ──────────────────────────────────────────

/**
 * Fetch full shop profile with all marketplace-onboarded branches.
 * Inactive branches (marketplace_enabled = false) are included but
 * flagged — the frontend greys them out. Only branches that were
 * ever onboarded to the marketplace appear; non-onboarded branches
 * are excluded entirely.
 *
 * Branches sorted: nearest first if location provided, else alphabetically.
 *
 * @param {string} shopId
 * @param {number|null} lat
 * @param {number|null} lng
 * @returns {Promise<object|null>}
 */
export async function getShopProfile(shopId, lat, lng) {
  const hasLocation = lat != null && lng != null;

  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id: shopId },
    select: {
      marketplace_profile_id: true,
      shop_id: true,
      storefront_name: true,
      storefront_description: true,
      support_phone: true,
      logo_url: true,
      banner_url: true,
      is_live: true,
      marketplace_status: true,
      shop: {
        select: {
          business_name: true,
          city: true,
          state: true,
        },
      },
      // All onboarded branches — both enabled and disabled
      // marketplace_enabled: false means disabled by owner, still show (greyed)
      branchSettings: {
        select: {
          branch_id: true,
          marketplace_enabled: true,
          latitude: true,
          longitude: true,
          formatted_address: true,
          opening_time: true,
          closing_time: true,
          is_24_hours: true,
          pickup_enabled: true,
          delivery_enabled: true,
          contact_override: true,
          shop_image_url: true,
          branch: {
            select: {
              branch_name: true,
              contact_number: true,
              is_active: true,
            },
          },
        },
      },
    },
  });

  if (!profile) return null;
  if (!profile.is_live) return null;

  // ── Get per-branch listing counts ─────────────────────────
  const branchIds = profile.branchSettings.map((bs) => bs.branch_id);

  const branchListingCounts = await prisma.marketplaceListing.groupBy({
    by: ["branch_id"],
    where: {
      branch_id: { in: branchIds },
      is_visible: true,
      stock_status: "IN_STOCK",
    },
    _count: { listing_id: true },
  });

  const branchCountMap = new Map(
    branchListingCounts.map((blc) => [blc.branch_id, blc._count.listing_id])
  );

  // ── Shape branches ────────────────────────────────────────
  const branches = profile.branchSettings.map((bs) => {
    const count = branchCountMap.get(bs.branch_id) ?? 0;
    const shaped = shapeBranch(
      bs,
      hasLocation ? lat : null,
      hasLocation ? lng : null,
      count
    );
    return {
      ...shaped,
      // CHANGED: marketplace asset, resolve against backend origin
      shopImageUrl: resolveMarketplaceAsset(bs.shop_image_url),
      isActive: bs.branch?.is_active ?? true,
    };
  });

  // ── Sort branches ─────────────────────────────────────────
  branches.sort((a, b) => {
    // Enabled branches before disabled
    if (a.marketplaceEnabled !== b.marketplaceEnabled) {
      return a.marketplaceEnabled ? -1 : 1;
    }

    if (hasLocation) {
      const dA = a.distanceKm ?? Infinity;
      const dB = b.distanceKm ?? Infinity;
      return dA - dB;
    }

    return (a.branchName ?? "").localeCompare(b.branchName ?? "");
  });

  const name = profile.storefront_name || profile.shop.business_name;

  return {
    shopId: profile.shop_id,
    name,
    description: profile.storefront_description ?? null,
    // CHANGED: marketplace assets, resolve against backend origin
    logoUrl: resolveMarketplaceAsset(profile.logo_url),
    bannerUrl: resolveMarketplaceAsset(profile.banner_url),
    supportPhone: profile.support_phone ?? null,
    marketplaceStatus: profile.marketplace_status,
    isLive: profile.is_live,
    branches,
    rating: null,
  };
}

// ── GET BRANCH MEDICINES ──────────────────────────────────────

/**
 * Paginated medicines listed by a specific branch.
 * Only returns visible, in-stock listings.
 * Supports in-shop search by medicine name, brand, generic name.
 *
 * Returns the same toFeedItem shape as the main feed so MedicineCard
 * and ProductCard work without modification.
 *
 * prescriptionRequired is now driven by the branch-specific
 * listing.requires_prescription value, not the master scraped flag.
 *
 * @param {string} shopId
 * @param {string} branchId
 * @param {object} opts
 * @param {string} [opts.search]
 * @param {number} [opts.page]
 * @param {number} [opts.limit]
 */
export async function getBranchMedicines(
  shopId,
  branchId,
  { search, page = 1, limit = 20 }
) {
  const skip = (page - 1) * limit;

  // Verify the branch belongs to the shop and is marketplace-onboarded
  const branch = await prisma.branchMarketplaceSettings.findFirst({
    where: {
      branch_id: branchId,
      marketplaceProfile: { shop_id: shopId, is_live: true },
    },
    select: { branch_id: true },
  });

  if (!branch) return null;

  // ── Build search filter ───────────────────────────────────
  const searchFilter =
    search && search.trim().length >= 1
      ? {
          OR: [
            {
              linkedVariant: {
                name: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              linkedVariant: {
                brand: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              linkedVariant: {
                master: {
                  generic_name: {
                    contains: search.trim(),
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {};

  const where = {
    shop_id: shopId,
    branch_id: branchId,
    is_visible: true,
    stock_status: "IN_STOCK",
    ...searchFilter,
  };

  const [listings, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      orderBy: { linkedVariant: { name: "asc" } },
      skip,
      take: limit,
      select: {
        listing_id: true,
        marketplace_price: true,
        requires_prescription: true,
        stock_status: true,
        linkedVariant: {
          select: VARIANT_SELECT,
        },
      },
    }),
    prisma.marketplaceListing.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Shape variants using toFeedItem — identical output to medicines feed.
  // Pass the branch-specific requires_prescription as the override so
  // prescriptionRequired reflects what THIS branch has configured,
  // not the scraped master value.
  const medicines = listings
    .filter((l) => l.linkedVariant)
    .map((l) => ({
      ...toFeedItem(l.linkedVariant, l.requires_prescription), // PASS BRANCH-SPECIFIC VALUE
      // Real listing price — non-null when the shop has set a price.
      // Frontend uses this if present, falls back to generateMarketplaceData
      // for the demo price display.
      listingPrice: l.marketplace_price ? Number(l.marketplace_price) : null,
      requiresPrescription: l.requires_prescription, // Keep for backward compatibility
      stockStatus: l.stock_status,
    }));

  return {
    medicines,
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