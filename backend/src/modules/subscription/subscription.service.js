import prisma from "../../config/prisma.js";

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
 * Create subscription for a shop
 */
export async function createSubscription({ shop_id, plan_id, billing_cycle = "yearly" }) {
  // Fetch plan - must be ACTIVE
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

  // FREE PLAN → instant activation
  const isFree = Number(plan.price) === 0;

  const now = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1); // 1 year subscription

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id,
      status: isFree ? "active" : "pending",
      payment_status: isFree ? "paid" : "pending",
      billing_cycle,
      start_date: now,
      end_date: isFree ? end : now,
      renewal_date: isFree ? end : now,
      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
    },
  });

  // Set as current subscription
  await prisma.shop.update({
    where: { shop_id },
    data: { current_subscription_id: subscription.subscription_id },
  });

  return { subscription, isFree };
}

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

export async function getSubscriptionHistory(shop_id) {
  if (!shop_id) return [];
  
  return prisma.shopSubscription.findMany({
    where: { shop_id },
    include: { plan: true },
    orderBy: { created_at: "desc" },
  });
}