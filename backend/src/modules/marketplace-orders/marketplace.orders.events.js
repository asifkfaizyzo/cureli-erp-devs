// ============================================
// backend/src/modules/marketplace-orders/marketplace.orders.events.js
// ============================================

import prisma from '../../config/prisma.js';
import { sseService } from '../../services/sse.service.js';
import { notifyAsync, NOTIFICATION_EVENTS } from '../notifications/notification.service.js';

/**
 * Fire all events after a new order is placed.
 * Called AFTER the database transaction commits.
 *
 * Two independent events:
 * 1. In-app notification (existing pipeline) → updates notification bell
 * 2. Direct SSE event → updates Orders page list in real time
 *
 * @param {Object} order - The created MarketplaceOrder record
 */
export async function fireOrderPlacedEvents(order) {
  const {
    order_id,
    order_number,
    shop_id,
    branch_id,
    customer_name_snapshot,
    total_amount,
    requires_prescription,
    placed_at,
    items,
  } = order;

  const item_count = items?.length ?? 0;

  // ── 1. In-app notification via existing pipeline ──────────────────────────
  // resolveAudience will use audienceType: 'shop_users'
  // which fetches all active users for this shop_id
  notifyAsync({
    type: NOTIFICATION_EVENTS.MARKETPLACE_ORDER_PLACED,
    context: {
      shop_id,
      branch_id,
      order_id,
      order_number,
      customer_name: customer_name_snapshot,
      item_count,
      total_amount: Number(total_amount).toFixed(2),
    },
  });

  // ── 2. Direct SSE event for Orders page real-time update ─────────────────
  // Fetch all active user IDs for this shop
  // We do this separately from the notification pipeline
  // so the Orders page can update instantly without waiting for DB writes
  try {
    const shopUsers = await prisma.user.findMany({
      where: {
        shop_id,
        is_active: true,
      },
      select: { user_id: true },
    });

    const ssePayload = {
      order_id,
      order_number,
      customer_name: customer_name_snapshot,
      total_amount: Number(total_amount).toFixed(2),
      item_count,
      requires_prescription,
      placed_at,
    };

    for (const user of shopUsers) {
      sseService.notifyUser(user.user_id, 'marketplace_new_order', ssePayload);
    }

    console.log(
      `[OrderEvents] Fired marketplace_new_order SSE to ${shopUsers.length} users for shop ${shop_id}`,
    );
  } catch (err) {
    // SSE failure must never crash the order flow
    // The in-app notification is the fallback
    console.error('[OrderEvents] SSE dispatch failed:', err.message);
  }
}

/**
 * Fire events after an order status changes.
 * Called AFTER the database transaction commits.
 *
 * @param {Object} options
 * @param {string} options.order_id
 * @param {string} options.order_number
 * @param {string} options.shop_id
 * @param {string} options.new_status
 * @param {string} options.customer_name
 */
export async function fireOrderStatusChangedEvents({ order_id, order_number, shop_id, new_status, customer_name }) {
  // Reserved for future customer push notifications
  // For V1: status changes are visible to customer via polling GET /mobile/orders/:id
  console.log(
    `[OrderEvents] Status changed: ${order_number} → ${new_status}`,
  );
}