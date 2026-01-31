// ============================================
// CADMIN BROADCAST API CLIENT
// ============================================

import CAdminAPI from "./axios";

// ============================================
// PREVIEW
// ============================================

/**
 * Preview recipient count for given filters
 * @param {Object} filters - Target filters (shop_ids, plan_ids, date range, etc.)
 * @returns {Promise<{total: number, by_shop: Object, filters_applied: Object}>}
 */
export function previewBroadcast(filters) {
  return CAdminAPI.post("/broadcast/inapp/preview", {
    target_filters: filters,
  });
}

// ============================================
// SEND NOW (IMMEDIATE)
// ============================================

/**
 * Send broadcast immediately (no campaign record)
 * @param {Object} data - { title, message, priority, target_filters }
 * @returns {Promise}
 */
export function sendBroadcastNow(data) {
  return CAdminAPI.post("/broadcast/inapp/send-now", data);
}

// ============================================
// DRAFT MANAGEMENT
// ============================================

/**
 * Create a draft campaign
 * @param {Object} data - { title, message, priority, target_filters }
 * @returns {Promise}
 */
export function createDraft(data) {
  return CAdminAPI.post("/broadcast/inapp/draft", data);
}

/**
 * Update a draft campaign
 * @param {string} campaignId
 * @param {Object} data - Partial update { title?, message?, priority?, target_filters? }
 * @returns {Promise}
 */
export function updateDraft(campaignId, data) {
  return CAdminAPI.put(`/broadcast/inapp/${campaignId}`, data);
}

/**
 * Delete a draft
 * @param {string} campaignId
 * @returns {Promise}
 */
export function deleteDraft(campaignId) {
  return CAdminAPI.delete(`/broadcast/inapp/${campaignId}`);
}

// ============================================
// SCHEDULING
// ============================================

/**
 * Schedule a draft for future send
 * @param {string} campaignId
 * @param {string} scheduledFor - ISO 8601 datetime string
 * @returns {Promise}
 */
export function scheduleBroadcast(campaignId, scheduledFor) {
  return CAdminAPI.post(`/broadcast/inapp/${campaignId}/schedule`, {
    scheduled_for: scheduledFor,
  });
}

/**
 * Cancel a scheduled broadcast
 * @param {string} campaignId
 * @returns {Promise}
 */
export function cancelScheduled(campaignId) {
  return CAdminAPI.delete(`/broadcast/inapp/${campaignId}`);
}

// ============================================
// LIST VIEWS
// ============================================

/**
 * Get drafts for current CAdmin
 * @param {number} page
 * @param {number} limit
 * @returns {Promise}
 */
export function getDrafts(page = 1, limit = 10) {
  return CAdminAPI.get("/broadcast/inapp/drafts", {
    params: { page, limit },
  });
}

/**
 * Get scheduled broadcasts
 * @param {number} page
 * @param {number} limit
 * @returns {Promise}
 */
export function getScheduled(page = 1, limit = 10) {
  return CAdminAPI.get("/broadcast/inapp/scheduled", {
    params: { page, limit },
  });
}

/**
 * Get sent broadcast history
 * @param {number} page
 * @param {number} limit
 * @returns {Promise}
 */
export function getHistory(page = 1, limit = 20) {
  return CAdminAPI.get("/broadcast/inapp/history", {
    params: { page, limit },
  });
}

/**
 * Get single campaign by ID
 * @param {string} campaignId
 * @returns {Promise}
 */
export function getCampaignById(campaignId) {
  return CAdminAPI.get(`/broadcast/inapp/${campaignId}`);
}

// ============================================
// HELPER: GET ACTIVE PLANS (for filter dropdown)
// ============================================

/**
 * Get all active plans (for plan filter dropdown)
 * @returns {Promise}
 */
export function getActivePlans() {
  return CAdminAPI.get("/plans", {
    params: {
      status: "active",
      type: "pre_made",
      page: 1,
      limit: 100,
    },
  });
}

// ============================================
// HELPER: SEARCH SHOPS (for shop filter dropdown)
// ============================================

/**
 * Search shops by name (for shop filter dropdown)
 * @param {string} searchQuery
 * @returns {Promise}
 */
export function searchShops(searchQuery = "", page = 1, limit = 50) {
  return CAdminAPI.get("/shops", {
    params: {
      search: searchQuery,
      page,
      limit,
      verification_status: "verified", // Only verified shops
    },
  });
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Preview
  previewBroadcast,

  // Send
  sendBroadcastNow,

  // Drafts
  createDraft,
  updateDraft,
  deleteDraft,

  // Scheduling
  scheduleBroadcast,
  cancelScheduled,

  // Lists
  getDrafts,
  getScheduled,
  getHistory,
  getCampaignById,

  // Helpers
  getActivePlans,
  searchShops,
};