// ============================================
// CADMIN PLANS SERVICE
// ============================================
// Contains all business logic for plan management
// Handles state transitions, validations, and database operations

import prisma from "../../../config/prisma.js";

// ============================================
// CONSTANTS
// ============================================

const PLAN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  DEPRECATED: "DEPRECATED",
  SUSPENDED: "SUSPENDED",
};

// Status priority for sorting (lower = higher priority)
const STATUS_PRIORITY = {
  ACTIVE: 1,
  DRAFT: 2,
  DEPRECATED: 3,
  SUSPENDED: 4,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Creates a standardized error with code
 */
function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * Get subscriber count for a plan
 * Counts active subscriptions that haven't expired
 */
async function getSubscriberCount(plan_id) {
  const count = await prisma.shopSubscription.count({
    where: {
      plan_id,
      is_active: true,
      end_date: { gte: new Date() },
    },
  });
  return count;
}

/**
 * Check if plan name is available among ACTIVE plans
 * @param {string} name - Plan name to check
 * @param {string} excludeId - Plan ID to exclude (for updates/reactivation)
 */
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

/**
 * Generate a unique clone name
 * Appends (Copy), (Copy 2), etc. until unique
 */
async function generateCloneName(originalName) {
  // Remove existing (Copy X) suffix if present
  const baseName = originalName.replace(/\s*\(Copy(?:\s*\d+)?\)\s*$/, "").trim();
  
  // Get all existing plan names that start with this base
  const existingPlans = await prisma.plan.findMany({
    where: {
      name: { startsWith: baseName },
      deleted_at: null,
    },
    select: { name: true },
  });

  const existingNames = new Set(existingPlans.map((p) => p.name.toLowerCase()));

  // Try "Name (Copy)" first
  let cloneName = `${baseName} (Copy)`;
  let counter = 1;

  while (existingNames.has(cloneName.toLowerCase())) {
    counter++;
    cloneName = `${baseName} (Copy ${counter})`;
  }

  return cloneName;
}

/**
 * Create activity log entry for a plan
 */
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



// ============================================
// LIST PLANS
// ============================================

/**
 * List plans with filters, search, and pagination
 * Default sort: by status priority, then by created_at desc
 */
export async function listPlans({
  page = 1,
  limit = 20,
  search,
  status,
  sort_by = "created_at",
  sort_order = "desc",
  include_deleted = false,
}) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where = {};

  // Exclude soft-deleted unless specifically requested
  if (!include_deleted) {
    where.deleted_at = null;
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Search by name or description
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Build orderBy
  // Custom sort: status priority first, then specified field
  let orderBy = [];

  // Always sort by status priority first (ACTIVE > DRAFT > DEPRECATED > SUSPENDED)
  // Prisma doesn't support custom enum ordering, so we handle this in post-processing
  // For now, use created_at as secondary sort
  if (sort_by === "status") {
    // Will handle in post-processing
    orderBy.push({ created_at: sort_order });
  } else {
    orderBy.push({ [sort_by]: sort_order });
  }

  // Fetch plans
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
      },
    }),
    prisma.plan.count({ where }),
  ]);

  // Get subscriber counts for active/deprecated plans
  const plansWithCounts = await Promise.all(
    plans.map(async (plan) => {
      let subscriberCount = 0;
      if (plan.status === PLAN_STATUS.ACTIVE || plan.status === PLAN_STATUS.DEPRECATED) {
        subscriberCount = await getSubscriberCount(plan.plan_id);
      }
      return formatPlan(plan, subscriberCount);
    })
  );

  // Post-process: sort by status priority if requested
  if (sort_by === "status") {
    plansWithCounts.sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] || 99;
      const priorityB = STATUS_PRIORITY[b.status] || 99;
      
      if (priorityA !== priorityB) {
        return sort_order === "asc" ? priorityA - priorityB : priorityB - priorityA;
      }
      
      // Secondary sort by created_at
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

/**
 * Get count of plans by status
 */
export async function getPlanStats() {
  const [total, draft, active, deprecated, suspended] = await Promise.all([
    prisma.plan.count({ where: { deleted_at: null } }),
    prisma.plan.count({ where: { status: PLAN_STATUS.DRAFT, deleted_at: null } }),
    prisma.plan.count({ where: { status: PLAN_STATUS.ACTIVE, deleted_at: null } }),
    prisma.plan.count({ where: { status: PLAN_STATUS.DEPRECATED, deleted_at: null } }),
    prisma.plan.count({ where: { status: PLAN_STATUS.SUSPENDED, deleted_at: null } }),
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

/**
 * Get plan by ID with subscriber count
 */
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



// ============================================
// UPDATE PLAN
// ============================================

/**
 * Update plan details (DRAFT plans only)
 */
export async function updatePlan(plan_id, updates, cadmin_id) {
  // Fetch current plan
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

  // Track changes for audit log
  const changes = {};
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
    // No actual changes
    return formatPlan(existingPlan, 0);
  }

  // Trim strings
  if (updateData.name) updateData.name = updateData.name.trim();
  if (updateData.description) updateData.description = updateData.description.trim();

  // Update plan
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
    },
  });

  // Log activity
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

