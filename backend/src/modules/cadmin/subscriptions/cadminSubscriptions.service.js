// src/modules/cadmin/subscriptions/cadminSubscriptions.service.js

import prisma from "../../../config/prisma.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create error with code for controller handling
 */
function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * Add days to a date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate days remaining until a target date
 * Returns negative if date is in the past
 */
function getDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const now = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format subscription data for API response
 */
function formatSubscriptionForList(subscription, category) {
  const shop = subscription.shop;
  const plan = subscription.plan;

  // Calculate days left based on category
  let daysLeft = null;
  if (category === "expiring") {
    daysLeft = getDaysRemaining(subscription.end_date);
  } else if (category === "gracePeriod") {
    daysLeft = getDaysRemaining(subscription.grace_period_until);
  }

  return {
    // Subscription info
    subscription_id: subscription.subscription_id,
    status: subscription.status,
    payment_status: subscription.payment_status,
    is_active: subscription.is_active,

    // Dates
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    grace_period_until: subscription.grace_period_until,
    updated_at: subscription.updated_at,

    // Computed
    days_left: daysLeft,
    is_critical: daysLeft !== null && daysLeft <= 3,

    // Shop info
    shop_id: shop?.shop_id || null,
    shop_name: shop?.business_name || "Unknown Shop",
    shop_city: shop?.city || "",
    shop_state: shop?.state || "",
    shop_is_active: shop?.is_active ?? true,

    // Owner info
    owner_name: shop?.owner?.full_name || "",
    owner_email: shop?.owner?.email || "",
    owner_phone: shop?.owner?.phone_number || "",

    // Plan info
    plan_id: plan?.plan_id || null,
    plan_name: plan?.name || "Unknown Plan",
    plan_type: plan?.type || "PRE_MADE",
    plan_price: plan?.price ? Number(plan.price) : 0,
  };
}

// ============================================
// COMMON INCLUDES
// ============================================

const subscriptionIncludes = {
  shop: {
    select: {
      shop_id: true,
      business_name: true,
      city: true,
      state: true,
      is_active: true,
      verification_status: true,
      owner: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          phone_number: true,
        },
      },
    },
  },
  plan: {
    select: {
      plan_id: true,
      name: true,
      type: true,
      price: true,
      max_users: true,
      max_branches: true,
    },
  },
};

// ============================================
// GET AT-RISK SUBSCRIPTIONS
// ============================================

export async function getAtRiskSubscriptions(rangeDays = 30) {
  const now = new Date();
  const rangeEnd = addDays(now, rangeDays);

  // Execute all three queries in parallel
  const [expiring, gracePeriod, suspended] = await Promise.all([
    // ----------------------------------------
    // 1. EXPIRING SOON
    // Subscriptions that will expire within the range
    // Have NOT entered grace period yet
    // ----------------------------------------
    prisma.shopSubscription.findMany({
      where: {
        end_date: {
          gte: now,
          lte: rangeEnd,
        },
        // Not yet in grace period
        OR: [
          { grace_period_until: null },
          { grace_period_until: { lt: now } },
        ],
        is_active: true,
        status: "active",
      },
      include: subscriptionIncludes,
      orderBy: { end_date: "asc" },
    }),

    // ----------------------------------------
    // 2. IN GRACE PERIOD
    // Subscriptions where:
    // - end_date has passed (or about to)
    // - grace_period_until is in the future
    // - still active (not suspended yet)
    // ----------------------------------------
    prisma.shopSubscription.findMany({
      where: {
        grace_period_until: {
          gte: now,
        },
        end_date: {
          lt: now, // Already past end date
        },
        is_active: true,
      },
      include: subscriptionIncludes,
      orderBy: { grace_period_until: "asc" },
    }),

    // ----------------------------------------
    // 3. SUSPENDED
    // Subscriptions that are no longer active
    // ----------------------------------------
    prisma.shopSubscription.findMany({
      where: {
        is_active: false,
      },
      include: subscriptionIncludes,
      orderBy: { updated_at: "desc" },
      take: 100, // Limit to prevent huge response
    }),
  ]);

  // Format responses
  const formattedExpiring = expiring.map((sub) =>
    formatSubscriptionForList(sub, "expiring")
  );
  const formattedGracePeriod = gracePeriod.map((sub) =>
    formatSubscriptionForList(sub, "gracePeriod")
  );
  const formattedSuspended = suspended.map((sub) =>
    formatSubscriptionForList(sub, "suspended")
  );

  return {
    expiring: formattedExpiring,
    gracePeriod: formattedGracePeriod,
    suspended: formattedSuspended,
    counts: {
      expiring: formattedExpiring.length,
      gracePeriod: formattedGracePeriod.length,
      suspended: formattedSuspended.length,
      total:
        formattedExpiring.length +
        formattedGracePeriod.length +
        formattedSuspended.length,
    },
    meta: {
      range_days: rangeDays,
      fetched_at: now.toISOString(),
    },
  };
}

