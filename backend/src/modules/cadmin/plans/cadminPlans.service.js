// ============================================
// CADMIN PLANS SERVICE
// ============================================

import prisma from "../../../config/prisma.js";
import { SubscriptionStatus } from "../../../config/subscription.js";

// ============================================
// CONSTANTS
// ============================================

const PLAN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  DEPRECATED: "DEPRECATED",
  SUSPENDED: "SUSPENDED",
};

const PLAN_TYPE = {
  PRE_MADE: "PRE_MADE",
  CUSTOM: "CUSTOM",
};

const STATUS_PRIORITY = {
  ACTIVE: 1,
  DRAFT: 2,
  DEPRECATED: 3,
  SUSPENDED: 4,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * Check if promo_free_until is currently active
 */
function isPromoActive(promoFreeUntil) {
  if (!promoFreeUntil) return false;
  return new Date(promoFreeUntil) > new Date();
}

/**
 * Get total subscription duration in months
 */
function getTotalDurationMonths(billingCycleMonths, bonusMonths) {
  return (billingCycleMonths || 12) + (bonusMonths || 0);
}

async function getSubscriberCount(plan_id) {
  return prisma.shopSubscription.count({
    where: {
      plan_id,
      is_active: true,
      OR: [
        { end_date: { gte: new Date() } },
        { grace_period_until: { gte: new Date() } },
      ],
    },
  });
}


async function isNameAvailable(name, excludeId = null) {
  const existing = await prisma.plan.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      status: PLAN_STATUS.ACTIVE,
      deleted_at: null,
      ...(excludeId && { plan_id: { not: excludeId } }),
    },
  });
  return !existing;
}

async function generateCloneName(originalName) {
  const baseName = originalName.replace(/\s*\(Copy(?:\s*\d+)?\)\s*$/, "").trim();
  
  const existingPlans = await prisma.plan.findMany({
    where: {
      name: { startsWith: baseName },
      deleted_at: null,
    },
    select: { name: true },
  });

  const existingNames = new Set(existingPlans.map((p) => p.name.toLowerCase()));

  let cloneName = `${baseName} (Copy)`;
  let counter = 1;

  while (existingNames.has(cloneName.toLowerCase())) {
    counter++;
    cloneName = `${baseName} (Copy ${counter})`;
  }

  return cloneName;
}

async function logPlanActivity({
  plan_id,
  cadmin_id,
  action,
  from_status = null,
  to_status = null,
  changes = null,
  meta = null,
}) {
  await prisma.planActivityLog.create({
    data: {
      plan_id,
      cadmin_id,
      action,
      from_status,
      to_status,
      changes,
      meta,
    },
  });
}

/**
 * Format plan for API response
 * Includes all new promo fields and computed values
 */
function formatPlan(plan, subscriberCount = 0) {
  const promoActive = isPromoActive(plan.promo_free_until);
  const totalDuration = getTotalDurationMonths(plan.billing_cycle_months, plan.bonus_months);
  
  return {
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    type: plan.type,
    
    // Pricing
    price: Number(plan.price),
    compare_at_price: plan.compare_at_price ? Number(plan.compare_at_price) : null,
    
    // Limits
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    
    // Billing duration
    billing_cycle_months: plan.billing_cycle_months,
    bonus_months: plan.bonus_months,
    total_duration_months: totalDuration,
    
    // Promotional access
    promo_free_until: plan.promo_free_until,
    is_promo_active: promoActive,
    
    // Flags
    is_featured: plan.is_featured,
    is_customizable: plan.is_customizable,
    
    // Status & counts
    status: plan.status,
    subscriber_count: subscriberCount,
    
    // Custom plan shop info
    created_for_shop_id: plan.created_for_shop_id,
    created_for_shop: plan.createdForShop
      ? {
          shop_id: plan.createdForShop.shop_id,
          business_name: plan.createdForShop.business_name,
        }
      : null,
    
    // Metadata
    created_by: plan.created_by,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
    activated_at: plan.activated_at,
    suspended_at: plan.suspended_at,
    deleted_at: plan.deleted_at,
    
    // Creator info
    creator: plan.creator
      ? {
          cadmin_id: plan.creator.cadmin_id,
          username: plan.creator.username,
        }
      : null,
  };
}

