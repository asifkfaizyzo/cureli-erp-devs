// backend/src/modules/subscription/subscription.service.js

import prisma from "../../config/prisma.js";
import {
  razorpay,
  RAZORPAY_CURRENCY,
  verifyPaymentSignature,
} from "../../config/razorpay.js";
import {
  SubscriptionStatus,
  PaymentStatus,
  canAccessApp,
  getSubscriptionState,
  getDaysRemaining,
  GRACE_PERIOD_DAYS,
} from "../../config/subscription.js";

// ============================================
// GET VISIBLE PLANS
// ============================================
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

// ============================================
// GET USER DETAILS
// ============================================
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

// ============================================
// GET ACTIVE PLAN
// ============================================
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

// ============================================
// CREATE FREE SUBSCRIPTION
// ============================================
export async function createFreeSubscription({ shop_id, plan }) {
  const now = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: plan.plan_id,
      status: SubscriptionStatus.ACTIVE,
      payment_status: PaymentStatus.PAID,
      billing_cycle: "yearly",
      start_date: now,
      end_date: end,
      renewal_date: end,
      activated_at: now,
      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
    },
  });

  await prisma.shop.update({
    where: { shop_id },
    data: { current_subscription_id: subscription.subscription_id },
  });

  return subscription;
}

// ============================================
// CREATE PAID SUBSCRIPTION
// ============================================
export async function createPaidSubscription({ shop_id, plan, user }) {
  const now = new Date();

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: plan.plan_id,
      status: SubscriptionStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      billing_cycle: "yearly",
      start_date: now,
      end_date: now,
      renewal_date: now,
      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
    },
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: Number(plan.price) * 100,
    currency: RAZORPAY_CURRENCY,
    receipt: subscription.subscription_id,
    notes: {
      shop_id,
      plan_id: plan.plan_id,
      plan_name: plan.name,
      subscription_id: subscription.subscription_id,
    },
  });

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

// ============================================
// VERIFY AND ACTIVATE SUBSCRIPTION
// ============================================
export async function verifyAndActivateSubscription({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  subscription_id,
}) {
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

  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const result = await prisma.$transaction(async (tx) => {
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

    const subscription = await tx.shopSubscription.update({
      where: { subscription_id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        payment_status: PaymentStatus.PAID,
        start_date: now,
        end_date: endDate,
        renewal_date: endDate,
        activated_at: now,
      },
      include: { plan: true },
    });

    await tx.shop.update({
      where: { shop_id: transaction.shop_id },
      data: { current_subscription_id: subscription_id },
    });

    return subscription;
  });

  return result;
}

// ============================================
// GET SUBSCRIPTION STATUS
// ============================================
export async function getSubscriptionStatus(shop_id) {
  if (!shop_id) return null;

  const subscription = await prisma.shopSubscription.findFirst({
    where: {
      shop_id,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED] },
    },
    include: { plan: true },
    orderBy: { created_at: "desc" },
  });

  if (!subscription) return null;

  // Enrich with computed state
  const state = getSubscriptionState(subscription);

  return {
    ...subscription,
    computed: state,
  };
}

// ============================================
// GET SUBSCRIPTION HISTORY
// ============================================
export async function getSubscriptionHistory(shop_id) {
  if (!shop_id) return [];

  return prisma.shopSubscription.findMany({
    where: { shop_id },
    include: { plan: true },
    orderBy: { created_at: "desc" },
  });
}