// ============================================
// GET SUBSCRIPTION BY ID
// ============================================

export async function getSubscriptionById(subscriptionId) {
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
    include: {
      shop: {
        select: {
          shop_id: true,
          business_name: true,
          legal_name: true,
          city: true,
          state: true,
          pincode: true,
          gst_number: true,
          verification_status: true,
          is_active: true,
          created_at: true,
          owner: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              phone_number: true,
              is_active: true,
            },
          },
          _count: {
            select: {
              users: true,
              branches: true,
            },
          },
        },
      },
      plan: {
        select: {
          plan_id: true,
          name: true,
          type: true,
          price: true,
          compare_at_price: true,
          max_users: true,
          max_branches: true,
          billing_cycle_months: true,
          bonus_months: true,
        },
      },
      paymentTransactions: {
        select: {
          transaction_id: true,
          amount: true,
          currency: true,
          status: true,
          provider: true,
          provider_payment_id: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
        take: 10,
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  // Calculate derived fields
  const daysUntilExpiry = getDaysRemaining(subscription.end_date);
  const daysUntilGraceEnd = getDaysRemaining(subscription.grace_period_until);

  return {
    subscription_id: subscription.subscription_id,
    status: subscription.status,
    payment_status: subscription.payment_status,
    billing_cycle: subscription.billing_cycle,
    is_active: subscription.is_active,

    // Dates
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    renewal_date: subscription.renewal_date,
    grace_period_until: subscription.grace_period_until,
    created_at: subscription.created_at,
    updated_at: subscription.updated_at,

    // Snapshots
    branch_limit_snapshot: subscription.branch_limit_snapshot,
    user_limit_snapshot: subscription.user_limit_snapshot,

    // Computed
    days_until_expiry: daysUntilExpiry,
    days_until_grace_end: daysUntilGraceEnd,
    is_expired: daysUntilExpiry !== null && daysUntilExpiry < 0,
    is_in_grace: daysUntilGraceEnd !== null && daysUntilGraceEnd >= 0,

    // Related data
    shop: subscription.shop,
    plan: {
      ...subscription.plan,
      price: Number(subscription.plan.price),
      compare_at_price: subscription.plan.compare_at_price
        ? Number(subscription.plan.compare_at_price)
        : null,
    },
    payment_history: subscription.paymentTransactions.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
    })),
  };
}

// ============================================
// SEND PAYMENT REMINDER
// ============================================

export async function sendPaymentReminder(subscriptionId, method, cadminId) {
  // Fetch subscription with shop/owner details
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
    include: {
      shop: {
        include: {
          owner: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              phone_number: true,
            },
          },
        },
      },
      plan: {
        select: {
          name: true,
          price: true,
        },
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  if (!subscription.is_active) {
    throw createError(
      "Cannot send reminder for suspended subscription",
      "ALREADY_SUSPENDED"
    );
  }

  const owner = subscription.shop?.owner;
  if (!owner) {
    throw createError("Shop owner not found", "OWNER_NOT_FOUND");
  }

  // Validate contact info exists
  if (method === "email" && !owner.email) {
    throw createError("Owner email not available", "NO_EMAIL");
  }
  if (method === "sms" && !owner.phone_number) {
    throw createError("Owner phone not available", "NO_PHONE");
  }

  // TODO: Implement actual email/SMS sending via your providers
  // For now, we log and return success
  
  const reminderData = {
    subscription_id: subscriptionId,
    shop_name: subscription.shop.business_name,
    owner_name: owner.full_name,
    plan_name: subscription.plan.name,
    plan_price: Number(subscription.plan.price),
    end_date: subscription.end_date,
    grace_period_until: subscription.grace_period_until,
    days_remaining: getDaysRemaining(
      subscription.grace_period_until || subscription.end_date
    ),
  };

  console.log(`[REMINDER] Method: ${method}`, reminderData);

  // Return what was "sent"
  return {
    success: true,
    method,
    sent_to:
      method === "email"
        ? owner.email
        : method === "sms"
        ? owner.phone_number
        : { email: owner.email, phone: owner.phone_number },
    shop_name: subscription.shop.business_name,
    sent_at: new Date().toISOString(),
    sent_by: cadminId,
  };
}

// ============================================
// EXTEND GRACE PERIOD
// ============================================

