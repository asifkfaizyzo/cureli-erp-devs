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
 * Get all available plans (ACTIVE plans only for shop subscription)
 * Uses the new plan API with status filter
 */
export function getPlans() {
  // Only fetch ACTIVE plans for shop subscription assignment
  return CAdminAPI.get("/plans", { params: { status: "ACTIVE" } });
}

/**
 * Get all plans including drafts (for admin viewing)
 */
export function getAllPlans(params = {}) {
  return CAdminAPI.get("/plans", { params });
}

/**
 * Create a custom plan (creates as DRAFT, needs separate activation)
 * This uses the new plan creation endpoint
 */
export function createCustomPlan(data) {
  // The new API expects: name, description, price, max_users, max_branches, is_highlighted
  return CAdminAPI.post("/plans", {
    name: data.name || `Custom - ${data.max_users}U/${data.max_branches}B`,
    description: data.description || `Custom plan with ${data.max_users} users and ${data.max_branches} branches`,
    price: data.price || 0, // Price in paisa (0 for custom/negotiated)
    max_users: data.max_users,
    max_branches: data.max_branches,
    is_highlighted: false,
  });
}

/**
 * Activate a draft plan (DRAFT -> ACTIVE)
 */
export function activatePlan(planId) {
  return CAdminAPI.post(`/plans/${planId}/activate`);
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