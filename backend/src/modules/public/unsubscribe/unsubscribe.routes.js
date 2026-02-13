// backend/src/modules/public/unsubscribe/unsubscribe.routes.js

import { Router } from 'express';
import express from 'express';
import * as controller from './unsubscribe.controller.js';

const router = Router();

// ============================================
// MIDDLEWARE: Parse URL-encoded bodies (for form submission)
// ============================================

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

/**
 * Unsubscribe page (renders HTML)
 * GET /api/public/unsubscribe/:token?email=xxx
 */
router.get(
  '/unsubscribe/:token',
  controller.unsubscribePageController
);

/**
 * Process unsubscribe (form submission)
 * POST /api/public/unsubscribe/:token
 */
router.post(
  '/unsubscribe/:token',
  controller.processUnsubscribeController
);

/**
 * One-click unsubscribe (RFC 8058)
 * POST /api/public/unsubscribe/one-click
 */
router.post(
  '/unsubscribe/one-click',
  controller.oneClickUnsubscribeController
);

/**
 * API endpoint (JSON response)
 * POST /api/public/unsubscribe/api
 */
router.post(
  '/unsubscribe/api',
  controller.unsubscribeApiController
);

/**
 * Check subscription status
 * GET /api/public/unsubscribe/status?email=xxx
 */
router.get(
  '/unsubscribe/status',
  controller.checkStatusController
);

export default router;