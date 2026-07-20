// backend/src/modules/prescription-requests/prescription.requests.erp.routes.js

import { Router } from 'express';
import { auth }   from '../../middleware/auth.js';
import {
  listErpRequests,
  getErpDetail,
  getErpFileUrl,
  submitErpQuote,
  declineErpRequest,
} from './prescription.requests.erp.controller.js';

const router = Router();

// All routes require ERP auth
router.use(auth);

// GET /api/prescription-requests
// List all prescription requests for authenticated shop
router.get('/', listErpRequests);

// GET /api/prescription-requests/:recipientId
// Full detail for one recipient/request
router.get('/:recipientId', getErpDetail);

// GET /api/prescription-requests/:recipientId/files/:fileId/url
// Signed URL to view a prescription image
router.get('/:recipientId/files/:fileId/url', getErpFileUrl);

// POST /api/prescription-requests/:recipientId/quote
// Submit or replace a quote
router.post('/:recipientId/quote', submitErpQuote);

// POST /api/prescription-requests/:recipientId/decline
// Decline to fulfil this request
router.post('/:recipientId/decline', declineErpRequest);

export default router;