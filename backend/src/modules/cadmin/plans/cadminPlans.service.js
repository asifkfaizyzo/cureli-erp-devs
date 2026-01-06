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

async function getSubscriberCount(plan_id) {
  const count = await prisma.shopSubscription.count({
    where: {
      plan_id,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED] },
      // Include expired within grace period
      end_date: {
        gte: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      },
    },
  });
  return count;
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
 * Includes shop info for CUSTOM plans
 */
function formatPlan(plan, subscriberCount = 0) {
  return {
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    type: plan.type,
    price: Number(plan.price),
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    status: plan.status,
    is_highlighted: plan.is_highlighted,
    subscriber_count: subscriberCount,
    // Custom plan shop info
    created_for_shop_id: plan.created_for_shop_id,
    created_for_shop: plan.createdForShop
      ? {
          shop_id: plan.createdForShop.shop_id,
          business_name: plan.createdForShop.business_name,
        }
      : null,
    created_by: plan.created_by,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
    activated_at: plan.activated_at,
    suspended_at: plan.suspended_at,
    deleted_at: plan.deleted_at,
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
  type,  // NEW: type filter
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

  // NEW: Filter by type
  if (type) {
    where.type = type;
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
// GET PLAN STATS (unchanged - excludes custom from counts)
// ============================================

export async function getPlanStats() {
  // Only count PRE_MADE plans in stats
  const baseWhere = { deleted_at: null, type: PLAN_TYPE.PRE_MADE };
  
  const [total, draft, active, deprecated, suspended] = await Promise.all([
    prisma.plan.count({ where: baseWhere }),
    prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.DRAFT } }),
    prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.ACTIVE } }),
    prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.DEPRECATED } }),
    prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.SUSPENDED } }),
  ]);

  return {
    total,
    draft,
    active,
    deprecated,
    suspended,
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
    max_users, 
    max_branches, 
    is_highlighted,
    type = PLAN_TYPE.PRE_MADE,
    created_for_shop_id = null,
  } = data;

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
      price: BigInt(price),
      max_users,
      max_branches,
      is_highlighted: is_highlighted || false,
      type,
      created_for_shop_id: type === PLAN_TYPE.CUSTOM ? created_for_shop_id : null,
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

  const changes = {};
  // Note: type and created_for_shop_id are NOT allowed to be updated
  const allowedFields = ["name", "description", "price", "max_users", "max_branches", "is_highlighted"];
  const updateData = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      const oldValue = field === "price" ? Number(existingPlan[field]) : existingPlan[field];
      const newValue = field === "price" ? updates[field] : updates[field];

      if (oldValue !== newValue) {
        changes[field] = { old: oldValue, new: newValue };
        updateData[field] = field === "price" ? BigInt(newValue) : newValue;
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return formatPlan(existingPlan, 0);
  }

  if (updateData.name) updateData.name = updateData.name.trim();
  if (updateData.description) updateData.description = updateData.description.trim();

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
  const clonedPlan = await prisma.plan.create({
    data: {
      name: cloneName,
      description: originalPlan.description,
      price: originalPlan.price,
      max_users: originalPlan.max_users,
      max_branches: originalPlan.max_branches,
      is_highlighted: false,
      type: PLAN_TYPE.PRE_MADE, // Clones are always PRE_MADE
      created_for_shop_id: null,
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