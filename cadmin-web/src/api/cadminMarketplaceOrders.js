// cadmin-web/src/api/cadminMarketplaceOrders.js

import CAdminAPI from "./axios";

/**
 * List all marketplace orders (paginated, filterable).
 * @param {Object} params - { page, limit, search, status }
 */
export function getMarketplaceOrders(params = {}) {
  return CAdminAPI.get("/marketplace-orders", { params });
}

/**
 * Get full detail of a single order.
 * @param {string} orderId
 */
export function getMarketplaceOrderById(orderId) {
  return CAdminAPI.get(`/marketplace-orders/${orderId}`);
}