// ============================================
// ANALYZE PLAN CHANGE
// ============================================
export async function analyzePlanChangeService(shop_id, target_plan_id) {
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

  // Check if subscription allows access
  if (!canAccessApp(shop.currentSubscription)) {
    const err = new Error("Subscription expired. Please renew first.");
    err.code = "SUBSCRIPTION_EXPIRED";
    throw err;
  }

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

  if (currentPlan.plan_id === target_plan_id) {
    return {
      direction: "no_change",
      hasImpact: false,
      currentPlan: formatPlanForResponse(currentPlan),
      targetPlan: formatPlanForResponse(targetPlan),
    };
  }

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
// GET COMPLIANCE DATA
// ============================================
export async function getComplianceDataService(shop_id, target_plan_id) {
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

  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: { owner_user_id: true },
  });

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
export async function changePlanService({
  shop_id,
  user_id,
  target_plan_id,
  users_to_disable = [],
  branches_to_deactivate = [],
  user_reassignments = [],
}) {
  const analysis = await analyzePlanChangeService(shop_id, target_plan_id);

  if (analysis.direction === "no_change") {
    const err = new Error("Target plan is the same as current plan");
    err.code = "SAME_PLAN";
    throw err;
  }

  const targetPlan = await prisma.plan.findFirst({
    where: {
      plan_id: target_plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      full_name: true,
      email: true,
      phone_number: true,
    },
  });

  if (analysis.direction === "upgrade") {
    return await executeUpgrade(shop_id, targetPlan, user);
  }

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
  const now = new Date();

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: targetPlan.plan_id,
      status: SubscriptionStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      billing_cycle: "yearly",
      start_date: now,
      end_date: now,
      renewal_date: now,
      branch_limit_snapshot: targetPlan.max_branches,
      user_limit_snapshot: targetPlan.max_users,
    },
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: Number(targetPlan.price) * 100,
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
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: { owner_user_id: true },
  });

  if (users_to_disable.includes(shop.owner_user_id)) {
    const err = new Error("Cannot disable shop owner");
    err.code = "CANNOT_DISABLE_OWNER";
    throw err;
  }

  const activeBranches = analysis.usage.activeBranches;
  const remainingBranches = activeBranches - branches_to_deactivate.length;

  if (remainingBranches < 1) {
    const err = new Error("Must keep at least one active branch");
    err.code = "MUST_KEEP_ONE_BRANCH";
    throw err;
  }

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

  if (user_reassignments.length > 0) {
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

  const reassignedUserIds = new Set(user_reassignments.map((r) => r.userId));
  const finalUsersToDisable = users_to_disable.filter(
    (id) => !reassignedUserIds.has(id)
  );

  const finalActiveUsers =
    analysis.usage.activeUsers - finalUsersToDisable.length;
  const finalActiveBranches = activeBranches - branches_to_deactivate.length;

  const userLimit =
    targetPlan.max_users === -1 ? Infinity : targetPlan.max_users;
  const branchLimit =
    targetPlan.max_branches === -1 ? Infinity : targetPlan.max_branches;

  if (finalActiveUsers > userLimit) {
    const err = new Error(
      `Still ${finalActiveUsers - userLimit} users over the limit. Please disable more users.`
    );
    err.code = "NOT_COMPLIANT";
    err.details = { type: "users", excess: finalActiveUsers - userLimit };
    throw err;
  }

  if (finalActiveBranches > branchLimit) {
    const err = new Error(
      `Still ${finalActiveBranches - branchLimit} branches over the limit. Please deactivate more branches.`
    );
    err.code = "NOT_COMPLIANT";
    err.details = {
      type: "branches",
      excess: finalActiveBranches - branchLimit,
    };
    throw err;
  }

  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const result = await prisma.$transaction(async (tx) => {
    if (finalUsersToDisable.length > 0) {
      await tx.user.updateMany({
        where: { user_id: { in: finalUsersToDisable } },
        data: {
          is_active: false,
          status: "inactive",
        },
      });

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

    if (user_reassignments.length > 0) {
      for (const reassignment of user_reassignments) {
        await tx.user.update({
          where: { user_id: reassignment.userId },
          data: { branch_id: reassignment.toBranchId },
        });
      }
    }

    if (branches_to_deactivate.length > 0) {
      await tx.branch.updateMany({
        where: { branch_id: { in: branches_to_deactivate } },
        data: { is_active: false },
      });
    }

    const oldSubscription = await tx.shop.findUnique({
      where: { shop_id },
      select: { current_subscription_id: true },
    });

    if (oldSubscription?.current_subscription_id) {
      await tx.shopSubscription.update({
        where: { subscription_id: oldSubscription.current_subscription_id },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      });
    }

    const newSubscription = await tx.shopSubscription.create({
      data: {
        shop_id,
        plan_id: targetPlan.plan_id,
        status: SubscriptionStatus.ACTIVE,
        payment_status: PaymentStatus.PAID,
        billing_cycle: "yearly",
        start_date: now,
        end_date: endDate,
        renewal_date: endDate,
        activated_at: now,
        branch_limit_snapshot: targetPlan.max_branches,
        user_limit_snapshot: targetPlan.max_users,
      },
    });

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
// HELPER: FORMAT PLAN
// ============================================
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