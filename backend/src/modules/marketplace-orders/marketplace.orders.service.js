// ============================================
// backend/src/modules/marketplace-orders/marketplace.orders.service.js
// ============================================

import prisma from '../../config/prisma.js';
import { fireOrderPlacedEvents, fireOrderStatusChangedEvents } from './marketplace.orders.events.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PRESCRIPTION_FOLDER = 'order_prescriptions';

// Valid state transitions
// Key = current status, Value = array of statuses it can transition TO
const VALID_TRANSITIONS = {
  PLACED:           ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED:         ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['COMPLETED'],
  COMPLETED:        [],
  REJECTED:         [],
  CANCELLED:        [],
};

// Who is allowed to trigger each transition
const TRANSITION_ACTOR = {
  ACCEPTED:         'pharmacy',
  REJECTED:         'pharmacy',
  READY_FOR_PICKUP: 'pharmacy',
  COMPLETED:        'pharmacy',
  CANCELLED:        'customer',
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate next order number from Postgres sequence.
 * Format: MKT-000001
 */
async function generateOrderNumber() {
  const result = await prisma.$queryRaw`SELECT nextval('marketplace_order_seq') as seq`;
  const seq = result[0].seq;
  return `MKT-${String(seq).padStart(6, '0')}`;
}

/**
 * Assert that a state transition is valid.
 * Throws if the transition is not allowed.
 */
function assertValidTransition(currentStatus, targetStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Cannot transition order from ${currentStatus} to ${targetStatus}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACE ORDER (Mobile Customer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Place a new marketplace order.
 *
 * @param {Object} options
 * @param {string} options.customer_id         - CureliMobileUser.id
 * @param {string} options.branch_id           - Which branch to order from
 * @param {Array}  options.items               - [{ variantId, quantity }]
 * @param {string} options.delivery_address_id - CureliMobileAddress.id
 * @param {string} [options.notes]             - Customer notes
 * @param {Array}  [options.prescription_files] - [{ prescription_key, original_name, mime_type, file_size }]
 */
export async function placeOrder({
  customer_id,
  branch_id,
  items: cartItems,
  delivery_address_id,
  notes,
  prescription_files = [],
}) {
  // ── 1. Validate customer ──────────────────────────────────────────────────
  const customer = await prisma.cureliMobileUser.findUnique({
    where: { id: customer_id },
    select: {
      id: true,
      full_name: true,
      phone: true,
      status: true,
    },
  });

  if (!customer || customer.status !== 'active') {
    throw new Error('Customer account is not active');
  }

  // ── 2. Validate delivery address ──────────────────────────────────────────
  const address = await prisma.cureliMobileAddress.findFirst({
    where: {
      id: delivery_address_id,
      user_id: customer_id,
      deleted_at: null,
    },
  });

  if (!address) {
    throw new Error('Delivery address not found');
  }

  // ── 3. Validate branch ────────────────────────────────────────────────────
  const branchSettings = await prisma.branchMarketplaceSettings.findUnique({
    where: { branch_id },
    select: {
      marketplace_enabled: true,
      pickup_enabled: true,
      branch: {
        select: {
          shop_id: true,
          branch_name: true,
          is_active: true,
        },
      },
    },
  });

  if (!branchSettings || !branchSettings.branch.is_active) {
    throw new Error('Branch is not available');
  }

  if (!branchSettings.marketplace_enabled) {
    throw new Error('This branch is not accepting marketplace orders');
  }

  const shop_id = branchSettings.branch.shop_id;

  // ── 4. Validate and snapshot each cart item ───────────────────────────────
  const resolvedItems = [];
  let requiresPrescription = false;

  for (const cartItem of cartItems) {
    const { variantId, quantity } = cartItem;

    if (!quantity || quantity < 1) {
      throw new Error(`Invalid quantity for item`);
    }

    // Find listing by variantId + branchId (Option A resolved earlier)
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        linked_variant_id: variantId,
        branch_id,
      },
      select: {
        listing_id: true,
        medicine_id: true,
        linked_variant_id: true,
        is_visible: true,
        stock_status: true,
        marketplace_price: true,
        requires_prescription: true,
        linkedVariant: {
          select: {
            name: true,
            sku_id: true,
            brand: true,
            pack_size: true,
            mrp: true,
          },
        },
      },
    });

    if (!listing) {
      throw new Error(`One or more items are no longer available`);
    }

    if (!listing.is_visible) {
      throw new Error(`One or more items are no longer listed`);
    }

    if (listing.stock_status !== 'IN_STOCK') {
      throw new Error(`One or more items are out of stock`);
    }

    if (listing.marketplace_price === null) {
      throw new Error(`One or more items have no price set`);
    }

    if (listing.requires_prescription) {
      requiresPrescription = true;
    }

    const unitPrice = Number(listing.marketplace_price);
    const mrp = listing.linkedVariant?.mrp
      ? Number(listing.linkedVariant.mrp)
      : unitPrice;

    resolvedItems.push({
      listing_id: listing.listing_id,
      medicine_id: listing.medicine_id,
      variant_id: listing.linked_variant_id,
      medicine_name_snapshot: listing.linkedVariant?.name ?? 'Unknown',
      variant_sku_snapshot: listing.linkedVariant?.sku_id ?? '',
      brand_snapshot: listing.linkedVariant?.brand ?? null,
      pack_size_snapshot: listing.linkedVariant?.pack_size ?? null,
      unit_price_snapshot: unitPrice,
      mrp_snapshot: mrp,
      requires_prescription_snapshot: listing.requires_prescription,
      quantity,
      line_total: unitPrice * quantity,
    });
  }

  // ── 5. Prescription validation ────────────────────────────────────────────
  if (requiresPrescription && prescription_files.length === 0) {
    throw new Error(
      'This order requires a prescription. Please upload at least one prescription file.',
    );
  }

  // ── 6. Calculate totals ───────────────────────────────────────────────────
  const subtotal = resolvedItems.reduce((sum, item) => sum + item.line_total, 0);
  const total_amount = subtotal; // V1: no delivery charge

  // ── 7. Snapshot delivery address ──────────────────────────────────────────
  const delivery_address_snapshot = {
    label: address.label,
    address_line_1: address.address_line_1,
    address_line_2: address.address_line_2 ?? null,
    landmark: address.landmark ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    latitude: address.latitude ? Number(address.latitude) : null,
    longitude: address.longitude ? Number(address.longitude) : null,
    recipient_name: address.recipient_name ?? null,
    recipient_phone: address.recipient_phone ?? null,
  };

  // ── 8. Generate order number ──────────────────────────────────────────────
  const order_number = await generateOrderNumber();

  // ── 9. Database transaction ───────────────────────────────────────────────
  const now = new Date();

  const createdOrder = await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.marketplaceOrder.create({
      data: {
        order_number,
        shop_id,
        branch_id,
        customer_id,
        delivery_address_id,
        delivery_address_snapshot,
        customer_name_snapshot: customer.full_name ?? customer.phone,
        customer_phone_snapshot: customer.phone,
        status: 'PLACED',
        payment_method: 'COD',
        payment_status: 'PENDING',
        subtotal,
        total_amount,
        requires_prescription: requiresPrescription,
        notes: notes ?? null,
        placed_at: now,
      },
    });

    // Create order items
    await tx.marketplaceOrderItem.createMany({
      data: resolvedItems.map((item) => ({
        order_id: order.order_id,
        listing_id: item.listing_id,
        medicine_id: item.medicine_id,
        variant_id: item.variant_id,
        medicine_name_snapshot: item.medicine_name_snapshot,
        variant_sku_snapshot: item.variant_sku_snapshot,
        brand_snapshot: item.brand_snapshot,
        pack_size_snapshot: item.pack_size_snapshot,
        unit_price_snapshot: item.unit_price_snapshot,
        mrp_snapshot: item.mrp_snapshot,
        requires_prescription_snapshot: item.requires_prescription_snapshot,
        quantity: item.quantity,
        line_total: item.line_total,
      })),
    });

    // Create prescription records
    if (prescription_files.length > 0) {
      await tx.marketplaceOrderPrescription.createMany({
        data: prescription_files.map((file, index) => ({
          order_id: order.order_id,
          storage_key: file.prescription_key,
          original_name: file.original_name,
          mime_type: file.mime_type,
          file_size: file.file_size,
          sequence: index,
        })),
      });
    }

    // Create initial status history entry
    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id: order.order_id,
        from_status: null,
        to_status: 'PLACED',
        changed_by_type: 'customer',
        changed_by_id: customer_id,
        reason: null,
      },
    });

    return order;
  });

  // ── 10. Fire events AFTER commit ──────────────────────────────────────────
  await fireOrderPlacedEvents({
    ...createdOrder,
    items: resolvedItems,
  });

  return {
    order_id: createdOrder.order_id,
    order_number: createdOrder.order_number,
    status: createdOrder.status,
    total_amount: Number(createdOrder.total_amount),
    placed_at: createdOrder.placed_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION ORDER STATUS (ERP Pharmacy)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic state transition handler for ERP pharmacy actions.
 *
 * @param {Object} options
 * @param {string} options.order_id
 * @param {string} options.shop_id        - From ERP user JWT — scope enforcement
 * @param {string} options.target_status  - The status to transition to
 * @param {string} options.acting_user_id - ERP User.user_id
 * @param {string} [options.reason]       - Required for REJECTED
 * @param {string} [options.reason_other] - Required when reason = OTHER
 */
export async function transitionOrderStatus({
  order_id,
  shop_id,
  target_status,
  acting_user_id,
  reason = null,
  reason_other = null,
}) {
  // Fetch current order
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      order_number: true,
      shop_id: true,
      status: true,
      customer_id: true,
      customer_name_snapshot: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // ── Scope check ───────────────────────────────────────────────────────────
  if (order.shop_id !== shop_id) {
    throw new Error('Order not found');
  }

  // ── Validate transition ───────────────────────────────────────────────────
  assertValidTransition(order.status, target_status);

  // ── Rejection requires a reason ───────────────────────────────────────────
  if (target_status === 'REJECTED' && !reason) {
    throw new Error('A rejection reason is required');
  }

  // ── Build update payload ──────────────────────────────────────────────────
  const now = new Date();
  const updateData = { status: target_status };

  if (target_status === 'ACCEPTED')         updateData.accepted_at = now;
  if (target_status === 'READY_FOR_PICKUP') updateData.ready_at = now;
  if (target_status === 'COMPLETED')        updateData.completed_at = now;
  if (target_status === 'REJECTED') {
    updateData.rejected_at = now;
    updateData.rejection_reason = reason;
    updateData.rejection_reason_other = reason_other ?? null;
  }

  // ── Atomic update + history in transaction ────────────────────────────────
  await prisma.$transaction(async (tx) => {
    // Re-fetch inside transaction and check status hasn't changed (race condition guard)
    const current = await tx.marketplaceOrder.findUnique({
      where: { order_id },
      select: { status: true },
    });

    if (current.status !== order.status) {
      throw new Error('Order status changed by another request. Please refresh.');
    }

    await tx.marketplaceOrder.update({
      where: { order_id },
      data: updateData,
    });

    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id,
        from_status: order.status,
        to_status: target_status,
        changed_by_type: 'pharmacy',
        changed_by_id: acting_user_id,
        reason: target_status === 'REJECTED' ? reason : null,
      },
    });
  });

  // ── Fire events post-commit ───────────────────────────────────────────────
  await fireOrderStatusChangedEvents({
    order_id,
    order_number: order.order_number,
    shop_id: order.shop_id,
    new_status: target_status,
    customer_name: order.customer_name_snapshot,
  });

  return { order_id, order_number: order.order_number, status: target_status };
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL ORDER (Mobile Customer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Customer cancels their own order.
 * Only allowed when status = PLACED.
 *
 * @param {string} order_id
 * @param {string} customer_id
 */
export async function cancelOrder(order_id, customer_id) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      order_number: true,
      shop_id: true,
      customer_id: true,
      status: true,
      customer_name_snapshot: true,
    },
  });

  if (!order || order.customer_id !== customer_id) {
    throw new Error('Order not found');
  }

  assertValidTransition(order.status, 'CANCELLED');

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const current = await tx.marketplaceOrder.findUnique({
      where: { order_id },
      select: { status: true },
    });

    if (current.status !== order.status) {
      throw new Error('Order status changed by another request. Please refresh.');
    }

    await tx.marketplaceOrder.update({
      where: { order_id },
      data: {
        status: 'CANCELLED',
        cancelled_at: now,
        cancelled_by: 'customer',
      },
    });

    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id,
        from_status: order.status,
        to_status: 'CANCELLED',
        changed_by_type: 'customer',
        changed_by_id: customer_id,
        reason: 'customer',
      },
    });
  });

  await fireOrderStatusChangedEvents({
    order_id,
    order_number: order.order_number,
    shop_id: order.shop_id,
    new_status: 'CANCELLED',
    customer_name: order.customer_name_snapshot,
  });

  return { order_id, order_number: order.order_number, status: 'CANCELLED' };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDER LIST (ERP)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get paginated order list for ERP pharmacy.
 *
 * @param {string} shop_id
 * @param {Object} query - { status, page, limit }
 */