// ============================================
// LIST PLANS
// ============================================

export async function listPlans({
  page = 1,
  limit = 20,
  search,
  status,
  type,
  has_active_promo = false,
  sort_by = "created_at",
  sort_order = "desc",
  include_deleted = false,
}) {
  const skip = (page - 1) * limit;

  const where = {};

  if (!include_deleted) {
    where.deleted_at = null;
  }

  if (status) {
    where.status = status;
  }

  // Filter by type
  if (type) {
    where.type = type;
  }

  // Filter by active promo
  if (has_active_promo) {
    where.promo_free_until = {
      gt: new Date(),
    };
  }

  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  let orderBy = [];

  if (sort_by === "status") {
    orderBy.push({ created_at: sort_order });
  } else {
    orderBy.push({ [sort_by]: sort_order });
  }

  const [plans, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        creator: {
          select: {
            cadmin_id: true,
            username: true,
          },
        },
        // Include shop info for custom plans
        createdForShop: {
          select: {
            shop_id: true,
            business_name: true,
          },
        },
      },
    }),
    prisma.plan.count({ where }),
  ]);

  const plansWithCounts = await Promise.all(
    plans.map(async (plan) => {
      let subscriberCount = 0;
      if (plan.status === PLAN_STATUS.ACTIVE || plan.status === PLAN_STATUS.DEPRECATED) {
        subscriberCount = await getSubscriberCount(plan.plan_id);
      }
      return formatPlan(plan, subscriberCount);
    })
  );

  if (sort_by === "status") {
    plansWithCounts.sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] || 99;
      const priorityB = STATUS_PRIORITY[b.status] || 99;
      
      if (priorityA !== priorityB) {
        return sort_order === "asc" ? priorityA - priorityB : priorityB - priorityA;
      }
      
      return sort_order === "asc"
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at);
    });
  }

  return {
    plans: plansWithCounts,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// GET PLAN STATS
// ============================================

export async function getPlanStats() {
  // Only count PRE_MADE plans in stats
  const baseWhere = { deleted_at: null, type: PLAN_TYPE.PRE_MADE };
  
  const [total, draft, active, deprecated, suspended, withActivePromo] = await Promise.all([
    prisma.plan.count({ where: baseWhere }),
    prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.DRAFT } }),
    prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.ACTIVE } }),
    prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.DEPRECATED } }),
    prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.SUSPENDED } }),
    prisma.plan.count({ 
      where: { 
        ...baseWhere, 
        promo_free_until: { gt: new Date() } 
      } 
    }),
  ]);

  return {
    total,
    draft,
    active,
    deprecated,
    suspended,
    with_active_promo: withActivePromo,
  };
}

// ============================================
// GET SINGLE PLAN
// ============================================

export async function getPlanById(plan_id) {
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
      createdForShop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  if (!plan) {
    throw createError("Plan not found", "NOT_FOUND");
  }

  const subscriberCount = await getSubscriberCount(plan_id);

  return formatPlan(plan, subscriberCount);
}

// ============================================
// CREATE PLAN
// ============================================

