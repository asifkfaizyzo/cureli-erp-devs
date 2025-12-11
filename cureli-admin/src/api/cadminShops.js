// src/api/cadminShops.js

import CAdminAPI from "./axios";

/**
 * Fetch shops with server-side filtering/sorting/pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.search - Search term (business name, owner, GST, city, state, pincode)
 * @param {string} params.verification_status - pending, pending_review, verified, rejected, partially_rejected
 * @param {string} params.subscription_status - active, expired, none
 * @param {boolean} params.is_active - Active status filter
 * @param {string} params.date_start - Created date range start
 * @param {string} params.date_end - Created date range end
 * @param {string} params.sort_by - Sort field
 * @param {string} params.sort_order - asc or desc
 */
export function getShops(params = {}) {
  return CAdminAPI.get("/shops", { params });
}

/**
 * Fetch single shop with full details
 * @param {string} shopId - Shop UUID
 */
export function getShopById(shopId) {
  return CAdminAPI.get(`/shops/${shopId}`);
}

/**
 * Update shop details
 * @param {string} shopId - Shop UUID
 * @param {Object} data - Fields to update
 */
export function updateShop(shopId, data) {
  return CAdminAPI.patch(`/shops/${shopId}`, data);
}

/**
 * Toggle shop active status (suspend/activate)
 * @param {string} shopId - Shop UUID
 * @param {boolean} isActive - true = activate, false = suspend
 */
export function toggleShopActive(shopId, isActive) {
  return CAdminAPI.patch(`/shops/${shopId}/toggle-active`, { is_active: isActive });
}

/**
 * Get all available plans (for subscription dropdown)
 */
export function getPlans() {
  return CAdminAPI.get("/plans");
}

/**
 * Create a custom plan
 * @param {Object} data - { max_users, max_branches }
 */
export function createCustomPlan(data) {
  return CAdminAPI.post("/plans/custom", data);
}

/**
 * Update shop subscription (change plan)
 * @param {string} shopId - Shop UUID
 * @param {string} planId - New plan UUID
 */
export function updateShopSubscription(shopId, planId) {
  return CAdminAPI.patch(`/shops/${shopId}/subscription`, { plan_id: planId });
}

/**
 * Verify a shop document
 * @param {string} fileId - File UUID
 */
export function verifyShopFile(fileId) {
  return CAdminAPI.patch(`/docs/files/${fileId}/verify`);
}

/**
 * Reject a shop document
 * @param {string} fileId - File UUID
 * @param {string} reason - Rejection reason
 */
export function rejectShopFile(fileId, reason) {
  return CAdminAPI.patch(`/docs/files/${fileId}/reject`, { reason });
}

/**
 * Upload/replace a shop document (CAdmin on behalf of shop)
 * @param {string} shopId - Shop UUID
 * @param {string} fileType - Document type
 * @param {File} file - File to upload
 */
export function uploadShopDocument(shopId, fileType, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("file_type", fileType);
  
  return CAdminAPI.post(`/shops/${shopId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}