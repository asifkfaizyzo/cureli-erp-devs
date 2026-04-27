// ============================================
// backend/src/modules/notifications/cadmin/cadminNotifications.routes.js
// ============================================

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import * as controller from './cadminNotifications.controller.js';
import { requireCAdmin } from '../../../middleware/requireCAdmin.js';
import { validate } from '../../../middleware/validate.js';
import { ADMIN_ACCESS_SECRET } from '../../../config/cadmin_jwt.js';
import { sseService } from '../../../services/sse.service.js';
import prisma from '../../../config/prisma.js';
import * as schema from './cadminNotifications.schema.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// SSE Stream Route
// NOTE: Registered BEFORE router.use(requireCAdmin) — does inline JWT auth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /cadmin/notifications/stream
 * @desc    SSE stream for real-time CAdmin notifications
 * @access  Public (inline JWT verification)
 */
router.get('/notifications/stream', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  try {
    const payload = jwt.verify(token, ADMIN_ACCESS_SECRET);

    // Verify the CAdmin account is active
    const admin = await prisma.cAdmin.findUnique({
      where: { cadmin_id: payload.cadmin_id },
      select: { is_active: true },
    });

    if (!admin || !admin.is_active) return res.status(403).end();

    const cadminId = payload.cadmin_id;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
    });

    // Register client with SSE service
    sseService.addCAdminClient(cadminId, res);

    // Send initial connected event with unread count
    const unreadCount = await prisma.notification.count({
      where: { cadmin_id: cadminId, is_read: false },
    });
    res.write(sseService.formatSSEMessage('connected', { unread_count: unreadCount }));

    // Heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      sseService.removeCAdminClient(cadminId, res);
    });

  } catch (err) {
    return res.status(401).end();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Protected Routes
// NOTE: requireCAdmin middleware applied to ALL routes below this point
// ─────────────────────────────────────────────────────────────────────────────

router.use(requireCAdmin);

/**
 * @route   GET /cadmin/notifications
 * @desc    Get paginated list of notifications
 * @access  CAdmin
 */
router.get(
  '/notifications/',
  validate(schema.listNotificationsQuerySchema, 'query'),
  controller.listNotifications
);

/**
 * @route   GET /cadmin/notifications/unread-count
 * @desc    Get unread notification count (for badge)
 * @access  CAdmin
 */
router.get(
  '/notifications/unread-count',
  controller.getUnreadCount
);

/**
 * @route   GET /cadmin/notifications/recent
 * @desc    Get recent notifications (for dropdown)
 * @access  CAdmin
 */
router.get(
  '/notifications/recent',
  controller.getRecentNotifications
);

/**
 * @route   PATCH /cadmin/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  CAdmin
 * @note    Must come BEFORE /:id routes to avoid param conflict
 */
router.patch(
  '/notifications/read-all',
  validate(schema.markAllAsReadBodySchema, 'body'),
  controller.markAllAsRead
);

/**
 * @route   GET /cadmin/notifications/:id
 * @desc    Get single notification
 * @access  CAdmin
 */
router.get(
  '/notifications/:id',
  validate(schema.notificationIdParamSchema, 'params'),
  controller.getNotification
);

/**
 * @route   PATCH /cadmin/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  CAdmin
 */
router.patch(
  '/notifications/:id/read',
  validate(schema.notificationIdParamSchema, 'params'),
  controller.markAsRead
);

/**
 * @route   DELETE /cadmin/notifications/:id
 * @desc    Delete a notification
 * @access  CAdmin
 */
router.delete(
  '/notifications/:id',
  validate(schema.notificationIdParamSchema, 'params'),
  controller.deleteNotification
);

export default router;