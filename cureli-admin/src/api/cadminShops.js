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

// ... existing imports and functions ...

/**
 * Create a custom plan for a specific shop
 * Creates as CUSTOM type linked to the shop
 */
export function createCustomPlan(data, shopId, shopName) {
  // Auto-generate name with shop name
  const autoName = data.name || `Custom - ${shopName} - ${data.max_users}U/${data.max_branches}B`;
  
  return CAdminAPI.post("/plans", {
    name: autoName,
    description: data.description || `Custom plan for ${shopName} with ${data.max_users} users and ${data.max_branches} branches`,
    price: data.price || 0,
    max_users: data.max_users,
    max_branches: data.max_branches,
    is_highlighted: false,
    type: "CUSTOM",  // NEW: Set type to CUSTOM
    created_for_shop_id: shopId,  // NEW: Link to shop
  });
}

/**
 * Activate a draft plan
 */
export function activatePlan(planId) {
  return CAdminAPI.post(`/plans/${planId}/activate`);
}

// ... rest of existing functions ...

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