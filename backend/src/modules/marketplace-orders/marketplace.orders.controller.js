// ============================================
// backend/src/modules/marketplace-orders/marketplace.orders.controller.js
// ============================================

import {
  getErpOrders,
  getErpOrderDetail,
  transitionOrderStatus,
  getPrescriptionSignedUrl,
} from './marketplace.orders.service.js';
import {
  rejectOrderSchema,
  listOrdersSchema,
} from './marketplace.orders.schema.js';
import { success, fail } from '../../utils/response.js';

/**
 * GET /api/marketplace-orders
 * List orders for the pharmacy with optional status filter.
 */
export async function listOrders(req, res) {
  try {
    const parsed = listOrdersSchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0].message, 400);
    }

    const result = await getErpOrders(req.user.shop_id, parsed.data);
    return success(res, result, 'Orders fetched');
  } catch (err) {
    console.error('[ERP Orders] listOrders error:', err.message);
    return fail(res, 'Failed to fetch orders', 500);
  }
}

/**
 * GET /api/marketplace-orders/:orderId
 * Get full order detail.
 */
export async function getOrderDetail(req, res) {
  try {
    const order = await getErpOrderDetail(
      req.params.orderId,
      req.user.shop_id,
    );
    return success(res, order, 'Order fetched');
  } catch (err) {
    console.error('[ERP Orders] getOrderDetail error:', err.message);
    if (err.message === 'Order not found') {
      return fail(res, 'Order not found', 404);
    }
    return fail(res, 'Failed to fetch order', 500);
  }
}

/**
 * POST /api/marketplace-orders/:orderId/accept
 */
export async function acceptOrder(req, res) {
  try {
    const result = await transitionOrderStatus({
      order_id: req.params.orderId,
      shop_id: req.user.shop_id,
      target_status: 'ACCEPTED',
      acting_user_id: req.user.user_id,
    });
    return success(res, result, 'Order accepted');
  } catch (err) {
    console.error('[ERP Orders] acceptOrder error:', err.message);
    if (err.message === 'Order not found') {
      return fail(res, 'Order not found', 404);
    }
    if (err.message.startsWith('Cannot transition')) {
      return fail(res, err.message, 409);
    }
    return fail(res, 'Failed to accept order', 500);
  }
}

/**
 * POST /api/marketplace-orders/:orderId/reject
 */
export async function rejectOrder(req, res) {
  try {
    const parsed = rejectOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0].message, 400);
    }

    const result = await transitionOrderStatus({
      order_id: req.params.orderId,
      shop_id: req.user.shop_id,
      target_status: 'REJECTED',
      acting_user_id: req.user.user_id,
      reason: parsed.data.rejection_reason,
      reason_other: parsed.data.rejection_reason_other ?? null,
    });
    return success(res, result, 'Order rejected');
  } catch (err) {
    console.error('[ERP Orders] rejectOrder error:', err.message);
    if (err.message === 'Order not found') {
      return fail(res, 'Order not found', 404);
    }
    if (err.message.startsWith('Cannot transition')) {
      return fail(res, err.message, 409);
    }
    return fail(res, 'Failed to reject order', 500);
  }
}

/**
 * POST /api/marketplace-orders/:orderId/ready
 */
export async function markReady(req, res) {
  try {
    const result = await transitionOrderStatus({
      order_id: req.params.orderId,
      shop_id: req.user.shop_id,
      target_status: 'READY_FOR_PICKUP',
      acting_user_id: req.user.user_id,
    });
    return success(res, result, 'Order marked as ready for pickup');
  } catch (err) {
    console.error('[ERP Orders] markReady error:', err.message);
    if (err.message === 'Order not found') {
      return fail(res, 'Order not found', 404);
    }
    if (err.message.startsWith('Cannot transition')) {
      return fail(res, err.message, 409);
    }
    return fail(res, 'Failed to update order', 500);
  }
}

/**
 * POST /api/marketplace-orders/:orderId/complete
 */
export async function completeOrder(req, res) {
  try {
    const result = await transitionOrderStatus({
      order_id: req.params.orderId,
      shop_id: req.user.shop_id,
      target_status: 'COMPLETED',
      acting_user_id: req.user.user_id,
    });
    return success(res, result, 'Order completed');
  } catch (err) {
    console.error('[ERP Orders] completeOrder error:', err.message);
    if (err.message === 'Order not found') {
      return fail(res, 'Order not found', 404);
    }
    if (err.message.startsWith('Cannot transition')) {
      return fail(res, err.message, 409);
    }
    return fail(res, 'Failed to complete order', 500);
  }
}

/**
 * GET /api/marketplace-orders/:orderId/prescriptions/:prescriptionId/url
 */
export async function getPrescriptionUrl(req, res) {
  try {
    const result = await getPrescriptionSignedUrl(
      req.params.prescriptionId,
      'pharmacy',
      req.user.shop_id,
    );
    return success(res, result, 'Signed URL generated');
  } catch (err) {
    console.error('[ERP Orders] getPrescriptionUrl error:', err.message);
    if (err.message === 'Prescription not found') {
      return fail(res, 'Prescription not found', 404);
    }
    return fail(res, 'Failed to generate URL', 500);
  }
}