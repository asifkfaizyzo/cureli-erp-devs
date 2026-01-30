// ============================================
// USER NOTIFICATIONS ROUTES
// ============================================

import { Router } from 'express';
import * as controller from './userNotifications.controller.js';
import { requireAuth } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import {
  listNotificationsSchema,
  markAsReadSchema,
  markAllAsReadSchema,
  deleteNotificationSchema,
  clearInventoryAlertsSchema,
} from './userNotifications.schema.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/notifications
 * @desc    Get paginated list of notifications
 * @access  Private
 */
router.get(
  '/',
  validate(listNotificationsSchema.query, 'query'),
  controller.listNotifications
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count (for badge)
 * @access  Private
 */
router.get(
  '/unread-count',
  controller.getUnreadCount
);

/**
 * @route   GET /api/notifications/recent
 * @desc    Get recent notifications (for dropdown)
 * @access  Private
 */
router.get(
  '/recent',
  controller.getRecentNotifications
);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 * @note    This must come BEFORE /:id routes
 */
router.patch(
  '/read-all',
  validate(markAllAsReadSchema.body, 'body'),
  controller.markAllAsRead
);

/**
 * @route   POST /api/notifications/clear-inventory-alerts
 * @desc    Clear inventory alerts for specific item
 * @access  Private
 */
router.post(
  '/clear-inventory-alerts',
  validate(clearInventoryAlertsSchema.body, 'body'),
  controller.clearInventoryAlerts
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification
 * @access  Private
 */
router.get(
  '/:id',
  validate(markAsReadSchema.params, 'params'),
  controller.getNotification
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.patch(
  '/:id/read',
  validate(markAsReadSchema.params, 'params'),
  controller.markAsRead
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete(
  '/:id',
  validate(deleteNotificationSchema.params, 'params'),
  controller.deleteNotification
);

export default router;