export async function createPlan(data, cadmin_id) {
  const { 
    name, 
    description, 
    price, 
    compare_at_price,
    max_users, 
    max_branches,
    billing_cycle_months = 12,
    bonus_months = 0,
    promo_free_until,
    is_featured,
    type = PLAN_TYPE.PRE_MADE,
    created_for_shop_id = null,
  } = data;

  // Validate compare_at_price > price
  if (compare_at_price !== null && compare_at_price !== undefined) {
    if (compare_at_price <= price) {
      throw createError(
        "Compare-at price must be greater than the actual price",
        "VALIDATION_ERROR"
      );
    }
  }

  // Validate promo_free_until is in the future
  if (promo_free_until) {
    const promoDate = new Date(promo_free_until);
    if (promoDate <= new Date()) {
      throw createError(
        "Promo free until date must be in the future",
        "VALIDATION_ERROR"
      );
    }
  }

  // Validate shop exists if custom plan
  if (type === PLAN_TYPE.CUSTOM && created_for_shop_id) {
    const shop = await prisma.shop.findUnique({
      where: { shop_id: created_for_shop_id },
    });
    
    if (!shop) {
      throw createError("Shop not found", "SHOP_NOT_FOUND");
    }
  }

  const plan = await prisma.plan.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      type,
      
      // Pricing
      price: BigInt(price),
      compare_at_price: compare_at_price ? BigInt(compare_at_price) : null,
      
      // Limits
      max_users,
      max_branches,
      
      // Billing duration
      billing_cycle_months,
      bonus_months,
      
      // Promotional access
      promo_free_until: promo_free_until ? new Date(promo_free_until) : null,
      
      // Flags
      is_featured: is_featured || false,
      
      // Custom plan link
      created_for_shop_id: type === PLAN_TYPE.CUSTOM ? created_for_shop_id : null,
      
      // Lifecycle
      status: PLAN_STATUS.DRAFT,
      created_by: cadmin_id,
    },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
      createdForShop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  await logPlanActivity({
    plan_id: plan.plan_id,
    cadmin_id,
    action: "created",
    to_status: PLAN_STATUS.DRAFT,
    meta: { 
      name: plan.name,
      type: plan.type,
      shop_id: plan.created_for_shop_id,
      has_promo: !!promo_free_until,
      has_compare_price: !!compare_at_price,
      bonus_months: bonus_months,
    },
  });

  return formatPlan(plan, 0);
}

// ============================================
// UPDATE PLAN
// ============================================