export async function getErpOrders(shop_id, query = {}) {
  const {
    status,
    page = 1,
    limit = 20,
  } = query;

  const where = { shop_id };

  // Support comma-separated status values e.g. status=ACCEPTED,READY_FOR_PICKUP
  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    where.status = { in: statuses };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.marketplaceOrder.findMany({
      where,
      orderBy: { placed_at: 'desc' },
      skip,
      take: Number(limit),
      select: {
        order_id: true,
        order_number: true,
        status: true,
        customer_name_snapshot: true,
        customer_phone_snapshot: true,
        total_amount: true,
        requires_prescription: true,
        placed_at: true,
        accepted_at: true,
        ready_at: true,
        completed_at: true,
        rejected_at: true,
        cancelled_at: true,
        rejection_reason: true,
        notes: true,
        items: {
          select: {
            item_id: true,
            medicine_name_snapshot: true,
            brand_snapshot: true,
            pack_size_snapshot: true,
            quantity: true,
            unit_price_snapshot: true,
            line_total: true,
            requires_prescription_snapshot: true,
          },
        },
        _count: {
          select: { prescriptions: true },
        },
      },
    }),
    prisma.marketplaceOrder.count({ where }),
  ]);

  return {
    orders: orders.map(formatErpOrderSummary),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDER DETAIL (ERP)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get full order detail for ERP.
 *
 * @param {string} order_id
 * @param {string} shop_id - Scope enforcement
 */
export async function getErpOrderDetail(order_id, shop_id) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: {
      items: true,
      prescriptions: {
        orderBy: { sequence: 'asc' },
      },
      statusHistory: {
        orderBy: { created_at: 'asc' },
      },
    },
  });

  if (!order || order.shop_id !== shop_id) {
    throw new Error('Order not found');
  }

  return formatErpOrderDetail(order);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDER LIST (Mobile Customer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get paginated order list for mobile customer.
 *
 * @param {string} customer_id
 * @param {Object} query - { page, limit }
 */
export async function getMobileOrders(customer_id, query = {}) {
  const { page = 1, limit = 20 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.marketplaceOrder.findMany({
      where: { customer_id },
      orderBy: { placed_at: 'desc' },
      skip,
      take: Number(limit),
      select: {
        order_id: true,
        order_number: true,
        status: true,
        total_amount: true,
        requires_prescription: true,
        placed_at: true,
        accepted_at: true,
        ready_at: true,
        completed_at: true,
        rejected_at: true,
        cancelled_at: true,
        rejection_reason: true,
        notes: true,
        shop: {
          select: { business_name: true },
        },
        items: {
          select: {
            item_id: true,
            medicine_name_snapshot: true,
            brand_snapshot: true,
            quantity: true,
            unit_price_snapshot: true,
            line_total: true,
          },
        },
      },
    }),
    prisma.marketplaceOrder.count({ where: { customer_id } }),
  ]);

  return {
    orders: orders.map(formatMobileOrderSummary),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDER DETAIL (Mobile Customer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get full order detail for mobile customer.
 *
 * @param {string} order_id
 * @param {string} customer_id - Ownership enforcement
 */
export async function getMobileOrderDetail(order_id, customer_id) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: {
      items: true,
      statusHistory: {
        orderBy: { created_at: 'asc' },
      },
      shop: {
        select: { business_name: true },
      },
      branch: {
        select: { branch_name: true },
      },
    },
  });

  if (!order || order.customer_id !== customer_id) {
    throw new Error('Order not found');
  }

  return formatMobileOrderDetail(order);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRESCRIPTION SIGNED URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a time-limited signed URL for a prescription file.
 * Used by both ERP (to view) and mobile (to view their own).
 *
 * @param {string} prescription_id
 * @param {string} accessor_type   - 'pharmacy' or 'customer'
 * @param {string} accessor_id     - shop_id for pharmacy, customer_id for customer
 */
export async function getPrescriptionSignedUrl(prescription_id, accessor_type, accessor_id) {
  const prescription = await prisma.marketplaceOrderPrescription.findUnique({
    where: { prescription_id },
    include: {
      order: {
        select: {
          shop_id: true,
          customer_id: true,
        },
      },
    },
  });

  if (!prescription) {
    throw new Error('Prescription not found');
  }

  // Access control
  if (accessor_type === 'pharmacy' && prescription.order.shop_id !== accessor_id) {
    throw new Error('Prescription not found');
  }

  if (accessor_type === 'customer' && prescription.order.customer_id !== accessor_id) {
    throw new Error('Prescription not found');
  }

  const { getSignedUrl } = await import('../../services/fileStorage.service.js');

  const url = await getSignedUrl({
    folder: 'order_prescriptions',
    filename: prescription.storage_key,
    expiresIn: 900, // 15 minutes
  });

  return { url, expires_in: 900 };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

function formatErpOrderSummary(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    customer_name: order.customer_name_snapshot,
    customer_phone: order.customer_phone_snapshot,
    total_amount: Number(order.total_amount),
    requires_prescription: order.requires_prescription,
    prescription_count: order._count?.prescriptions ?? 0,
    item_count: order.items?.length ?? 0,
    items: order.items?.map(formatOrderItem) ?? [],
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
  };
}

function formatErpOrderDetail(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    customer_name: order.customer_name_snapshot,
    customer_phone: order.customer_phone_snapshot,
    delivery_address: order.delivery_address_snapshot,
    total_amount: Number(order.total_amount),
    subtotal: Number(order.subtotal),
    requires_prescription: order.requires_prescription,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    rejection_reason_other: order.rejection_reason_other,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
    items: order.items.map(formatOrderItem),
    prescriptions: order.prescriptions.map((p) => ({
      prescription_id: p.prescription_id,
      original_name: p.original_name,
      mime_type: p.mime_type,
      file_size: p.file_size,
      sequence: p.sequence,
    })),
    status_history: order.statusHistory.map((h) => ({
      from_status: h.from_status,
      to_status: h.to_status,
      changed_by_type: h.changed_by_type,
      reason: h.reason,
      created_at: h.created_at,
    })),
  };
}

