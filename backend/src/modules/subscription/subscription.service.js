import prisma from "../../config/prisma.js";

export async function getVisiblePlans() {
  return prisma.plan.findMany({
    where: { is_visible: true },
    orderBy: { price: "asc" },
  });
}

export async function createSubscription({ shop_id, plan_id, billing_cycle }) {
  // Fetch plan
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!plan) {
    const err = new Error("Plan not found");
    err.code = "PLAN_NOT_FOUND";
    throw err;
  }

  // FREE PLAN → instant activation
  const isFree = Number(plan.price) === 0;

  const now = new Date();
  const end = new Date();
  end.setDate(now.getDate() + 30);

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

  // Set this subscription as current
  await prisma.shop.update({
    where: { shop_id },
    data: { current_subscription_id: subscription.subscription_id },
  });

  return {
    subscription,
    isFree,
  };
}

export async function getSubscriptionStatus(shop_id) {
  return prisma.shopSubscription.findFirst({
    where: { shop_id, is_active: true },
    include: { plan: true },
    orderBy: { created_at: "desc" },
  });
}

export async function getSubscriptionHistory(shop_id) {
  return prisma.shopSubscription.findMany({
    where: { shop_id },
    include: { plan: true },
    orderBy: { created_at: "desc" },
  });
}