export async function updatePlan(plan_id, updates, cadmin_id) {
  const existingPlan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!existingPlan) {
    throw createError("Plan not found", "NOT_FOUND");
  }

  if (existingPlan.deleted_at) {
    throw createError("Cannot update a deleted plan", "DELETED");
  }

  if (existingPlan.status !== PLAN_STATUS.DRAFT) {
    throw createError(
      "Only draft plans can be edited. Clone this plan to make changes.",
      "NOT_DRAFT"
    );
  }

  // Validate compare_at_price > price
  const newPrice = updates.price !== undefined ? updates.price : Number(existingPlan.price);
  const newCompareAtPrice = updates.compare_at_price !== undefined 
    ? updates.compare_at_price 
    : (existingPlan.compare_at_price ? Number(existingPlan.compare_at_price) : null);

  if (newCompareAtPrice !== null && newCompareAtPrice <= newPrice) {
    throw createError(
      "Compare-at price must be greater than the actual price",
      "VALIDATION_ERROR"
    );
  }

  // Validate promo_free_until is in the future (only if being set to a new value)
  if (updates.promo_free_until !== undefined && updates.promo_free_until !== null) {
    const promoDate = new Date(updates.promo_free_until);
    if (promoDate <= new Date()) {
      throw createError(
        "Promo free until date must be in the future",
        "VALIDATION_ERROR"
      );
    }
  }

  const changes = {};
  const allowedFields = [
    "name", 
    "description", 
    "price", 
    "compare_at_price",
    "max_users", 
    "max_branches",
    "billing_cycle_months",
    "bonus_months",
    "promo_free_until",
    "is_featured",
  ];
  const updateData = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      let oldValue;
      let newValue;

      if (field === "price" || field === "compare_at_price") {
        oldValue = existingPlan[field] ? Number(existingPlan[field]) : null;
        newValue = updates[field];
      } else if (field === "promo_free_until") {
        oldValue = existingPlan[field] ? existingPlan[field].toISOString() : null;
        newValue = updates[field] ? new Date(updates[field]).toISOString() : null;
      } else {
        oldValue = existingPlan[field];
        newValue = updates[field];
      }

      // Check if value actually changed
      const hasChanged = oldValue !== newValue && 
        !(oldValue === null && newValue === null);

      if (hasChanged) {
        changes[field] = { old: oldValue, new: newValue };
        
        if (field === "price") {
          updateData[field] = BigInt(newValue);
        } else if (field === "compare_at_price") {
          updateData[field] = newValue ? BigInt(newValue) : null;
        } else if (field === "promo_free_until") {
          updateData[field] = newValue ? new Date(newValue) : null;
        } else if (field === "name" || field === "description") {
          updateData[field] = typeof newValue === "string" ? newValue.trim() : newValue;
        } else {
          updateData[field] = newValue;
        }
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return formatPlan(existingPlan, 0);
  }

  const updatedPlan = await prisma.plan.update({
    where: { plan_id },
    data: updateData,
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
      createdForShop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  await logPlanActivity({
    plan_id,
    cadmin_id,
    action: "updated",
    changes,
  });

  return formatPlan(updatedPlan, 0);
}

// ============================================
// ACTIVATE PLAN
// ============================================

export async function activatePlan(plan_id, cadmin_id) {
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!plan) {
    throw createError("Plan not found", "NOT_FOUND");
  }

  if (plan.deleted_at) {
    throw createError("Cannot activate a deleted plan", "DELETED");
  }

  if (plan.status !== PLAN_STATUS.DRAFT) {
    throw createError("Only draft plans can be activated", "NOT_DRAFT");
  }

  const nameAvailable = await isNameAvailable(plan.name, plan_id);
  if (!nameAvailable) {
    throw createError(
      `An active plan named "${plan.name}" already exists. Please rename before activating.`,
      "NAME_CONFLICT"
    );
  }

  const activatedPlan = await prisma.plan.update({
    where: { plan_id },
    data: {
      status: PLAN_STATUS.ACTIVE,
      activated_at: new Date(),
    },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
      createdForShop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  await logPlanActivity({
    plan_id,
    cadmin_id,
    action: "activated",
    from_status: PLAN_STATUS.DRAFT,
    to_status: PLAN_STATUS.ACTIVE,
    meta: {
      has_promo: isPromoActive(activatedPlan.promo_free_until),
      bonus_months: activatedPlan.bonus_months,
    },
  });

  return formatPlan(activatedPlan, 0);
}

// ============================================
// SUSPEND PLAN
// ============================================

export async function suspendPlan(plan_id, cadmin_id) {
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!plan) {
    throw createError("Plan not found", "NOT_FOUND");
  }

  if (plan.status !== PLAN_STATUS.ACTIVE) {
    throw createError("Only active plans can be suspended", "NOT_ACTIVE");
  }

  const subscriberCount = await getSubscriberCount(plan_id);

  const newStatus = subscriberCount > 0 ? PLAN_STATUS.DEPRECATED : PLAN_STATUS.SUSPENDED;

  const updatedPlan = await prisma.plan.update({
    where: { plan_id },
    data: {
      status: newStatus,
      suspended_at: new Date(),
    },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
      createdForShop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  await logPlanActivity({
    plan_id,
    cadmin_id,
    action: "suspended",
    from_status: PLAN_STATUS.ACTIVE,
    to_status: newStatus,
    meta: { subscriber_count: subscriberCount },
  });

  return {
    ...formatPlan(updatedPlan, subscriberCount),
    subscriber_count: subscriberCount,
  };
}

// ============================================
// REACTIVATE PLAN
// ============================================

export async function reactivatePlan(plan_id, cadmin_id) {
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!plan) {
    throw createError("Plan not found", "NOT_FOUND");
  }

  if (plan.status !== PLAN_STATUS.SUSPENDED) {
    throw createError(
      "Only suspended plans can be reactivated. Deprecated plans must wait until all subscribers finish their term.",
      "NOT_SUSPENDED"
    );
  }

  const subscriberCount = await getSubscriberCount(plan_id);
  if (subscriberCount > 0) {
    throw createError(
      "Cannot reactivate plan with active subscribers",
      "HAS_SUBSCRIBERS"
    );
  }

  const nameAvailable = await isNameAvailable(plan.name, plan_id);
  if (!nameAvailable) {
    throw createError(
      `An active plan named "${plan.name}" already exists. Clone this plan with a different name instead.`,
      "NAME_CONFLICT"
    );
  }

  const reactivatedPlan = await prisma.plan.update({
    where: { plan_id },
    data: {
      status: PLAN_STATUS.ACTIVE,
      activated_at: new Date(),
      suspended_at: null,
    },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
      createdForShop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  await logPlanActivity({
    plan_id,
    cadmin_id,
    action: "reactivated",
    from_status: PLAN_STATUS.SUSPENDED,
    to_status: PLAN_STATUS.ACTIVE,
  });

  return formatPlan(reactivatedPlan, 0);
}

// ============================================
// CLONE PLAN
// ============================================

export async function clonePlan(plan_id, cadmin_id, customName = null) {
  const originalPlan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!originalPlan) {
    throw createError("Plan not found", "NOT_FOUND");
  }

  if (originalPlan.deleted_at) {
    throw createError("Cannot clone a deleted plan", "DELETED");
  }

  const cloneName = customName?.trim() || (await generateCloneName(originalPlan.name));

  // Cloned plan is always PRE_MADE and not linked to any shop
  // Promo fields are copied EXCEPT promo_free_until (reset to null)
  const clonedPlan = await prisma.plan.create({
    data: {
      name: cloneName,
      description: originalPlan.description,
      type: PLAN_TYPE.PRE_MADE, // Clones are always PRE_MADE
      
      // Pricing - copy both
      price: originalPlan.price,
      compare_at_price: originalPlan.compare_at_price,
      
      // Limits
      max_users: originalPlan.max_users,
      max_branches: originalPlan.max_branches,
      
      // Billing duration - copy both
      billing_cycle_months: originalPlan.billing_cycle_months,
      bonus_months: originalPlan.bonus_months,
      
      // Promotional access - reset to null (admin should set new date)
      promo_free_until: null,
      
      // Flags
      is_featured: false, // Don't copy featured status
      
      // Custom plan link - never copy
      created_for_shop_id: null,
      
      // Lifecycle
      status: PLAN_STATUS.DRAFT,
      created_by: cadmin_id,
    },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
      createdForShop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  await logPlanActivity({
    plan_id: clonedPlan.plan_id,
    cadmin_id,
    action: "cloned",
    to_status: PLAN_STATUS.DRAFT,
    meta: {
      cloned_from: originalPlan.plan_id,
      original_name: originalPlan.name,
      copied_fields: ["price", "compare_at_price", "billing_cycle_months", "bonus_months"],
      reset_fields: ["promo_free_until", "is_featured"],
    },
  });

  return formatPlan(clonedPlan, 0);
}

// ============================================
// SOFT DELETE PLAN
// ============================================

export async function softDeletePlan(plan_id, cadmin_id) {
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!plan) {
    throw createError("Plan not found", "NOT_FOUND");
  }

  if (plan.deleted_at) {
    throw createError("Plan is already deleted", "ALREADY_DELETED");
  }

  if (plan.status !== PLAN_STATUS.DRAFT) {
    throw createError(
      "Only draft plans can be deleted. Active, deprecated, and suspended plans must be retained for billing records.",
      "NOT_DRAFT"
    );
  }

  const deletedPlan = await prisma.plan.update({
    where: { plan_id },
    data: {
      deleted_at: new Date(),
    },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
      createdForShop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
  });

  await logPlanActivity({
    plan_id,
    cadmin_id,
    action: "deleted",
    from_status: PLAN_STATUS.DRAFT,
  });

  return formatPlan(deletedPlan, 0);
}

// ============================================
// CRON JOB: TRANSITION DEPRECATED PLANS
// ============================================

export async function transitionDeprecatedPlans() {
  const deprecatedPlans = await prisma.plan.findMany({
    where: {
      status: PLAN_STATUS.DEPRECATED,
      deleted_at: null,
    },
  });

  const transitioned = [];

  for (const plan of deprecatedPlans) {
    const subscriberCount = await getSubscriberCount(plan.plan_id);

    if (subscriberCount === 0) {
      await prisma.plan.update({
        where: { plan_id: plan.plan_id },
        data: {
          status: PLAN_STATUS.SUSPENDED,
        },
      });

      await prisma.planActivityLog.create({
        data: {
          plan_id: plan.plan_id,
          cadmin_id: plan.created_by,
          action: "auto_suspended",
          from_status: PLAN_STATUS.DEPRECATED,
          to_status: PLAN_STATUS.SUSPENDED,
          meta: {
            reason: "All subscriptions ended",
            triggered_by: "cron_job",
          },
        },
      });

      transitioned.push({
        plan_id: plan.plan_id,
        name: plan.name,
      });

      console.log(`[CRON] Plan "${plan.name}" transitioned from DEPRECATED to SUSPENDED`);
    }
  }

  return {
    checked: deprecatedPlans.length,
    transitioned: transitioned.length,
    plans: transitioned,
  };
}