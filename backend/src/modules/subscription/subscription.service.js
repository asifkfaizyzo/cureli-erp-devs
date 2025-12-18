import prisma from "../../config/prisma.js";
import { razorpay, RAZORPAY_CURRENCY, verifyPaymentSignature } from "../../config/razorpay.js";

/**
 * Get plans available for customer selection
 * Only ACTIVE + PRE_MADE + not deleted
 */
export async function getVisiblePlans() {
  return prisma.plan.findMany({
    where: { 
      status: "ACTIVE",
      type: "PRE_MADE",
      deleted_at: null,
    },
    orderBy: [
      { price: "asc" },
      { name: "asc" },
    ],
    select: {
      plan_id: true,
      name: true,
      description: true,
      price: true,
      max_users: true,
      max_branches: true,
      is_highlighted: true,
      is_customizable: true,
    }
  });
}

/**
 * Get user details for Razorpay prefill
 */
export async function getUserDetails(user_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      full_name: true,
      email: true,
      phone_number: true,
    }
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  return user;
}

/**
 * Get plan by ID (must be active)
 */
export async function getActivePlan(plan_id) {
  const plan = await prisma.plan.findFirst({
    where: { 
      plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  if (!plan) {
    const err = new Error("Plan not found or not available");
    err.code = "PLAN_NOT_FOUND";
    throw err;
  }

  return plan;
}

/**
 * Create subscription for FREE plan (instant activation)
 */
export async function createFreeSubscription({ shop_id, plan }) {
  const now = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1); // 1 year

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: plan.plan_id,
      status: "active",
      payment_status: "paid",
      billing_cycle: "yearly",
      start_date: now,
      end_date: end,
      renewal_date: end,
      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
    },
  });

  // Set as current subscription
  await prisma.shop.update({
    where: { shop_id },
    data: { current_subscription_id: subscription.subscription_id },
  });

  return subscription;
}

/**
 * Create subscription for PAID plan (pending payment)
 * Also creates Razorpay order
 */
export async function createPaidSubscription({ shop_id, plan, user }) {
  const now = new Date();
  
  // Create subscription in pending state
  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: plan.plan_id,
      status: "pending",
      payment_status: "pending",
      billing_cycle: "yearly",
      start_date: now,
      end_date: now, // Will be updated after payment
      renewal_date: now, // Will be updated after payment
      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
    },
  });

  // Create Razorpay order
  // Price is in paisa, Razorpay expects amount in smallest currency unit (paisa for INR)
  const razorpayOrder = await razorpay.orders.create({
    amount: Number(plan.price), // Already in paisa
    currency: RAZORPAY_CURRENCY,
    receipt: subscription.subscription_id,
    notes: {
      shop_id,
      plan_id: plan.plan_id,
      plan_name: plan.name,
      subscription_id: subscription.subscription_id,
    },
  });

  // Store Razorpay order ID in payment transaction
  await prisma.paymentTransaction.create({
    data: {
      shop_id,
      subscription_id: subscription.subscription_id,
      provider: "razorpay",
      provider_order_id: razorpayOrder.id,
      amount: BigInt(plan.price),
      currency: RAZORPAY_CURRENCY,
      status: "created",
      meta: {
        plan_name: plan.name,
        created_at: new Date().toISOString(),
      },
    },
  });

  return {
    subscription,
    razorpay_order_id: razorpayOrder.id,
    razorpay_key: process.env.RAZORPAY_KEY_ID,
    amount: Number(plan.price),
    currency: RAZORPAY_CURRENCY,
    user_name: user.full_name,
    user_email: user.email,
    user_phone: user.phone_number,
  };
}

/**
 * Verify payment and activate subscription
 */
export async function verifyAndActivateSubscription({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  subscription_id,
}) {
  // Step 1: Verify signature
  const isValid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    const err = new Error("Payment verification failed - invalid signature");
    err.code = "INVALID_SIGNATURE";
    throw err;
  }

  // Step 2: Find the payment transaction
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { provider_order_id: razorpay_order_id },
    include: { subscription: true },
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.code = "TRANSACTION_NOT_FOUND";
    throw err;
  }

  if (transaction.subscription_id !== subscription_id) {
    const err = new Error("Subscription mismatch");
    err.code = "SUBSCRIPTION_MISMATCH";
    throw err;
  }

  // Step 3: Calculate subscription dates
  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

  // Step 4: Update everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update payment transaction
    await tx.paymentTransaction.update({
      where: { transaction_id: transaction.transaction_id },
      data: {
        provider_payment_id: razorpay_payment_id,
        status: "captured",
        meta: {
          ...transaction.meta,
          signature_verified: true,
          captured_at: now.toISOString(),
        },
      },
    });

    // Update subscription
    const subscription = await tx.shopSubscription.update({
      where: { subscription_id },
      data: {
        status: "active",
        payment_status: "paid",
        start_date: now,
        end_date: endDate,
        renewal_date: endDate,
      },
      include: { plan: true },
    });

    // Set as current subscription
    await tx.shop.update({
      where: { shop_id: transaction.shop_id },
      data: { current_subscription_id: subscription_id },
    });

    return subscription;
  });

  return result;
}

/**
 * Get subscription status for a shop
 */
export async function getSubscriptionStatus(shop_id) {
  if (!shop_id) return null;
  
  return prisma.shopSubscription.findFirst({
    where: { 
      shop_id, 
      is_active: true,
      end_date: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { created_at: "desc" },
  });
}

/**
 * Get subscription history for a shop
 */
export async function getSubscriptionHistory(shop_id) {
  if (!shop_id) return [];
  
  return prisma.shopSubscription.findMany({
    where: { shop_id },
    include: { plan: true },
    orderBy: { created_at: "desc" },
  });
}