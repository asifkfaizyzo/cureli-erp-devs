// backend/src/modules/marketplace-orders/marketplace.orders.events.js

import prisma from '../../config/prisma.js';
import { sseService } from '../../services/sse.service.js';
import { notifyAsync, NOTIFICATION_EVENTS } from '../notifications/notification.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all active ERP user IDs for a shop.
 * Extracted to avoid duplication between fireOrderPlacedEvents
 * and fireOrderStatusChangedEvents.
 *
 * @param {string} shop_id
 * @returns {Promise<string[]>} Array of user_id strings
 */
async function getActiveShopUserIds(shop_id) {
  const users = await prisma.user.findMany({
    where: { shop_id, is_active: true },
    select: { user_id: true },
  });
  return users.map((u) => u.user_id);
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER PLACED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fire all events after a new order is placed.
 * Called AFTER the database transaction commits.
 *
 * @param {Object} order - The created MarketplaceOrder record (with items)
 */
export async function fireOrderPlacedEvents(order) {
  const {
    order_id,
    order_number,
    shop_id,
    branch_id,
    customer_id,
    customer_name_snapshot,
    total_amount,
    requires_prescription,
    placed_at,
    items,
  } = order;

  const item_count = items?.length ?? 0;

  // ── 1. In-app notification via existing pipeline ──────────────────────────
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

  // ── 2. Direct SSE to all active ERP users of the shop ────────────────────
  try {
    const userIds = await getActiveShopUserIds(shop_id);

    const ssePayload = {
      order_id,
      order_number,
      customer_name: customer_name_snapshot,
      total_amount: Number(total_amount).toFixed(2),
      item_count,
      requires_prescription,
      placed_at,
    };

    for (const userId of userIds) {
      sseService.notifyUser(userId, 'marketplace_new_order', ssePayload);
    }

    console.log(
      `[OrderEvents] Fired marketplace_new_order SSE to ${userIds.length} users for shop ${shop_id}`,
    );
  } catch (err) {
    // SSE failure must never crash the order flow
    console.error('[OrderEvents] SSE dispatch failed (new order):', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATUS CHANGED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fire events after an order status changes.
 * Called AFTER the database transaction commits.
 * Fires to:
 *   - All active ERP users of the shop (via SSE)
 *   - The mobile customer (via SSE)
 *
 * @param {Object} options
 * @param {string} options.order_id
 * @param {string} options.order_number
 * @param {string} options.shop_id
 * @param {string} options.customer_id
 * @param {string} options.new_status
 * @param {string} options.customer_name
 */
export async function fireOrderStatusChangedEvents({
  order_id,
  order_number,
  shop_id,
  customer_id,
  new_status,
  customer_name,
}) {
  const payload = {
    order_id,
    order_number,
    new_status,
    customer_name,
  };

  // ── 1. Notify all active ERP users of the shop ────────────────────────────
  try {
    const userIds = await getActiveShopUserIds(shop_id);

    for (const userId of userIds) {
      sseService.notifyUser(userId, 'marketplace_order_status_changed', payload);
    }

    console.log(
      `[OrderEvents] Fired marketplace_order_status_changed (${new_status}) SSE to ${userIds.length} ERP users for shop ${shop_id}`,
    );
  } catch (err) {
    console.error('[OrderEvents] ERP SSE dispatch failed (status change):', err.message);
  }

  // ── 2. Notify the mobile customer ─────────────────────────────────────────
  // Fire independently so ERP failure doesn't block mobile notification
  try {
    if (customer_id) {
      sseService.notifyMobile(customer_id, 'order_status_changed', {
        order_id,
        order_number,
        new_status,
      });

      console.log(
        `[OrderEvents] Fired order_status_changed (${new_status}) SSE to mobile customer ${customer_id}`,
      );
    }
  } catch (err) {
    console.error('[OrderEvents] Mobile SSE dispatch failed (status change):', err.message);
  }
}