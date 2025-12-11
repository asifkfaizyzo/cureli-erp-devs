// src/modules/cadmin/plans/cadminPlans.service.js

import prisma from "../../../config/prisma.js";

/**
 * List all plans
 */
export async function listPlans({ includeHidden = false } = {}) {
  const where = {};

  if (!includeHidden) {
    where.is_visible = true;
  }

  const plans = await prisma.plan.findMany({
    where,
    orderBy: [
      { is_customizable: "asc" }, // Standard plans first
      { max_users: "asc" },
    ],
    select: {
      plan_id: true,
      plan_name: true,
      max_branches: true,
      max_users: true,
      price_monthly: true,
      price_yearly: true,
      is_customizable: true,
      is_visible: true,
      features_json: true,
      created_at: true,
      updated_at: true,
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  // Format BigInt to string for JSON serialization
  return plans.map((plan) => ({
    ...plan,
    price_monthly: plan.price_monthly?.toString() || "0",
    price_yearly: plan.price_yearly?.toString() || null,
    subscription_count: plan._count.subscriptions,
  }));
}

/**
 * Get single plan by ID
 */
export async function getPlanById(plan_id) {
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!plan) {
    const err = new Error("Plan not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  return {
    ...plan,
    price_monthly: plan.price_monthly?.toString() || "0",
    price_yearly: plan.price_yearly?.toString() || null,
    subscription_count: plan._count.subscriptions,
  };
}

/**
 * Create a custom plan
 */
export async function createCustomPlan({
  max_users,
  max_branches,
  plan_name,
  created_by,
}) {
  // Auto-generate plan name if not provided
  const finalPlanName = plan_name || `Custom - ${max_users}U/${max_branches}B`;

  // Check for duplicate name
  const existing = await prisma.plan.findUnique({
    where: { plan_name: finalPlanName },
  });

  if (existing) {
    // If exact same limits, return existing plan
    if (existing.max_users === max_users && existing.max_branches === max_branches) {
      return {
        ...existing,
        price_monthly: existing.price_monthly?.toString() || "0",
        price_yearly: existing.price_yearly?.toString() || null,
      };
    }

    // Generate unique name with timestamp
    const uniqueName = `${finalPlanName} (${Date.now().toString(36)})`;
    
    const plan = await prisma.plan.create({
      data: {
        plan_name: uniqueName,
        max_users,
        max_branches,
        price_monthly: BigInt(0), // Free for custom plans
        price_yearly: BigInt(0),
        is_customizable: true,
        is_visible: false, // Custom plans are hidden from public list
      },
    });

    return {
      ...plan,
      price_monthly: plan.price_monthly?.toString() || "0",
      price_yearly: plan.price_yearly?.toString() || null,
    };
  }

  // Create new plan
  const plan = await prisma.plan.create({
    data: {
      plan_name: finalPlanName,
      max_users,
      max_branches,
      price_monthly: BigInt(0), // Free for custom plans
      price_yearly: BigInt(0),
      is_customizable: true,
      is_visible: false, // Custom plans are hidden from public list
    },
  });

  return {
    ...plan,
    price_monthly: plan.price_monthly?.toString() || "0",
    price_yearly: plan.price_yearly?.toString() || null,
  };
}

/**
 * Update a plan
 */
export async function updatePlan(plan_id, updates, cadmin_id) {
  // Check if plan exists
  const existing = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!existing) {
    const err = new Error("Plan not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // If updating name, check for duplicates
  if (updates.plan_name && updates.plan_name !== existing.plan_name) {
    const duplicate = await prisma.plan.findUnique({
      where: { plan_name: updates.plan_name },
    });

    if (duplicate) {
      const err = new Error("Plan name already exists");
      err.code = "DUPLICATE_NAME";
      throw err;
    }
  }

  // Convert price fields to BigInt if provided
  const data = { ...updates };
  if (data.price_monthly !== undefined) {
    data.price_monthly = BigInt(data.price_monthly);
  }
  if (data.price_yearly !== undefined) {
    data.price_yearly = data.price_yearly ? BigInt(data.price_yearly) : null;
  }

  const plan = await prisma.plan.update({
    where: { plan_id },
    data: {
      ...data,
      updated_at: new Date(),
    },
  });

  return {
    ...plan,
    price_monthly: plan.price_monthly?.toString() || "0",
    price_yearly: plan.price_yearly?.toString() || null,
  };
}

/**
 * Toggle plan visibility
 */
export async function togglePlanVisibility(plan_id, is_visible, cadmin_id) {
  // Check if plan exists
  const existing = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!existing) {
    const err = new Error("Plan not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const plan = await prisma.plan.update({
    where: { plan_id },
    data: {
      is_visible,
      updated_at: new Date(),
    },
  });

  return {
    ...plan,
    price_monthly: plan.price_monthly?.toString() || "0",
    price_yearly: plan.price_yearly?.toString() || null,
  };
}