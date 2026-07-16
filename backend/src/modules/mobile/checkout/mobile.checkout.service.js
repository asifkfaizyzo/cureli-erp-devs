// backend/src/modules/mobile/checkout/mobile.checkout.service.js

import prisma from "../../../config/prisma.js";
import {
  razorpay,
  RAZORPAY_CURRENCY,
  verifyPaymentSignature,
} from "../../../config/razorpay.js";
import { computePricing, normaliseConfig } from "./pricing.engine.js";
import { fireOrderPlacedEvents } from "../../marketplace-orders/marketplace.orders.events.js";

const SESSION_TTL_MINS = 15;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD CONFIG (cached in memory, invalidated by version change)
// ─────────────────────────────────────────────────────────────────────────────

let _configCache = null;
let _configVersion = null;

async function getConfig() {
  const row = await prisma.deliveryPricingConfig.findFirst();
  if (!row) throw new Error("Pricing config not initialised");

  const version = row.version;
  if (_configVersion !== version || !_configCache) {
    _configCache = normaliseConfig(row);
    _configVersion = version;
  }

  return _configCache;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE — no side effects, returns pricing breakdown only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ items: {variantId, quantity}[], distance_km: number, tip?: number }}
 */
export async function getQuote({ items, distance_km, tip = 0 }) {
  // Resolve current prices from listings
  const subtotal = await resolveSubtotal(items);
  const config = await getConfig();

  return computePricing({ subtotal, distance_km, tip, config });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE SESSION — validates cart, creates Razorpay order, persists session
// ─────────────────────────────────────────────────────────────────────────────

export async function createCheckoutSession({
  customer_id,
  branch_id,
  items: cartItems,
  delivery_address_id,
  distance_km,
  tip = 0,
  prescription_files = [],
  patient,
}) {
  const config = await getConfig();

  // ── 1. Validate customer ─────────────────────────────────
  const customer = await prisma.cureliMobileUser.findUnique({
    where: { id: customer_id },
    select: { id: true, status: true, full_name: true, phone: true },
  });
  if (!customer || customer.status !== "active")
    throw new Error("Customer account is not active");

  // ── 2. Validate address ──────────────────────────────────
  const address = await prisma.cureliMobileAddress.findFirst({
    where: { id: delivery_address_id, user_id: customer_id, deleted_at: null },
  });
  if (!address) throw new Error("Delivery address not found");

  // ── 3. Validate branch ───────────────────────────────────
  const branchSettings = await prisma.branchMarketplaceSettings.findUnique({
    where: { branch_id },
    select: {
      marketplace_enabled: true,
      branch: { select: { shop_id: true, branch_name: true, is_active: true } },
    },
  });
  if (!branchSettings || !branchSettings.branch.is_active)
    throw new Error("Branch is not available");
  if (!branchSettings.marketplace_enabled)
    throw new Error("This branch is not accepting marketplace orders");

  const shop_id = branchSettings.branch.shop_id;

  // ── 4. Validate and snapshot items ───────────────────────
  const { resolvedItems, subtotal, requiresPrescription } =
    await validateAndSnapshotItems(cartItems, branch_id);

  // ── 5. Prescription gate ─────────────────────────────────
  if (requiresPrescription && prescription_files.length === 0) {
    throw new Error(
      "This order requires a prescription. Please upload at least one prescription file.",
    );
  }

  // ── 6. Compute pricing ───────────────────────────────────
  const pricing = computePricing({ subtotal, distance_km, tip, config });

  if (!pricing.delivery_available) {
    throw new Error(pricing.unavailable_reason);
  }

  // ── 7. Snapshot address ──────────────────────────────────
  const address_snapshot = {
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

  // ── 8. Create Razorpay order ─────────────────────────────
  const amount_paise = Math.round(pricing.grand_total * 100);

  const rzpOrder = await razorpay.orders.create({
    amount: amount_paise,
    currency: RAZORPAY_CURRENCY,
    notes: {
      customer_id,
      branch_id,
      shop_id,
    },
  });

  // ── 9. Persist CheckoutSession ───────────────────────────
  const expires_at = new Date(Date.now() + SESSION_TTL_MINS * 60 * 1000);

  const session = await prisma.checkoutSession.create({
    data: {
      customer_id,
      branch_id,
      razorpay_order_id: rzpOrder.id,
      cart_snapshot: resolvedItems,
      delivery_address_id,
      delivery_address_snapshot: address_snapshot,
      subtotal: pricing.subtotal,
      service_charge: pricing.service_charge,
      delivery_fee: pricing.delivery_fee,
      km_surcharge: pricing.km_surcharge,
      tip: pricing.tip,
      grand_total: pricing.grand_total,
      distance_km,
      prescription_files,
      patient_is_self: patient.is_self,
      patient_name_snapshot: patient.name,
      patient_age_snapshot: patient.age,
      patient_sex_snapshot: patient.sex,

      status: "created",
      expires_at,
    },
  });

  return {
    session_id: session.session_id,
    razorpay_order_id: rzpOrder.id,
    amount_paise,
    currency: RAZORPAY_CURRENCY,
    key_id: process.env.RAZORPAY_KEY_ID,
    pricing,
    expires_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM — verifies payment, creates order
// ─────────────────────────────────────────────────────────────────────────────

export async function confirmCheckoutPayment({
  session_id,
  customer_id,
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
}) {
  // ── 1. Fetch session ─────────────────────────────────────
  const session = await prisma.checkoutSession.findUnique({
    where: { session_id },
  });

  if (!session || session.customer_id !== customer_id)
    throw new Error("Session not found");
  if (session.status === "expired") throw new Error("Session expired");
  if (session.status === "paid") throw new Error("Already paid");
  if (new Date() > session.expires_at) {
    await prisma.checkoutSession.update({
      where: { session_id },
      data: { status: "expired" },
    });
    throw new Error("Session expired");
  }

  // ── 2. Verify Razorpay signature ─────────────────────────
  const isValid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!isValid) {
    await prisma.checkoutSession.update({
      where: { session_id },
      data: { status: "failed" },
    });
    throw new Error("Invalid payment signature");
  }

  // ── 3. Create MarketplaceOrder + mark session paid (atomic) ─
  const order = await _createOrderFromSession({
    session,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  });

  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    total_amount: Number(order.total_amount),
    placed_at: order.placed_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK — safety net, idempotent
// ─────────────────────────────────────────────────────────────────────────────

export async function handleCheckoutWebhook(payload) {
  const event = payload?.event;

  if (event === "payment.captured") {
    const payment = payload.payload?.payment?.entity;
    const rzp_order = payment?.order_id;
    const payment_id = payment?.id;
    const signature = null; // webhook doesn't send signature — skip sig verification

    if (!rzp_order || !payment_id) return;

    const session = await prisma.checkoutSession.findUnique({
      where: { razorpay_order_id: rzp_order },
    });

    if (!session) return; // unknown
    if (session.status === "paid") return; // idempotent
    if (session.status === "expired") return; // too late

    // Order already created (by confirm endpoint racing the webhook)
    if (session.order_id) return;

    await _createOrderFromSession({
      session,
      razorpay_payment_id: payment_id,
      razorpay_order_id: rzp_order,
      razorpay_signature: null,
    });

    console.log(`[Webhook] Order created from session ${session.session_id}`);
  }

  if (event === "payment.failed") {
    const payment = payload.payload?.payment?.entity;
    const rzp_order = payment?.order_id;
    if (!rzp_order) return;

    await prisma.checkoutSession.updateMany({
      where: { razorpay_order_id: rzp_order, status: "created" },
      data: { status: "failed" },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — create order from session (shared by confirm + webhook)
// ─────────────────────────────────────────────────────────────────────────────

async function _createOrderFromSession({
  session,
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
}) {
  // Guard: check session hasn't already produced an order (race condition)
  const fresh = await prisma.checkoutSession.findUnique({
    where: { session_id: session.session_id },
    select: { order_id: true, status: true },
  });
  if (fresh?.order_id)
    return prisma.marketplaceOrder.findUnique({
      where: { order_id: fresh.order_id },
    });
  if (fresh?.status === "paid")
    return prisma.marketplaceOrder.findUnique({
      where: { order_id: fresh.order_id },
    });

  // Resolve branch → shop
  const branchSettings = await prisma.branchMarketplaceSettings.findUnique({
    where: { branch_id: session.branch_id },
    select: { branch: { select: { shop_id: true } } },
  });
  const shop_id = branchSettings.branch.shop_id;

  // Fetch customer snapshot
  const customer = await prisma.cureliMobileUser.findUnique({
    where: { id: session.customer_id },
    select: { full_name: true, phone: true },
  });

  const now = new Date();
  const order_number = await _generateOrderNumber();

  const cartItems = session.cart_snapshot;
  const requiresPrescription = cartItems.some(
    (i) => i.requires_prescription_snapshot,
  );

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.marketplaceOrder.create({
      data: {
        order_number,
        shop_id,
        branch_id: session.branch_id,
        customer_id: session.customer_id,
        delivery_address_id: session.delivery_address_id,
        delivery_address_snapshot: session.delivery_address_snapshot,
        customer_name_snapshot: customer.full_name ?? customer.phone,
        customer_phone_snapshot: customer.phone,
        status: "PLACED",
        payment_method: "RAZORPAY",
        payment_status: "PAID",
        subtotal: session.subtotal,
        service_charge: session.service_charge,
        delivery_fee: session.delivery_fee,
        km_surcharge: session.km_surcharge,
        tip: session.tip,
        total_amount: session.grand_total,
        distance_km: session.distance_km,
        requires_prescription: requiresPrescription,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: razorpay_signature ?? null,
        checkout_session_id: session.session_id,
        notes: null,
        patient_is_self: session.patient_is_self,
        patient_name_snapshot: session.patient_name_snapshot ?? null,
        patient_age_snapshot: session.patient_age_snapshot ?? null,
        patient_sex_snapshot: session.patient_sex_snapshot ?? null,

        placed_at: now,
      },
    });

    // Create order items
    await tx.marketplaceOrderItem.createMany({
      data: cartItems.map((item) => ({
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
    const files = session.prescription_files ?? [];
    if (files.length > 0) {
      await tx.marketplaceOrderPrescription.createMany({
        data: files.map((file, index) => ({
          order_id: order.order_id,
          storage_key: file.prescription_key,
          original_name: file.original_name,
          mime_type: file.mime_type,
          file_size: file.file_size,
          sequence: index,
        })),
      });
    }

    // Status history
    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id: order.order_id,
        from_status: null,
        to_status: "PLACED",
        changed_by_type: "customer",
        changed_by_id: session.customer_id,
        reason: null,
      },
    });

    // Mark session paid
    await tx.checkoutSession.update({
      where: { session_id: session.session_id },
      data: {
        status: "paid",
        paid_at: now,
        order_id: order.order_id,
      },
    });

    return order;
  });

  // Fire events post-commit
  await fireOrderPlacedEvents({
    ...createdOrder,
    items: cartItems,
  });

  return createdOrder;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function _generateOrderNumber() {
  const result =
    await prisma.$queryRaw`SELECT nextval('marketplace_order_seq') as seq`;
  const seq = result[0].seq;
  return `MKT-${String(seq).padStart(6, "0")}`;
}

async function resolveSubtotal(items) {
  let subtotal = 0;
  for (const { variantId, quantity } of items) {
    const listing = await prisma.marketplaceListing.findFirst({
      where: { linked_variant_id: variantId },
      select: { marketplace_price: true },
    });
    if (listing?.marketplace_price) {
      subtotal += Number(listing.marketplace_price) * quantity;
    }
  }
  return subtotal;
}

async function validateAndSnapshotItems(cartItems, branch_id) {
  const resolvedItems = [];
  let subtotal = 0;
  let requiresPrescription = false;

  for (const { variantId, quantity } of cartItems) {
    const listing = await prisma.marketplaceListing.findFirst({
      where: { linked_variant_id: variantId, branch_id },
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

    if (!listing) throw new Error("One or more items are no longer available");
    if (!listing.is_visible)
      throw new Error("One or more items are no longer listed");
    if (listing.stock_status !== "IN_STOCK")
      throw new Error("One or more items are out of stock");
    if (listing.marketplace_price === null)
      throw new Error("One or more items have no price set");

    if (listing.requires_prescription) requiresPrescription = true;

    const unitPrice = Number(listing.marketplace_price);
    const mrp = listing.linkedVariant?.mrp
      ? Number(listing.linkedVariant.mrp)
      : unitPrice;
    const line_total = unitPrice * quantity;
    subtotal += line_total;

    resolvedItems.push({
      listing_id: listing.listing_id,
      medicine_id: listing.medicine_id,
      variant_id: listing.linked_variant_id,
      medicine_name_snapshot: listing.linkedVariant?.name ?? "Unknown",
      variant_sku_snapshot: listing.linkedVariant?.sku_id ?? "",
      brand_snapshot: listing.linkedVariant?.brand ?? null,
      pack_size_snapshot: listing.linkedVariant?.pack_size ?? null,
      unit_price_snapshot: unitPrice,
      mrp_snapshot: mrp,
      requires_prescription_snapshot: listing.requires_prescription,
      quantity,
      line_total,
    });
  }

  return { resolvedItems, subtotal, requiresPrescription };
}
