//Q:\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\subscription\subscription.service.js
import prisma from "../../config/prisma.js";
import {
  razorpay,
  RAZORPAY_CURRENCY,
  verifyPaymentSignature,
} from "../../config/razorpay.js";

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
    orderBy: [{ price: "asc" }, { name: "asc" }],
    select: {
      plan_id: true,
      name: true,
      description: true,
      price: true,
      max_users: true,
      max_branches: true,
      is_highlighted: true,
      is_customizable: true,
    },
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
    },
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
    amount: Number(plan.price) * 100, // Already in paisa
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
    amount: Number(plan.price) * 100,
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
    const err = new Error("No active subscription found");
    err.code = "NO_ACTIVE_SUBSCRIPTION";
    throw err;
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
    const err = new Error("Target plan not found");
    err.code = "PLAN_NOT_FOUND";
    throw err;
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
    const excessUsers =
      targetPlan.max_users !== -1
        ? Math.max(0, activeUsers - targetPlan.max_users)
        : 0;
    const excessBranches =
      targetPlan.max_branches !== -1
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
    const err = new Error("Target plan not found");
    err.code = "PLAN_NOT_FOUND";
    throw err;
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

/**
 * ============================================
 * PLAN CHANGE EXECUTION
 * ============================================
 */

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
    const err = new Error("Target plan is the same as current plan");
    err.code = "SAME_PLAN";
    throw err;
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

  // ============================================
  // UPGRADE FLOW
  // ============================================
  if (analysis.direction === "upgrade") {
    return await executeUpgrade(shop_id, targetPlan, user);
  }

  // ============================================
  // DOWNGRADE FLOW
  // ============================================
  return await executeDowngrade(
    shop_id,
    targetPlan,
    analysis,
    users_to_disable,
    branches_to_deactivate,
    user_reassignments
  );
}

/**
 * Execute upgrade - create Razorpay order
 */
