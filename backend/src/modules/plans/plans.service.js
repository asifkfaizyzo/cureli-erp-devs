// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\plans\plans.service.js

import prisma from "../../config/prisma.js";

/**
 * Format plan record for API response
 * Price stays in paisa - frontend converts to rupees
 */
function formatPlan(plan) {
  return {
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price), // BigInt -> Number (still in paisa)
    max_branches: plan.max_branches,
    max_users: plan.max_users,
    is_highlighted: plan.is_highlighted,
    is_customizable: plan.is_customizable,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

/**
 * Return ACTIVE + PRE_MADE plans for customer selection
 * Ordered: Free plans first (price=0), then by price ascending, then by name
 */
export async function getActivePlans() {
  const plans = await prisma.plan.findMany({
    where: {
      status: "ACTIVE",
      type: "PRE_MADE",
      deleted_at: null,
    },
    orderBy: [
      { price: "asc" },
      { name: "asc" },
    ],
  });

  return plans.map(formatPlan);
}

/**
 * Get a single plan by ID
 * Only returns if ACTIVE + PRE_MADE + not deleted
 */
export async function getPlanById(plan_id) {
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!plan) return null;

  // Only return if it's an active, pre-made, non-deleted plan
  if (plan.status !== "ACTIVE" || plan.type !== "PRE_MADE" || plan.deleted_at) {
    return null;
  }

  return formatPlan(plan);
}