/**
 * Transition: DRAFT -> ACTIVE
 * Makes plan live and immutable
 */
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

  // Check name uniqueness among ACTIVE plans
  const nameAvailable = await isNameAvailable(plan.name, plan_id);
  if (!nameAvailable) {
    throw createError(
      `An active plan named "${plan.name}" already exists. Please rename before activating.`,
      "NAME_CONFLICT"
    );
  }

  // Activate plan
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
    },
  });

  // Log activity
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

/**
 * Transition: ACTIVE -> DEPRECATED (if has subscribers) or SUSPENDED (if none)
 */
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

  // Check for active subscribers
  const subscriberCount = await getSubscriberCount(plan_id);

  // Determine new status based on subscribers
  const newStatus = subscriberCount > 0 ? PLAN_STATUS.DEPRECATED : PLAN_STATUS.SUSPENDED;

  // Update plan
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
    },
  });

  // Log activity
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

/**
 * Transition: SUSPENDED -> ACTIVE
 * Only allowed if no active subscribers and name is available
 */
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

  // Double-check no active subscribers
  const subscriberCount = await getSubscriberCount(plan_id);
  if (subscriberCount > 0) {
    throw createError(
      "Cannot reactivate plan with active subscribers",
      "HAS_SUBSCRIBERS"
    );
  }

  // Check name uniqueness
  const nameAvailable = await isNameAvailable(plan.name, plan_id);
  if (!nameAvailable) {
    throw createError(
      `An active plan named "${plan.name}" already exists. Clone this plan with a different name instead.`,
      "NAME_CONFLICT"
    );
  }

  // Reactivate plan
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
    },
  });

  // Log activity
  await logPlanActivity({
    plan_id,
    cadmin_id,
    action: "reactivated",
    from_status: PLAN_STATUS.SUSPENDED,
    to_status: PLAN_STATUS.ACTIVE,
  });

  return formatPlan(reactivatedPlan, 0);
}

// cadminPlans.service.js

// ============================================
// CREATE PLAN (cleaned up)
// ============================================

export async function createPlan(data, cadmin_id) {
  const { name, description, price, max_users, max_branches, is_highlighted } = data;

  const plan = await prisma.plan.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      price: BigInt(price),
      max_users,
      max_branches,
      is_highlighted: is_highlighted || false,
      status: PLAN_STATUS.DRAFT,
      created_by: cadmin_id,
      // No more duplicate fields needed!
    },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
        },
      },
    },
  });

  await logPlanActivity({
    plan_id: plan.plan_id,
    cadmin_id,
    action: "created",
    to_status: PLAN_STATUS.DRAFT,
    meta: { name: plan.name },
  });

  return formatPlan(plan, 0);
}

// ============================================
// CLONE PLAN (cleaned up)
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

  const clonedPlan = await prisma.plan.create({
    data: {
      name: cloneName,
      description: originalPlan.description,
      price: originalPlan.price,
      max_users: originalPlan.max_users,
      max_branches: originalPlan.max_branches,
      is_highlighted: false,
      status: PLAN_STATUS.DRAFT,
      created_by: cadmin_id,
      // Clean! No duplicate fields
    },
    include: {
      creator: {
        select: {
          cadmin_id: true,
          username: true,
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
// FORMAT PLAN (unchanged - already uses 'name' and 'price')
// ============================================

function formatPlan(plan, subscriberCount = 0) {
  return {
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price),
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    status: plan.status,
    is_highlighted: plan.is_highlighted,
    subscriber_count: subscriberCount,
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
// SOFT DELETE PLAN
// ============================================

/**
 * Soft delete a plan (DRAFT plans only)
 */
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

  // Soft delete
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
    },
  });

  // Log activity
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

/**
 * Transition DEPRECATED plans to SUSPENDED when all subscriptions end
 * Called by cron job daily
 */
export async function transitionDeprecatedPlans() {
  // Find all DEPRECATED plans
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
      // Transition to SUSPENDED
      await prisma.plan.update({
        where: { plan_id: plan.plan_id },
        data: {
          status: PLAN_STATUS.SUSPENDED,
        },
      });

      // Log activity (system action)
      await prisma.planActivityLog.create({
        data: {
          plan_id: plan.plan_id,
          cadmin_id: plan.created_by, // Use original creator as fallback
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