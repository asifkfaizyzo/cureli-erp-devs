// ============================================
// backend/src/modules/marketplace-orders/marketplace.orders.routes.js
// ============================================

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  listOrders,
  getOrderDetail,
  acceptOrder,
  rejectOrder,
  markReady,
  completeOrder,
  getPrescriptionUrl,
} from './marketplace.orders.controller.js';

const router = Router();

// All routes require ERP authentication
router.use(requireAuth);

/**
 * GET /api/marketplace-orders
 * List orders — supports ?status=PLACED or ?status=ACCEPTED,READY_FOR_PICKUP
 */
router.get('/', listOrders);

/**
 * GET /api/marketplace-orders/:orderId
 */
router.get('/:orderId', getOrderDetail);

/**
 * POST /api/marketplace-orders/:orderId/accept
 */
router.post('/:orderId/accept', acceptOrder);

/**
 * POST /api/marketplace-orders/:orderId/reject
 * Body: { rejection_reason, rejection_reason_other? }
 */
router.post('/:orderId/reject', rejectOrder);

/**
 * POST /api/marketplace-orders/:orderId/ready
 */
router.post('/:orderId/ready', markReady);

/**
 * POST /api/marketplace-orders/:orderId/complete
 */
router.post('/:orderId/complete', completeOrder);

/**
 * GET /api/marketplace-orders/:orderId/prescriptions/:prescriptionId/url
 */
router.get('/:orderId/prescriptions/:prescriptionId/url', getPrescriptionUrl);

export default router;