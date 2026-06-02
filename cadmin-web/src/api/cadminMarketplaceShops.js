// cadmin-web/src/api/cadminMarketplaceShops.js

import CAdminAPI from "./axios";

// ── Shops ──────────────────────────────────────────────────────
export const getMarketplaceShops = (params = {}) =>
  CAdminAPI.get("/marketplace/shops", { params });

export const getMarketplaceShopById = (shopId) =>
  CAdminAPI.get(`/marketplace/shops/${shopId}`);

export const blockMarketplaceShop = (shopId, block) =>
  CAdminAPI.patch(`/marketplace/shops/${shopId}/block`, { block });

// ── Branches ───────────────────────────────────────────────────
export const blockMarketplaceBranch = (shopId, branchId, block) =>
  CAdminAPI.patch(
    `/marketplace/shops/${shopId}/branches/${branchId}/block`,
    { block }
  );

export const updateBranchMarketplaceConfig = (shopId, branchId, data) =>
  CAdminAPI.patch(
    `/marketplace/shops/${shopId}/branches/${branchId}/config`,
    data
  );

// ── Places proxy ───────────────────────────────────────────────
export const searchPlaces = (query) =>
  CAdminAPI.get("/marketplace/places/search", { params: { query } });

export const getPlaceDetails = (place_id) =>
  CAdminAPI.get("/marketplace/places/details", { params: { place_id } });