function formatMobileOrderSummary(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    shop_name: order.shop?.business_name ?? null,
    total_amount: Number(order.total_amount),
    requires_prescription: order.requires_prescription,
    item_count: order.items?.length ?? 0,
    items: order.items?.map(formatOrderItem) ?? [],
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
  };
}

function formatMobileOrderDetail(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    shop_name: order.shop?.business_name ?? null,
    branch_name: order.branch?.branch_name ?? null,
    delivery_address: order.delivery_address_snapshot,
    total_amount: Number(order.total_amount),
    subtotal: Number(order.subtotal),
    requires_prescription: order.requires_prescription,
    payment_method: order.payment_method,
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    rejection_reason_other: order.rejection_reason_other,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
    items: order.items.map(formatOrderItem),
    status_history: order.statusHistory.map((h) => ({
      from_status: h.from_status,
      to_status: h.to_status,
      changed_by_type: h.changed_by_type,
      reason: h.reason,
      created_at: h.created_at,
    })),
  };
}

function formatOrderItem(item) {
  return {
    item_id: item.item_id,
    medicine_name: item.medicine_name_snapshot,
    brand: item.brand_snapshot,
    pack_size: item.pack_size_snapshot,
    quantity: item.quantity,
    unit_price: Number(item.unit_price_snapshot),
    mrp: Number(item.mrp_snapshot),
    line_total: Number(item.line_total),
    requires_prescription: item.requires_prescription_snapshot,
  };
}