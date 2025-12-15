// ============================================
// CADMIN PLANS API
// ============================================
// API functions for subscription plan management
// Uses existing CAdminAPI axios instance

import CAdminAPI from "./axios";

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get plan statistics (counts by status)
 */
export const getPlanStats = async () => {
  const response = await CAdminAPI.get("/plans/stats");
  return response.data;
};

/**
 * List plans with filters and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.search - Search term
 * @param {string} params.status - Filter by status (DRAFT|ACTIVE|DEPRECATED|SUSPENDED)
 * @param {string} params.sort_by - Sort field (created_at|name|price|status)
 * @param {string} params.sort_order - Sort order (asc|desc)
 * @param {boolean} params.include_deleted - Include soft-deleted plans
 */
export const getPlans = async (params = {}) => {
  const response = await CAdminAPI.get("/plans", { params });
  return response.data;
};

/**
 * Get single plan by ID
 * @param {string} planId - Plan UUID
 */
export const getPlanById = async (planId) => {
  const response = await CAdminAPI.get(`/plans/${planId}`);
  return response.data;
};

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Create new plan (always creates as DRAFT)
 * @param {Object} data - Plan data
 * @param {string} data.name - Plan name
 * @param {string} data.description - Plan description
 * @param {number} data.price - Price in paisa (0 for free)
 * @param {number} data.max_users - User limit (-1 for unlimited)
 * @param {number} data.max_branches - Branch limit (-1 for unlimited)
 * @param {boolean} data.is_highlighted - Featured flag
 */
export const createPlan = async (data) => {
  const response = await CAdminAPI.post("/plans", data);
  return response.data;
};

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update plan details (DRAFT plans only)
 * @param {string} planId - Plan UUID
 * @param {Object} data - Fields to update (partial)
 */
export const updatePlan = async (planId, data) => {
  const response = await CAdminAPI.patch(`/plans/${planId}`, data);
  return response.data;
};

// ============================================
// LIFECYCLE TRANSITIONS
// ============================================

/**
 * Activate a plan (DRAFT -> ACTIVE)
 * Makes plan live and immutable
 * @param {string} planId - Plan UUID
 */
export const activatePlan = async (planId) => {
  const response = await CAdminAPI.post(`/plans/${planId}/activate`);
  return response.data;
};

/**
 * Suspend a plan (ACTIVE -> DEPRECATED/SUSPENDED)
 * @param {string} planId - Plan UUID
 */
export const suspendPlan = async (planId) => {
  const response = await CAdminAPI.post(`/plans/${planId}/suspend`);
  return response.data;
};

/**
 * Reactivate a suspended plan (SUSPENDED -> ACTIVE)
 * @param {string} planId - Plan UUID
 */
export const reactivatePlan = async (planId) => {
  const response = await CAdminAPI.post(`/plans/${planId}/reactivate`);
  return response.data;
};

/**
 * Clone a plan (creates new DRAFT copy)
 * @param {string} planId - Plan UUID to clone
 * @param {string} newName - Optional custom name for clone
 */
export const clonePlan = async (planId, newName = null) => {
  const response = await CAdminAPI.post(`/plans/${planId}/clone`, {
    name: newName,
  });
  return response.data;
};

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Soft delete a plan (DRAFT plans only)
 * @param {string} planId - Plan UUID
 */
export const deletePlan = async (planId) => {
  const response = await CAdminAPI.delete(`/plans/${planId}`);
  return response.data;
};

// ============================================
// PRICE CONVERSION HELPERS
// ============================================

/**
 * Convert rupees to paisa for API
 * @param {number} rupees - Amount in rupees
 * @returns {number} Amount in paisa
 */
export const toPaisa = (rupees) => Math.round(rupees * 100);

/**
 * Convert paisa to rupees for display
 * @param {number} paisa - Amount in paisa
 * @returns {number} Amount in rupees
 */
export const fromPaisa = (paisa) => paisa / 100;

// ============================================
// LEGACY SUPPORT (for existing subscription.js usage)
// ============================================

/**
 * Get all visible/active plans (for customer-facing pages)
 * This matches the existing getPlans() in subscription.js
 */
export const getActivePlans = async () => {
  const response = await CAdminAPI.get("/plans", {
    params: { status: "ACTIVE" },
  });
  return response.data;
};