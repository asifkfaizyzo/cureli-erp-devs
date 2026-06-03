// ============================================
// backend/src/modules/mobile/orders/mobile.orders.routes.js
// ============================================

import { Router } from 'express';
import { mobileAuth } from '../../../middleware/mobile.auth.js';
import {
  placeOrderHandler,
  listOrdersHandler,
  getOrderDetailHandler,
  cancelOrderHandler,
  getPrescriptionUrlHandler,
} from './mobile.orders.controller.js';

const router = Router();

// All routes require mobile customer authentication
router.use(mobileAuth);

/**
 * POST /mobile/orders
 */
router.post('/', placeOrderHandler);

/**
 * GET /mobile/orders
 */
router.get('/', listOrdersHandler);

/**
 * GET /mobile/orders/:orderId
 */
router.get('/:orderId', getOrderDetailHandler);

/**
 * POST /mobile/orders/:orderId/cancel
 */
router.post('/:orderId/cancel', cancelOrderHandler);

/**
 * GET /mobile/orders/:orderId/prescriptions/:prescriptionId/url
 */
router.get('/:orderId/prescriptions/:prescriptionId/url', getPrescriptionUrlHandler);

export default router;