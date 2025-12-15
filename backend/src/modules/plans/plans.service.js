// src/modules/plans/plans.service.js
import prisma from "../../config/prisma.js";

/**
 * Map Prisma Plan record to JSON-safe object.
 * Prisma returns BigInt for BigInt fields - JSON.stringify can't serialize BigInt.
 * Convert to string so clients can parse/format currency as needed.
 */
function mapPlanRecord(plan) {
  return {
    plan_id: plan.plan_id,
    name: plan.name,
    max_branches: plan.max_branches,
    max_users: plan.max_users,
    price: plan.price !== null ? plan.price.toString() : null,
    is_customizable: plan.is_customizable,
    is_visible: plan.is_visible,
    features_json: plan.features_json || null,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

/**
 * Return visible plans for shop sign-up page.
 * Optional: accept query params for sort or cycle in future.
 */
export async function getVisiblePlans() {
  const plans = await prisma.plan.findMany({
    where: { is_visible: true },
    orderBy: [{ price: "asc" }, { name: "asc" }],
  });

  return plans.map(mapPlanRecord);
}

/**
 * Get a single plan by id (used later by select-plan endpoint)
 */
export async function getPlanById(plan_id) {
  const plan = await prisma.plan.findUnique({ where: { plan_id } });
  if (!plan) return null;
  return mapPlanRecord(plan);
}
