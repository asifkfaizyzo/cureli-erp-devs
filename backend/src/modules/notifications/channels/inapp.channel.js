// ============================================
// backend\src\modules\notifications\channels\inapp.channel.js
// ============================================

import prisma from '../../../config/prisma.js';
import { generateInAppContent } from '../templates/inapp/index.js';
import { EVENT_CONFIG } from '../notification.events.js';

/**
 * Send notifications via in-app channel
 * 
 * @param {string} eventType - Notification event type
 * @param {Array} recipients - Array of recipient objects from audience resolution
 * @param {Object} context - Event context data
 * @returns {Promise<{sent: number, failed: number, skipped: number}>}
 */
export async function sendViaInApp(eventType, recipients, context) {
  const result = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Filter to only User recipients (no CAdmin for in-app)
  const userRecipients = recipients.filter(r => r.type === 'user' && r.user_id);

  if (userRecipients.length === 0) {
    console.log(`[InApp Channel] No user recipients for ${eventType}`);
    return result;
  }

  // Get event config
  const eventConfig = EVENT_CONFIG[eventType];
  if (!eventConfig) {
    console.error(`[InApp Channel] Unknown event type: ${eventType}`);
    result.failed = userRecipients.length;
    result.errors.push({ error: `Unknown event type: ${eventType}` });
    return result;
  }

  // Generate content from template
  const content = generateInAppContent(eventType, context);
  if (!content) {
    console.error(`[InApp Channel] Failed to generate content for: ${eventType}`);
    result.failed = userRecipients.length;
    result.errors.push({ error: `No template for: ${eventType}` });
    return result;
  }

  const { title, message } = content;
  const priority = eventConfig.priority || 'normal';

  // Check if deduplication is needed
  const dedupEntity = eventConfig.dedupEntity;
  const dedupKey = dedupEntity ? buildDedupKey(eventType, dedupEntity, context) : null;

  // Process each recipient
  const notifications = [];

  for (const recipient of userRecipients) {
    try {
      // Check deduplication if needed
      if (dedupKey) {
        const shouldSkip = await checkDuplicateExists(recipient.user_id, dedupKey);
        if (shouldSkip) {
          result.skipped++;
          continue;
        }
      }

      notifications.push({
        user_id: recipient.user_id,
        event_type: eventType,
        title,
        message,
        context: sanitizeContext(context),
        shop_id: recipient.shop_id || context.shop_id || null,
        branch_id: recipient.branch_id || context.branch_id || null,
        dedup_key: dedupKey,
        priority,
        is_read: false,
      });
    } catch (error) {
      console.error(`[InApp Channel] Error preparing notification for user ${recipient.user_id}:`, error);
      result.failed++;
      result.errors.push({ user_id: recipient.user_id, error: error.message });
    }
  }

  // Batch insert notifications
  if (notifications.length > 0) {
    try {
      const created = await prisma.notification.createMany({
        data: notifications,
        skipDuplicates: true, // Extra safety for race conditions
      });

      result.sent = created.count;
      console.log(`[InApp Channel] Created ${created.count} notifications for ${eventType}`);
    } catch (error) {
      console.error(`[InApp Channel] Batch insert failed for ${eventType}:`, error);
      result.failed += notifications.length;
      result.errors.push({ error: error.message });
    }
  }

  return result;
}

// ─────────────────────────────────────────
// DEDUPLICATION HELPERS
// ─────────────────────────────────────────

/**
 * Build deduplication key for recurring alerts
 * Format: "EVENT_TYPE:entity_type:entity_id"
 */
function buildDedupKey(eventType, entityType, context) {
  let entityId = null;

  switch (entityType) {
    case 'inventory':
      entityId = context.inventory_id;
      break;
    case 'medicine':
      entityId = context.medicine_id;
      break;
    case 'subscription':
      entityId = context.subscription_id;
      break;
    default:
      entityId = context[`${entityType}_id`];
  }

  if (!entityId) {
    console.warn(`[InApp Channel] Cannot build dedup key: missing ${entityType}_id in context`);
    return null;
  }

  return `${eventType}:${entityType}:${entityId}`;
}

/**
 * Check if an unread notification with same dedup_key exists for user
 */
async function checkDuplicateExists(userId, dedupKey) {
  if (!dedupKey) return false;

  const existing = await prisma.notification.findFirst({
    where: {
      user_id: userId,
      dedup_key: dedupKey,
      is_read: false,
    },
    select: { notification_id: true },
  });

  return !!existing;
}

// ─────────────────────────────────────────
// CONTEXT SANITIZATION
// ─────────────────────────────────────────

/**
 * Sanitize context before storing in database
 * Remove sensitive fields, ensure JSON-serializable
 */
function sanitizeContext(context) {
  if (!context) return null;

  // Fields to exclude from stored context
  const sensitiveFields = [
    'password',
    'password_hash',
    'token',
    'otp',
    'reset_token',
    'secret',
  ];

  const sanitized = {};

  for (const [key, value] of Object.entries(context)) {
    // Skip sensitive fields
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      continue;
    }

    // Skip functions
    if (typeof value === 'function') {
      continue;
    }

    // Handle Date objects
    if (value instanceof Date) {
      sanitized[key] = value.toISOString();
      continue;
    }

    // Handle BigInt
    if (typeof value === 'bigint') {
      sanitized[key] = value.toString();
      continue;
    }

    sanitized[key] = value;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

// ─────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId, userId) {
  return prisma.notification.updateMany({
    where: {
      notification_id: notificationId,
      user_id: userId,
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId, filters = {}) {
  const where = {
    user_id: userId,
    is_read: false,
  };

  if (filters.shop_id) {
    where.shop_id = filters.shop_id;
  }

  if (filters.event_types && filters.event_types.length > 0) {
    where.event_type = { in: filters.event_types };
  }

  return prisma.notification.updateMany({
    where,
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId, filters = {}) {
  const where = {
    user_id: userId,
    is_read: false,
  };

  if (filters.shop_id) {
    where.shop_id = filters.shop_id;
  }

  return prisma.notification.count({ where });
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    shop_id = null,
    event_types = null,
  } = options;

  const where = { user_id: userId };

  if (unreadOnly) {
    where.is_read = false;
  }

  if (shop_id) {
    where.shop_id = shop_id;
  }

  if (event_types && event_types.length > 0) {
    where.event_type = { in: event_types };
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

/**
 * Delete old read notifications (cleanup job)
 */
export async function deleteOldNotifications(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return prisma.notification.deleteMany({
    where: {
      is_read: true,
      created_at: { lt: cutoffDate },
    },
  });
}

/**
 * Clear dedup key when condition is resolved
 * This allows new notification to be created if condition recurs
 */
export async function clearDedupNotification(userId, dedupKey) {
  return prisma.notification.updateMany({
    where: {
      user_id: userId,
      dedup_key: dedupKey,
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });
}

/**
 * Clear all dedup notifications for a specific inventory item
 * Use when stock is replenished above minimum level
 */
export async function clearInventoryAlerts(inventoryId) {
  const dedupPatterns = [
    `LOW_STOCK_ALERT:inventory:${inventoryId}`,
    `OUT_OF_STOCK_ALERT:inventory:${inventoryId}`,
    `NEAR_EXPIRY_ALERT:inventory:${inventoryId}`,
    `EXPIRED_STOCK_ALERT:inventory:${inventoryId}`,
  ];

  return prisma.notification.updateMany({
    where: {
      dedup_key: { in: dedupPatterns },
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });
}

export default {
  sendViaInApp,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotifications,
  deleteOldNotifications,
  clearDedupNotification,
  clearInventoryAlerts,
};