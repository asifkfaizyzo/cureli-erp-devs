// ============================================
// pharmacy-web/src/api/marketplaceOrders.js
// ============================================

import API from './axios';

/**
 * GET /api/marketplace-orders
 * Supports ?status=PLACED or ?status=ACCEPTED,READY_FOR_PICKUP
 */
export const getOrders = (params = {}) =>
  API.get('/marketplace-orders', { params });

/**
 * GET /api/marketplace-orders/:orderId
 */
export const getOrderDetail = (orderId) =>
  API.get(`/marketplace-orders/${orderId}`);

/**
 * POST /api/marketplace-orders/:orderId/accept
 */
export const acceptOrder = (orderId) =>
  API.post(`/marketplace-orders/${orderId}/accept`);

/**
 * POST /api/marketplace-orders/:orderId/reject
 */
export const rejectOrder = (orderId, body) =>
  API.post(`/marketplace-orders/${orderId}/reject`, body);

/**
 * POST /api/marketplace-orders/:orderId/ready
 */
export const markReady = (orderId) =>
  API.post(`/marketplace-orders/${orderId}/ready`);

/**
 * POST /api/marketplace-orders/:orderId/complete
 */
export const completeOrder = (orderId) =>
  API.post(`/marketplace-orders/${orderId}/complete`);

/**
 * GET /api/marketplace-orders/:orderId/prescriptions/:prescriptionId/url
 */
export const getPrescriptionUrl = (orderId, prescriptionId) =>
  API.get(`/marketplace-orders/${orderId}/prescriptions/${prescriptionId}/url`);