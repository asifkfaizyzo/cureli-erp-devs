// backend/src/modules/mobile/orders/mobile.orders.routes.js

import { Router } from 'express';
import { mobileAuth } from '../../../middleware/mobile.auth.js';
import {
  placeOrderHandler,
  listOrdersHandler,
  getOrderDetailHandler,
  cancelOrderHandler,
  getPrescriptionUrlHandler,
  getReorderItemsHandler,
} from './mobile.orders.controller.js';

const router = Router();

router.use(mobileAuth);

router.post('/',                                                    placeOrderHandler);
router.get('/',                                                     listOrdersHandler);
router.get('/:orderId',                                             getOrderDetailHandler);
router.post('/:orderId/cancel',                                     cancelOrderHandler);
router.get('/:orderId/reorder-items',                               getReorderItemsHandler);
router.get('/:orderId/prescriptions/:prescriptionId/url',           getPrescriptionUrlHandler);

export default router;