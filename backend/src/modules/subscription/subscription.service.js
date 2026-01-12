// src/modules/subscription/subscription.service.js

import prisma from "../../config/prisma.js";
import {
  razorpay,
  RAZORPAY_CURRENCY,
  verifyPaymentSignature,
} from "../../config/razorpay.js";

// ============================================
// CONSTANTS
// ============================================

const GRACE_PERIOD_DAYS = 7;

// ============================================
// HELPER: Create Error with Code
// ============================================

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// ============================================
// HELPER: Calculate Subscription Dates
// ============================================

/**
 * Calculate subscription dates based on plan configuration
 * 
 * Logic:
 * 1. If promo is active: reference_date = promo_free_until
 * 2. Else: reference_date = today
 * 3. end_date = reference_date + billing_cycle_months + bonus_months
 * 4. grace_period_until = end_date + 7 days
 * 
 * @param {Object} plan - Plan object from database
 * @returns {Object} { start_date, end_date, renewal_date, grace_period_until }
 */
function calculateSubscriptionDates(plan) {
  const now = new Date();
  const start_date = new Date(now);
  
  // Determine reference date for calculating end date
  let referenceDate = new Date(now);
  
  // If promo is active, billing starts from promo end date
  if (plan.promo_free_until) {
    const promoDate = new Date(plan.promo_free_until);
    if (promoDate > now) {
      referenceDate = promoDate;
    }
  }

  // Calculate total months
  const billingCycleMonths = plan.billing_cycle_months || 12;
  const bonusMonths = plan.bonus_months || 0;
  const totalMonths = billingCycleMonths + bonusMonths;
  
  // Calculate end date
  const end_date = new Date(referenceDate);
  end_date.setMonth(end_date.getMonth() + totalMonths);

  // Calculate grace period (7 days after end date)
  const grace_period_until = new Date(end_date);
  grace_period_until.setDate(grace_period_until.getDate() + GRACE_PERIOD_DAYS);

  // Renewal date is same as end date
  const renewal_date = new Date(end_date);

  return { 
    start_date, 
    end_date, 
    renewal_date, 
    grace_period_until 
  };
}

/**
 * Check if a plan is currently free (price = 0 OR promo active)
 * @param {Object} plan - Plan object
 * @returns {boolean}
 */
function isPlanEffectivelyFree(plan) {
  const isPriceZero = Number(plan.price) === 0;
  const isPromoActive = plan.promo_free_until && new Date(plan.promo_free_until) > new Date();
  return isPriceZero || isPromoActive;
}

// ============================================
// GET VISIBLE PLANS (For Customer Selection)
// ============================================

/**
 * Get plans available for customer selection
 * Only ACTIVE + PRE_MADE + not deleted
 */
export async function getVisiblePlans() {
  const plans = await prisma.plan.findMany({
    where: {
      status: "ACTIVE",
      type: "PRE_MADE",
      deleted_at: null,
    },
    orderBy: [
      { price: "asc" }, 
      { name: "asc" }
    ],
    select: {
      plan_id: true,
      name: true,
      description: true,
      price: true,
      compare_at_price: true,
      max_users: true,
      max_branches: true,
      billing_cycle_months: true,
      bonus_months: true,
      promo_free_until: true,
      is_featured: true,
      is_customizable: true,
    },
  });

  // Format plans with computed fields
  const now = new Date();
  
  return plans.map(plan => ({
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price),
    compare_at_price: plan.compare_at_price ? Number(plan.compare_at_price) : null,
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    billing_cycle_months: plan.billing_cycle_months || 12,
    bonus_months: plan.bonus_months || 0,
    promo_free_until: plan.promo_free_until,
    is_promo_active: plan.promo_free_until ? new Date(plan.promo_free_until) > now : false,
    is_featured: plan.is_featured,
    is_customizable: plan.is_customizable,
  }));
}

// ============================================
// GET USER DETAILS (For Razorpay Prefill)
// ============================================

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
    },
  });

  if (!user) {
    throw createError("User not found", "USER_NOT_FOUND");
  }

  return user;
}

// ============================================
// GET ACTIVE PLAN (Validated for Selection)
// ============================================

/**
 * Get plan by ID (must be active and available)
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
    throw createError("Plan not found or not available", "PLAN_NOT_FOUND");
  }

  return plan;
}

// ============================================
// CREATE FREE SUBSCRIPTION
// ============================================

/**
 * Create subscription for FREE plan (Standard Free or Promo Free)
 * Activates immediately without payment
 */
