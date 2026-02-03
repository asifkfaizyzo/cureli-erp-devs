// ============================================
// backend/src/modules/notifications/cadmin/cadminNotifications.routes.js
// ============================================

import { Router } from 'express';
import * as controller from './cadminNotifications.controller.js';
import { requireCAdmin } from '../../../middleware/requireCAdmin.js';
import { validate } from '../../../middleware/validate.js';
import * as schema from './cadminNotifications.schema.js';

const router = Router();

// All routes require CAdmin auth
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
 * @note    This must come BEFORE /:id routes
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