async function executeUpgrade(shop_id, targetPlan, user) {
  const now = new Date();

  // Create pending subscription
  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: targetPlan.plan_id,
      status: "pending",
      payment_status: "pending",
      billing_cycle: "yearly",
      start_date: now,
      end_date: now, // Updated after payment
      renewal_date: now,
      branch_limit_snapshot: targetPlan.max_branches,
      user_limit_snapshot: targetPlan.max_users,
    },
  });

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Number(targetPlan.price) * 100, // Convert to paisa
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
      amount: BigInt(targetPlan.price),
      currency: RAZORPAY_CURRENCY,
      status: "created",
      meta: {
        plan_name: targetPlan.name,
        type: "upgrade",
        created_at: now.toISOString(),
      },
    },
  });

  return {
    requires_payment: true,
    subscription_id: subscription.subscription_id,
    razorpay: {
      key: process.env.RAZORPAY_KEY_ID,
      order_id: razorpayOrder.id,
      amount: Number(targetPlan.price) * 100,
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

/**
 * Execute downgrade - validate compliance and apply immediately
 */
async function executeDowngrade(
  shop_id,
  targetPlan,
  analysis,
  users_to_disable,
  branches_to_deactivate,
  user_reassignments = [] // NEW parameter
) {
  // Get shop owner
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: { owner_user_id: true },
  });

  // Validate: Cannot disable owner
  if (users_to_disable.includes(shop.owner_user_id)) {
    const err = new Error("Cannot disable shop owner");
    err.code = "CANNOT_DISABLE_OWNER";
    throw err;
  }

  // Validate: Must keep at least 1 branch
  const activeBranches = analysis.usage.activeBranches;
  const remainingBranches = activeBranches - branches_to_deactivate.length;

  if (remainingBranches < 1) {
    const err = new Error("Must keep at least one active branch");
    err.code = "MUST_KEEP_ONE_BRANCH";
    throw err;
  }

  // Validate: Users to disable belong to shop
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
      const err = new Error("Some users are invalid or already disabled");
      err.code = "INVALID_USER";
      throw err;
    }
  }

  // Validate: Branches to deactivate belong to shop
  if (branches_to_deactivate.length > 0) {
    const validBranches = await prisma.branch.count({
      where: {
        branch_id: { in: branches_to_deactivate },
        shop_id,
        is_active: true,
      },
    });

    if (validBranches !== branches_to_deactivate.length) {
      const err = new Error("Some branches are invalid or already deactivated");
      err.code = "INVALID_BRANCH";
      throw err;
    }
  }

  // NEW: Validate user reassignments
  if (user_reassignments.length > 0) {
    // Check all target branches exist and are not being deactivated
    const targetBranchIds = [
      ...new Set(user_reassignments.map((r) => r.toBranchId)),
    ];

    const invalidTargets = targetBranchIds.filter((id) =>
      branches_to_deactivate.includes(id)
    );

    if (invalidTargets.length > 0) {
      const err = new Error(
        "Cannot reassign users to a branch being deactivated"
      );
      err.code = "INVALID_REASSIGNMENT_TARGET";
      throw err;
    }

    const validTargetBranches = await prisma.branch.count({
      where: {
        branch_id: { in: targetBranchIds },
        shop_id,
        is_active: true,
      },
    });

    if (validTargetBranches !== targetBranchIds.length) {
      const err = new Error(
        "Some target branches for reassignment are invalid"
      );
      err.code = "INVALID_TARGET_BRANCH";
      throw err;
    }

    // Check users being reassigned exist
    const reassignUserIds = user_reassignments.map((r) => r.userId);
    const validReassignUsers = await prisma.user.count({
      where: {
        user_id: { in: reassignUserIds },
        shop_id,
        is_active: true,
      },
    });

    if (validReassignUsers !== reassignUserIds.length) {
      const err = new Error("Some users for reassignment are invalid");
      err.code = "INVALID_REASSIGN_USER";
      throw err;
    }
  }

  // Remove reassigned users from disable list
  const reassignedUserIds = new Set(user_reassignments.map((r) => r.userId));
  const finalUsersToDisable = users_to_disable.filter(
    (id) => !reassignedUserIds.has(id)
  );

  // Check final compliance
  const finalActiveUsers =
    analysis.usage.activeUsers - finalUsersToDisable.length;
  const finalActiveBranches = activeBranches - branches_to_deactivate.length;

  const userLimit =
    targetPlan.max_users === -1 ? Infinity : targetPlan.max_users;
  const branchLimit =
    targetPlan.max_branches === -1 ? Infinity : targetPlan.max_branches;

  if (finalActiveUsers > userLimit) {
    const err = new Error(
      `Still ${
        finalActiveUsers - userLimit
      } users over the limit. Please disable more users.`
    );
    err.code = "NOT_COMPLIANT";
    err.details = { type: "users", excess: finalActiveUsers - userLimit };
    throw err;
  }

  if (finalActiveBranches > branchLimit) {
    const err = new Error(
      `Still ${
        finalActiveBranches - branchLimit
      } branches over the limit. Please deactivate more branches.`
    );
    err.code = "NOT_COMPLIANT";
    err.details = {
      type: "branches",
      excess: finalActiveBranches - branchLimit,
    };
    throw err;
  }

  // ============================================
  // EXECUTE DOWNGRADE IN TRANSACTION
  // ============================================
  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

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

    // 2. NEW: Reassign users to new branches
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
        start_date: now,
        end_date: endDate,
        renewal_date: endDate,
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

/**
 * Cancel pending subscription
 */
export async function cancelPendingSubscriptionService(
  subscription_id,
  shop_id
) {
  const subscription = await prisma.shopSubscription.findFirst({
    where: {
      subscription_id,
      shop_id,
    },
  });

  if (!subscription) {
    const err = new Error("Subscription not found");
    err.code = "SUBSCRIPTION_NOT_FOUND";
    throw err;
  }

  if (subscription.status !== "pending") {
    const err = new Error("Can only cancel pending subscriptions");
    err.code = "NOT_PENDING";
    throw err;
  }

  await prisma.shopSubscription.update({
    where: { subscription_id },
    data: {
      status: "cancelled",
      is_active: false,
    },
  });

  return { success: true };
}

/**
 * Helper: Format plan for API response
 */
function formatPlanForResponse(plan) {
  return {
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price),
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    is_highlighted: plan.is_highlighted,
  };
}