export async function createFreeSubscription({ shop_id, plan, isPromoApplied = false }) {
  const dates = calculateSubscriptionDates(plan);

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: plan.plan_id,
      status: "active",
      payment_status: "paid", // Free = no payment needed
      billing_cycle: "yearly",
      
      start_date: dates.start_date,
      end_date: dates.end_date,
      renewal_date: dates.renewal_date,
      grace_period_until: dates.grace_period_until,

      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
      is_active: true,
    },
  });

  // Set as current subscription for shop
  await prisma.shop.update({
    where: { shop_id },
    data: { current_subscription_id: subscription.subscription_id },
  });

  // Log the transaction (for promo tracking)
  if (isPromoApplied) {
    await prisma.paymentTransaction.create({
      data: {
        shop_id,
        subscription_id: subscription.subscription_id,
        provider: "promo",
        amount: BigInt(0),
        currency: "INR",
        status: "completed",
        meta: {
          plan_name: plan.name,
          promo_free_until: plan.promo_free_until,
          original_price: Number(plan.price),
          created_at: new Date().toISOString(),
        },
      },
    });
  }

  return subscription;
}

// ============================================
// CREATE PAID SUBSCRIPTION (Pending Payment)
// ============================================

/**
 * Create subscription for PAID plan
 * Creates Razorpay order and returns payment details
 */
export async function createPaidSubscription({ shop_id, plan, user }) {
  const dates = calculateSubscriptionDates(plan);

  // 1. Create Pending Subscription
  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: plan.plan_id,
      status: "pending",
      payment_status: "pending",
      billing_cycle: "yearly",
      
      // These will be recalculated on payment confirmation
      start_date: dates.start_date,
      end_date: dates.end_date,
      renewal_date: dates.renewal_date,
      grace_period_until: dates.grace_period_until,

      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
      is_active: false, // Not active until payment confirmed
    },
  });

  // 2. Create Razorpay Order
  // IMPORTANT: Razorpay API requires amount in PAISA (smallest currency unit)
  // We store in Rupees, so multiply by 100 for Razorpay
  const priceInRupees = Number(plan.price);
  const amountInPaisa = Math.round(priceInRupees * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaisa,
    currency: RAZORPAY_CURRENCY,
    receipt: subscription.subscription_id,
    notes: {
      shop_id,
      plan_id: plan.plan_id,
      plan_name: plan.name,
      subscription_id: subscription.subscription_id,
    },
  });

  // 3. Store Payment Transaction (amount in Rupees)
  await prisma.paymentTransaction.create({
    data: {
      shop_id,
      subscription_id: subscription.subscription_id,
      provider: "razorpay",
      provider_order_id: razorpayOrder.id,
      amount: BigInt(priceInRupees), // Store in Rupees
      currency: RAZORPAY_CURRENCY,
      status: "created",
      meta: {
        plan_name: plan.name,
        billing_cycle_months: plan.billing_cycle_months || 12,
        bonus_months: plan.bonus_months || 0,
        created_at: new Date().toISOString(),
      },
    },
  });

  return {
    subscription,
    razorpay_order_id: razorpayOrder.id,
    razorpay_key: process.env.RAZORPAY_KEY_ID,
    amount: amountInPaisa, // Send paisa to frontend for Razorpay SDK
    amount_in_rupees: priceInRupees, // For display purposes
    currency: RAZORPAY_CURRENCY,
    user_name: user.full_name,
    user_email: user.email,
    user_phone: user.phone_number,
  };
}

// ============================================
// VERIFY AND ACTIVATE SUBSCRIPTION
// ============================================

/**
 * Verify payment and activate subscription
 * Recalculates dates based on actual payment time
 */
export async function verifyAndActivateSubscription({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  subscription_id,
}) {
  // Step 1: Verify Razorpay signature
  const isValid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    throw createError("Payment verification failed - invalid signature", "INVALID_SIGNATURE");
  }

  // Step 2: Find the payment transaction
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { provider_order_id: razorpay_order_id },
    include: { subscription: true },
  });

  if (!transaction) {
    throw createError("Transaction not found", "TRANSACTION_NOT_FOUND");
  }

  if (transaction.subscription_id !== subscription_id) {
    throw createError("Subscription mismatch", "SUBSCRIPTION_MISMATCH");
  }

  // Step 3: Get plan to recalculate dates
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id },
    include: { plan: true },
  });

  if (!subscription) {
    throw createError("Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  // Step 4: Recalculate dates based on actual payment time
  const dates = calculateSubscriptionDates(subscription.plan);

  // Step 5: Update everything in a transaction
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
          captured_at: new Date().toISOString(),
        },
      },
    });

    // Activate subscription with final dates
    const activatedSubscription = await tx.shopSubscription.update({
      where: { subscription_id },
      data: {
        status: "active",
        payment_status: "paid",
        is_active: true,
        start_date: dates.start_date,
        end_date: dates.end_date,
        renewal_date: dates.renewal_date,
        grace_period_until: dates.grace_period_until,
      },
      include: { plan: true },
    });

    // Set as current subscription for shop
    await tx.shop.update({
      where: { shop_id: transaction.shop_id },
      data: { current_subscription_id: subscription_id },
    });

    return activatedSubscription;
  });

  return result;
}

