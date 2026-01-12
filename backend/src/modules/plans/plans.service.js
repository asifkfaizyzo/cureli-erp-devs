// src/modules/plans/plans.service.js

import prisma from "../../config/prisma.js";

/**
 * Format plan record for API response
 * All prices are in RUPEES (not paisa)
 */
function formatPlan(plan) {
  const now = new Date();
  
  // Check if promo is currently active
  const isPromoActive = plan.promo_free_until 
    ? new Date(plan.promo_free_until) > now 
    : false;

  // Calculate total duration
  const billingCycleMonths = plan.billing_cycle_months || 12;
  const bonusMonths = plan.bonus_months || 0;
  const totalDurationMonths = billingCycleMonths + bonusMonths;

  return {
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    
    // Pricing (in Rupees)
    price: Number(plan.price),
    compare_at_price: plan.compare_at_price ? Number(plan.compare_at_price) : null,
    
    // Limits
    max_branches: plan.max_branches,
    max_users: plan.max_users,
    
    // Duration
    billing_cycle_months: billingCycleMonths,
    bonus_months: bonusMonths,
    total_duration_months: totalDurationMonths,
    
    // Promotional
    promo_free_until: plan.promo_free_until,
    is_promo_active: isPromoActive,
    
    // Flags
    is_featured: plan.is_featured,
    is_customizable: plan.is_customizable,
    
    // Timestamps
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

/**
 * Return ACTIVE + PRE_MADE plans for customer selection
 * Ordered: By price ascending, then by name
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