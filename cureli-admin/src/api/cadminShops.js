// src/api/cadminShops.js

import CAdminAPI from "./axios";

/**
 * Fetch shops with server-side filtering/sorting/pagination
 */
export function getShops(params = {}) {
  return CAdminAPI.get("/shops", { params });
}

/**
 * Fetch single shop with full details
 */
export function getShopById(shopId) {
  return CAdminAPI.get(`/shops/${shopId}`);
}

/**
 * Update shop details
 */
export function updateShop(shopId, data) {
  return CAdminAPI.patch(`/shops/${shopId}`, data);
}

/**
 * Toggle shop active status (suspend/activate)
 */
export function toggleShopActive(shopId, isActive) {
  return CAdminAPI.patch(`/shops/${shopId}/toggle-active`, { is_active: isActive });
}

/**
 * Get all available plans
 */
export function getPlans() {
  return CAdminAPI.get("/plans");
}

/**
 * Create a custom plan
 */
export function createCustomPlan(data) {
  return CAdminAPI.post("/plans/custom", data);
}

/**
 * Update shop subscription (change plan)
 */
export function updateShopSubscription(shopId, planId) {
  return CAdminAPI.patch(`/shops/${shopId}/subscription`, { plan_id: planId });
}

/**
 * Verify a shop document
 */
export function verifyShopFile(fileId) {
  return CAdminAPI.patch(`/files/${fileId}/verify`);
}

/**
 * Reject a shop document
 */
export function rejectShopFile(fileId, reason) {
  return CAdminAPI.patch(`/files/${fileId}/reject`, { reason });
}

/**
 * Upload/replace a shop document (Admin on behalf of shop)
 */
export function uploadShopDocument(shopId, fileType, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("file_type", fileType);

  return CAdminAPI.post(`/shops/${shopId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * Get shop statistics
 */
export function getShopStats() {
  return CAdminAPI.get("/shops/stats");
}