// ============================================
// GET SUBSCRIPTION STATUS
// ============================================

/**
 * Get subscription status for a shop
 */
export async function getSubscriptionStatus(shop_id) {
  if (!shop_id) return null;

  const subscription = await prisma.shopSubscription.findFirst({
    where: {
      shop_id,
      is_active: true,
    },
    include: { 
      plan: {
        select: {
          plan_id: true,
          name: true,
          price: true,
          max_users: true,
          max_branches: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  if (!subscription) return null;

  const now = new Date();
  const isExpired = new Date(subscription.end_date) < now;
  const isInGracePeriod = subscription.grace_period_until 
    ? new Date(subscription.grace_period_until) >= now && isExpired
    : false;

  return {
    ...subscription,
    plan: {
      ...subscription.plan,
      price: Number(subscription.plan.price),
    },
    is_expired: isExpired,
    is_in_grace_period: isInGracePeriod,
  };
}

// ============================================
// GET SUBSCRIPTION HISTORY
// ============================================

/**
 * Get subscription history for a shop
 */
export async function getSubscriptionHistory(shop_id) {
  if (!shop_id) return [];

  const subscriptions = await prisma.shopSubscription.findMany({
    where: { shop_id },
    include: { 
      plan: {
        select: {
          plan_id: true,
          name: true,
          price: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return subscriptions.map(sub => ({
    ...sub,
    plan: {
      ...sub.plan,
      price: Number(sub.plan.price),
    },
  }));
}

// ============================================
// CANCEL PENDING SUBSCRIPTION
// ============================================

/**
 * Cancel pending subscription (e.g., user closed Razorpay popup)
 */
export async function cancelPendingSubscriptionService(subscription_id, shop_id) {
  const subscription = await prisma.shopSubscription.findFirst({
    where: {
      subscription_id,
      shop_id,
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  if (subscription.status !== "pending") {
    throw createError("Can only cancel pending subscriptions", "NOT_PENDING");
  }

  await prisma.$transaction(async (tx) => {
    // Update subscription
    await tx.shopSubscription.update({
      where: { subscription_id },
      data: {
        status: "cancelled",
        is_active: false,
      },
    });

    // Update related payment transaction
    await tx.paymentTransaction.updateMany({
      where: { subscription_id },
      data: { status: "cancelled" },
    });
  });

  return { success: true };
}

// ============================================
// PLAN CHANGE ANALYSIS
// ============================================

/**
 * Analyze what happens when switching to a new plan
 */
export async function analyzePlanChangeService(shop_id, target_plan_id) {
  // Get current subscription with plan
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: {
        include: { plan: true },
      },
      _count: {
        select: {
          users: {
            where: {
              is_active: true,
              role: { in: ["branch_admin", "staff"] },
            },
          },
          branches: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  if (!shop?.currentSubscription) {
    throw createError("No active subscription found", "NO_ACTIVE_SUBSCRIPTION");
  }

  // Get target plan
  const targetPlan = await prisma.plan.findFirst({
    where: {
      plan_id: target_plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  if (!targetPlan) {
    throw createError("Target plan not found", "PLAN_NOT_FOUND");
  }

  const currentPlan = shop.currentSubscription.plan;
  const activeUsers = shop._count.users;
  const activeBranches = shop._count.branches;

  // Same plan check
  if (currentPlan.plan_id === target_plan_id) {
    return {
      direction: "no_change",
      hasImpact: false,
      currentPlan: formatPlanForResponse(currentPlan),
      targetPlan: formatPlanForResponse(targetPlan),
    };
  }

  // Determine direction
  const normalizeLimit = (val) => (val === -1 ? Infinity : val);

  const currentMaxUsers = normalizeLimit(currentPlan.max_users);
  const currentMaxBranches = normalizeLimit(currentPlan.max_branches);
  const targetMaxUsers = normalizeLimit(targetPlan.max_users);
  const targetMaxBranches = normalizeLimit(targetPlan.max_branches);

  const userDecrease = targetMaxUsers < currentMaxUsers;
  const branchDecrease = targetMaxBranches < currentMaxBranches;
  const isDowngrade = userDecrease || branchDecrease;

  if (isDowngrade) {
    const excessUsers = targetPlan.max_users !== -1
      ? Math.max(0, activeUsers - targetPlan.max_users)
      : 0;
    const excessBranches = targetPlan.max_branches !== -1
      ? Math.max(0, activeBranches - targetPlan.max_branches)
      : 0;

    return {
      direction: "downgrade",
      hasImpact: excessUsers > 0 || excessBranches > 0,
      currentPlan: formatPlanForResponse(currentPlan),
      targetPlan: formatPlanForResponse(targetPlan),
      usage: {
        activeUsers,
        activeBranches,
      },
      compliance: {
        users: {
          current: activeUsers,
          allowed: targetPlan.max_users,
          excess: excessUsers,
        },
        branches: {
          current: activeBranches,
          allowed: targetPlan.max_branches,
          excess: excessBranches,
        },
      },
    };
  }

  // Upgrade
  return {
    direction: "upgrade",
    hasImpact: false,
    currentPlan: formatPlanForResponse(currentPlan),
    targetPlan: formatPlanForResponse(targetPlan),
    usage: {
      activeUsers,
      activeBranches,
    },
  };
}

// ============================================
// GET COMPLIANCE DATA FOR DOWNGRADE
// ============================================

/**
 * Get compliance data for downgrade modal
 */
export async function getComplianceDataService(shop_id, target_plan_id) {
  // Get target plan
  const targetPlan = await prisma.plan.findFirst({
    where: {
      plan_id: target_plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  if (!targetPlan) {
    throw createError("Target plan not found", "PLAN_NOT_FOUND");
  }

  // Get shop with owner
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: { owner_user_id: true },
  });

  // Get active users (excluding owner/super_admin)
  const users = await prisma.user.findMany({
    where: {
      shop_id,
      is_active: true,
      role: { in: ["branch_admin", "staff"] },
      user_id: { not: shop.owner_user_id },
    },
    select: {
      user_id: true,
      full_name: true,
      username: true,
      role: true,
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { full_name: "asc" }],
  });

  // Get active branches
  const branches = await prisma.branch.findMany({
    where: {
      shop_id,
      is_active: true,
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
    orderBy: [{ branch_type: "asc" }, { branch_name: "asc" }],
  });

  return {
    targetPlan: formatPlanForResponse(targetPlan),
    users: users.map((u) => ({
      user_id: u.user_id,
      full_name: u.full_name,
      username: u.username,
      role: u.role,
      branch_name: u.branch?.branch_name || "Unassigned",
    })),
    branches: branches.map((b) => ({
      branch_id: b.branch_id,
      branch_name: b.branch_name,
      is_main: b.branch_type === "main",
      user_count: b._count.users,
    })),
    counts: {
      activeUsers: users.length,
      activeBranches: branches.length,
      userLimit: targetPlan.max_users,
      branchLimit: targetPlan.max_branches,
    },
  };
}

// ============================================
// CHANGE PLAN SERVICE
// ============================================

/**
 * Execute plan change (upgrade or downgrade)
 */
export async function changePlanService({
  shop_id,
  user_id,
  target_plan_id,
  users_to_disable = [],
  branches_to_deactivate = [],
  user_reassignments = [],
}) {
  // Analyze the change first
  const analysis = await analyzePlanChangeService(shop_id, target_plan_id);

  if (analysis.direction === "no_change") {
    throw createError("Target plan is the same as current plan", "SAME_PLAN");
  }

  // Get target plan
  const targetPlan = await prisma.plan.findFirst({
    where: {
      plan_id: target_plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  // Get user details for Razorpay
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      full_name: true,
      email: true,
      phone_number: true,
    },
  });

  // UPGRADE FLOW
  if (analysis.direction === "upgrade") {
    return await executeUpgrade(shop_id, targetPlan, user);
  }

  // DOWNGRADE FLOW
  return await executeDowngrade(
    shop_id,
    targetPlan,
    analysis,
    users_to_disable,
    branches_to_deactivate,
    user_reassignments
  );
}

// ============================================
// EXECUTE UPGRADE
// ============================================

async function executeUpgrade(shop_id, targetPlan, user) {
  const dates = calculateSubscriptionDates(targetPlan);

  // Create pending subscription
  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: targetPlan.plan_id,
      status: "pending",
      payment_status: "pending",
      billing_cycle: "yearly",
      start_date: dates.start_date,
      end_date: dates.end_date,
      renewal_date: dates.renewal_date,
      grace_period_until: dates.grace_period_until,
      branch_limit_snapshot: targetPlan.max_branches,
      user_limit_snapshot: targetPlan.max_users,
      is_active: false,
    },
  });

  // Create Razorpay order
  const priceInRupees = Number(targetPlan.price);
  const amountInPaisa = Math.round(priceInRupees * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaisa,
    currency: RAZORPAY_CURRENCY,
    receipt: subscription.subscription_id,
    notes: {
      shop_id,
      plan_id: targetPlan.plan_id,
      plan_name: targetPlan.name,
      subscription_id: subscription.subscription_id,
      type: "upgrade",
    },
  });

  // Store payment transaction
  await prisma.paymentTransaction.create({
    data: {
      shop_id,
      subscription_id: subscription.subscription_id,
      provider: "razorpay",
      provider_order_id: razorpayOrder.id,
      amount: BigInt(priceInRupees),
      currency: RAZORPAY_CURRENCY,
      status: "created",
      meta: {
        plan_name: targetPlan.name,
        type: "upgrade",
        created_at: new Date().toISOString(),
      },
    },
  });

  return {
    requires_payment: true,
    subscription_id: subscription.subscription_id,
    razorpay: {
      key: process.env.RAZORPAY_KEY_ID,
      order_id: razorpayOrder.id,
      amount: amountInPaisa,
      currency: RAZORPAY_CURRENCY,
      name: "Cureli ERP",
      description: `${targetPlan.name} - Annual Subscription (Upgrade)`,
      prefill: {
        name: user.full_name || "",
        email: user.email || "",
        contact: user.phone_number || "",
      },
    },
    plan: formatPlanForResponse(targetPlan),
  };
}

// ============================================
// EXECUTE DOWNGRADE
// ============================================

async function executeDowngrade(
  shop_id,
  targetPlan,
  analysis,
  users_to_disable,
  branches_to_deactivate,
  user_reassignments = []
) {
  const now = new Date();

  // Get shop owner
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: { owner_user_id: true },
  });

  // Validate: Cannot disable owner
  if (users_to_disable.includes(shop.owner_user_id)) {
    throw createError("Cannot disable shop owner", "CANNOT_DISABLE_OWNER");
  }

  // Validate: Must keep at least 1 branch
  const activeBranches = analysis.usage.activeBranches;
  const remainingBranches = activeBranches - branches_to_deactivate.length;

  if (remainingBranches < 1) {
    throw createError("Must keep at least one active branch", "MUST_KEEP_ONE_BRANCH");
  }

  // Validate users to disable belong to shop
  if (users_to_disable.length > 0) {
    const validUsers = await prisma.user.count({
      where: {
        user_id: { in: users_to_disable },
        shop_id,
        is_active: true,
        role: { in: ["branch_admin", "staff"] },
      },
    });

    if (validUsers !== users_to_disable.length) {
      throw createError("Some users are invalid or already disabled", "INVALID_USER");
    }
  }

  // Validate branches to deactivate belong to shop
  if (branches_to_deactivate.length > 0) {
    const validBranches = await prisma.branch.count({
      where: {
        branch_id: { in: branches_to_deactivate },
        shop_id,
        is_active: true,
      },
    });

    if (validBranches !== branches_to_deactivate.length) {
      throw createError("Some branches are invalid or already deactivated", "INVALID_BRANCH");
    }
  }

  // Validate user reassignments
  if (user_reassignments.length > 0) {
    const targetBranchIds = [...new Set(user_reassignments.map((r) => r.toBranchId))];
    const invalidTargets = targetBranchIds.filter((id) => branches_to_deactivate.includes(id));

    if (invalidTargets.length > 0) {
      throw createError("Cannot reassign users to a branch being deactivated", "INVALID_REASSIGNMENT_TARGET");
    }

    const validTargetBranches = await prisma.branch.count({
      where: {
        branch_id: { in: targetBranchIds },
        shop_id,
        is_active: true,
      },
    });

    if (validTargetBranches !== targetBranchIds.length) {
      throw createError("Some target branches for reassignment are invalid", "INVALID_TARGET_BRANCH");
    }
  }

  // Remove reassigned users from disable list
  const reassignedUserIds = new Set(user_reassignments.map((r) => r.userId));
  const finalUsersToDisable = users_to_disable.filter((id) => !reassignedUserIds.has(id));

  // Check final compliance
  const finalActiveUsers = analysis.usage.activeUsers - finalUsersToDisable.length;
  const finalActiveBranches = activeBranches - branches_to_deactivate.length;

  const userLimit = targetPlan.max_users === -1 ? Infinity : targetPlan.max_users;
  const branchLimit = targetPlan.max_branches === -1 ? Infinity : targetPlan.max_branches;

  if (finalActiveUsers > userLimit) {
    const err = createError(
      `Still ${finalActiveUsers - userLimit} users over the limit. Please disable more users.`,
      "NOT_COMPLIANT"
    );
    err.details = { type: "users", excess: finalActiveUsers - userLimit };
    throw err;
  }

  if (finalActiveBranches > branchLimit) {
    const err = createError(
      `Still ${finalActiveBranches - branchLimit} branches over the limit. Please deactivate more branches.`,
      "NOT_COMPLIANT"
    );
    err.details = { type: "branches", excess: finalActiveBranches - branchLimit };
    throw err;
  }

  // Calculate dates for new subscription
  const dates = calculateSubscriptionDates(targetPlan);

  // Execute downgrade in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Disable users
    if (finalUsersToDisable.length > 0) {
      await tx.user.updateMany({
        where: { user_id: { in: finalUsersToDisable } },
        data: {
          is_active: false,
          status: "inactive",
        },
      });

      // Invalidate their sessions
      await tx.userSession.updateMany({
        where: {
          user_id: { in: finalUsersToDisable },
          is_active: true,
        },
        data: {
          is_active: false,
          ended_at: now,
          ended_reason: "admin_force",
        },
      });
    }

    // 2. Reassign users to new branches
    if (user_reassignments.length > 0) {
      for (const reassignment of user_reassignments) {
        await tx.user.update({
          where: { user_id: reassignment.userId },
          data: { branch_id: reassignment.toBranchId },
        });
      }
    }

    // 3. Deactivate branches
    if (branches_to_deactivate.length > 0) {
      await tx.branch.updateMany({
        where: { branch_id: { in: branches_to_deactivate } },
        data: { is_active: false },
      });
    }

    // 4. Deactivate old subscription
    const oldSubscription = await tx.shop.findUnique({
      where: { shop_id },
      select: { current_subscription_id: true },
    });

    if (oldSubscription?.current_subscription_id) {
      await tx.shopSubscription.update({
        where: { subscription_id: oldSubscription.current_subscription_id },
        data: {
          is_active: false,
          status: "cancelled",
        },
      });
    }

    // 5. Create new subscription
    const newSubscription = await tx.shopSubscription.create({
      data: {
        shop_id,
        plan_id: targetPlan.plan_id,
        status: "active",
        payment_status: "paid",
        billing_cycle: "yearly",
        start_date: dates.start_date,
        end_date: dates.end_date,
        renewal_date: dates.renewal_date,
        grace_period_until: dates.grace_period_until,
        branch_limit_snapshot: targetPlan.max_branches,
        user_limit_snapshot: targetPlan.max_users,
        is_active: true,
      },
    });

    // 6. Update shop's current subscription
    await tx.shop.update({
      where: { shop_id },
      data: { current_subscription_id: newSubscription.subscription_id },
    });

    return newSubscription;
  });

  return {
    requires_payment: false,
    subscription: {
      subscription_id: result.subscription_id,
      status: result.status,
      start_date: result.start_date,
      end_date: result.end_date,
    },
    plan: formatPlanForResponse(targetPlan),
    disabled_users: finalUsersToDisable.length,
    deactivated_branches: branches_to_deactivate.length,
    reassigned_users: user_reassignments.length,
  };
}

// ============================================
// HELPER: Format Plan for API Response
// ============================================

function formatPlanForResponse(plan) {
  const now = new Date();
  const isPromoActive = plan.promo_free_until 
    ? new Date(plan.promo_free_until) > now 
    : false;

  return {
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price),
    compare_at_price: plan.compare_at_price ? Number(plan.compare_at_price) : null,
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    billing_cycle_months: plan.billing_cycle_months || 12,
    bonus_months: plan.bonus_months || 0,
    promo_free_until: plan.promo_free_until,
    is_promo_active: isPromoActive,
    is_featured: plan.is_featured,
  };
}