export async function extendGracePeriod(subscriptionId, days, reason, cadminId) {
  // Validation
  if (!days || days < 1 || days > 30) {
    throw createError("Extension must be between 1 and 30 days", "VALIDATION_ERROR");
  }

  if (!reason || reason.trim().length < 10) {
    throw createError("Reason must be at least 10 characters", "VALIDATION_ERROR");
  }

  // Fetch current subscription
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
    include: {
      shop: {
        select: {
          business_name: true,
        },
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  if (!subscription.is_active) {
    throw createError(
      "Cannot extend grace for suspended subscription. Reactivate first.",
      "ALREADY_SUSPENDED"
    );
  }

  // Calculate new grace end date
  // If already in grace, extend from current grace_period_until
  // If not in grace yet, extend from end_date
  const baseDate = subscription.grace_period_until || subscription.end_date;
  const previousGraceEnd = subscription.grace_period_until;
  const newGraceEnd = addDays(new Date(baseDate), days);

  // Update subscription
  const updated = await prisma.shopSubscription.update({
    where: { subscription_id: subscriptionId },
    data: {
      grace_period_until: newGraceEnd,
      updated_at: new Date(),
    },
  });

  // TODO: Log this action to audit table

  return {
    subscription_id: subscriptionId,
    shop_name: subscription.shop.business_name,
    previous_grace_end: previousGraceEnd,
    new_grace_end: newGraceEnd,
    days_extended: days,
    reason: reason.trim(),
    extended_by: cadminId,
    extended_at: new Date().toISOString(),
  };
}

// ============================================
// FORCE SUSPEND SUBSCRIPTION
// ============================================

export async function forceSuspendSubscription(subscriptionId, reason, cadminId) {
  // Validation
  if (!reason || reason.trim().length < 10) {
    throw createError("Reason must be at least 10 characters", "VALIDATION_ERROR");
  }

  // Fetch subscription
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
    include: {
      shop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  if (!subscription.is_active) {
    throw createError("Subscription is already suspended", "ALREADY_SUSPENDED");
  }

  // Use transaction to suspend both subscription and shop
  await prisma.$transaction(async (tx) => {
    // Suspend subscription
    await tx.shopSubscription.update({
      where: { subscription_id: subscriptionId },
      data: {
        is_active: false,
        status: "suspended",
        updated_at: new Date(),
      },
    });

    // Also suspend the shop
    await tx.shop.update({
      where: { shop_id: subscription.shop.shop_id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  });

  // TODO: Log to audit table
  // TODO: Send notification to shop owner

  return {
    subscription_id: subscriptionId,
    shop_id: subscription.shop.shop_id,
    shop_name: subscription.shop.business_name,
    new_status: "suspended",
    reason: reason.trim(),
    suspended_by: cadminId,
    suspended_at: new Date().toISOString(),
  };
}

// ============================================
// REACTIVATE SUBSCRIPTION
// ============================================

export async function reactivateSubscription(
  subscriptionId,
  reason,
  extendDays = 30,
  cadminId
) {
  // Validation
  if (!reason || reason.trim().length < 10) {
    throw createError("Reason must be at least 10 characters", "VALIDATION_ERROR");
  }

  if (extendDays < 1 || extendDays > 365) {
    throw createError("Extension days must be between 1 and 365", "VALIDATION_ERROR");
  }

  // Fetch subscription
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
    include: {
      shop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  if (subscription.is_active) {
    throw createError("Subscription is already active", "ALREADY_ACTIVE");
  }

  // Calculate new dates from today
  const now = new Date();
  const newEndDate = addDays(now, extendDays);
  const newGraceEnd = addDays(newEndDate, 7); // 7-day grace period

  // Use transaction to reactivate both subscription and shop
  await prisma.$transaction(async (tx) => {
    // Reactivate subscription
    await tx.shopSubscription.update({
      where: { subscription_id: subscriptionId },
      data: {
        is_active: true,
        status: "active",
        end_date: newEndDate,
        grace_period_until: newGraceEnd,
        updated_at: new Date(),
      },
    });

    // Also reactivate the shop
    await tx.shop.update({
      where: { shop_id: subscription.shop.shop_id },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
    });
  });

  // TODO: Log to audit table
  // TODO: Send notification to shop owner

  return {
    subscription_id: subscriptionId,
    shop_id: subscription.shop.shop_id,
    shop_name: subscription.shop.business_name,
    new_status: "active",
    new_end_date: newEndDate,
    new_grace_end: newGraceEnd,
    extend_days: extendDays,
    reason: reason.trim(),
    reactivated_by: cadminId,
    reactivated_at: new Date().toISOString(),
  };
}