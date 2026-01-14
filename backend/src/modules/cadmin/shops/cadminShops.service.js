// src/modules/cadmin/shops/cadminShops.service.js

import prisma from "../../../config/prisma.js";
import fs from "fs";
import path from "path";

// Import the correct updateShopVerificationStatus from cadminDocs
import { createVerificationLog } from "../cadminDocs/cadminDocs.service.js";

/**
 * Helper: Update shop verification status based on document statuses
 */
async function updateShopVerificationStatus(shop_id) {
  const allFiles = await prisma.shopFile.findMany({
    where: { shop_id },
  });

  const filesVerified = allFiles.filter((f) => f.status === "verified").length;
  const filesRejected = allFiles.filter((f) => f.status === "rejected").length;
  const filesTotal = allFiles.length;

  let newStatus = "pending_review";

  if (filesTotal === 0) {
    newStatus = "pending";
  } else if (filesVerified === filesTotal) {
    newStatus = "verified";
  } else if (filesRejected === filesTotal) {
    newStatus = "rejected";
  } else if (filesRejected > 0) {
    newStatus = "partially_rejected";
  } else {
    newStatus = "pending_review";
  }

  await prisma.shop.update({
    where: { shop_id },
    data: {
      verification_status: newStatus,
      updated_at: new Date(),
    },
  });

  return newStatus;
}

/**
 * Helper: Check if promo_free_until is currently active
 */
function isPromoActive(promoFreeUntil) {
  if (!promoFreeUntil) return false;
  return new Date(promoFreeUntil) > new Date();
}

/**
 * Helper: Calculate total duration in months
 */
function getTotalDurationMonths(billingCycleMonths, bonusMonths) {
  return (billingCycleMonths || 12) + (bonusMonths || 0);
}

/**
 * Update shop subscription (create new subscription with new plan)
 * Now supports bonus_months for extended duration
 */
export async function updateShopSubscription(shop_id, plan_id, cadmin_id) {
  // Check if shop exists
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: true,
    },
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Check if plan exists and is ACTIVE
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
  });

  if (!plan) {
    const err = new Error("Plan not found");
    err.code = "PLAN_NOT_FOUND";
    throw err;
  }

  if (plan.status !== "ACTIVE") {
    const err = new Error("Plan is not active");
    err.code = "PLAN_NOT_ACTIVE";
    throw err;
  }

  // Calculate dates with bonus_months support
  const startDate = new Date();
  const totalMonths = getTotalDurationMonths(plan.billing_cycle_months, plan.bonus_months);
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + totalMonths);

  // If promo_free_until is active, adjust end_date
  // The subscription starts free, then continues from promo_free_until + duration
  let effectiveStartDate = startDate;
  if (isPromoActive(plan.promo_free_until)) {
    // End date = promo_free_until + total duration
    effectiveStartDate = new Date(plan.promo_free_until);
    endDate.setTime(effectiveStartDate.getTime());
    endDate.setMonth(endDate.getMonth() + totalMonths);
  }

  const renewalDate = new Date(endDate);
  renewalDate.setDate(renewalDate.getDate() - 30); // 30 days before end

  // Use transaction to update subscription
  const result = await prisma.$transaction(async (tx) => {
    // Deactivate current subscription if exists
    if (shop.current_subscription_id) {
      await tx.shopSubscription.update({
        where: { subscription_id: shop.current_subscription_id },
        data: {
          is_active: false,
          status: "cancelled",
          updated_at: new Date(),
        },
      });
    }

    // Create new subscription
    const newSubscription = await tx.shopSubscription.create({
      data: {
        shop_id,
        plan_id,
        status: "active",
        billing_cycle: "yearly",
        payment_status: isPromoActive(plan.promo_free_until) ? "free_promo" : "paid",
        start_date: startDate,
        end_date: endDate,
        renewal_date: renewalDate,
        branch_limit_snapshot: plan.max_branches,
        user_limit_snapshot: plan.max_users,
        is_active: true,
      },
    });

    // Update shop with new current subscription
    await tx.shop.update({
      where: { shop_id },
      data: {
        current_subscription_id: newSubscription.subscription_id,
        updated_at: new Date(),
      },
    });

    return newSubscription;
  });

  // Fetch updated subscription with plan details (including promo fields)
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: result.subscription_id },
    include: {
      plan: {
        select: {
          plan_id: true,
          name: true,
          type: true,
          price: true,
          compare_at_price: true,
          max_branches: true,
          max_users: true,
          billing_cycle_months: true,
          bonus_months: true,
          promo_free_until: true,
          is_featured: true,
        },
      },
    },
  });

  return {
    subscription_id: subscription.subscription_id,
    shop_id: subscription.shop_id,
    plan: {
      ...subscription.plan,
      price: Number(subscription.plan.price),
      compare_at_price: subscription.plan.compare_at_price 
        ? Number(subscription.plan.compare_at_price) 
        : null,
      is_promo_active: isPromoActive(subscription.plan.promo_free_until),
      total_duration_months: getTotalDurationMonths(
        subscription.plan.billing_cycle_months,
        subscription.plan.bonus_months
      ),
    },
    status: subscription.status,
    billing_cycle: subscription.billing_cycle,
    payment_status: subscription.payment_status,
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    renewal_date: subscription.renewal_date,
    branch_limit_snapshot: subscription.branch_limit_snapshot,
    user_limit_snapshot: subscription.user_limit_snapshot,
    is_active: subscription.is_active,
  };
}

/**
 * Upload document on behalf of shop (replace existing or add new)
 */
export async function uploadShopDocument({
  shop_id,
  file_type,
  file,
  uploaded_by,
}) {
  // Check if shop exists
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      owner: {
        select: { user_id: true },
      },
    },
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Check if document of this type already exists
  const existingDoc = await prisma.shopFile.findFirst({
    where: {
      shop_id,
      file_type,
    },
  });

  const storageKey = file.filename;
  const originalName = file.originalname;
  const mimeType = file.mimetype;
  const fileSize = file.size;

  let shopFile;

  if (existingDoc) {
    // Delete old file from disk
    if (existingDoc.storage_key) {
      const oldFilePath = path.join(
        "uploads/shop_files",
        existingDoc.storage_key
      );
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update existing record
    shopFile = await prisma.shopFile.update({
      where: { file_id: existingDoc.file_id },
      data: {
        original_name: originalName,
        storage_key: storageKey,
        mime_type: mimeType,
        file_size: fileSize,
        status: "uploaded",
        verification_notes: null,
        resubmission_count: existingDoc.resubmission_count + 1,
        last_resubmitted_at: new Date(),
        uploaded_at: new Date(),
        verified_at: null,
        rejected_at: null,
      },
    });

    await createVerificationLog({
      file_id: shopFile.file_id,
      shop_id,
      cadmin_id: uploaded_by,
      actor_type: "admin",
      action: "replaced_by_admin",
      reason: `Document replaced by admin`,
    });
  } else {
    shopFile = await prisma.shopFile.create({
      data: {
        shop_id,
        uploaded_by: shop.owner.user_id,
        file_type,
        original_name: originalName,
        storage_key: storageKey,
        mime_type: mimeType,
        file_size: fileSize,
        status: "uploaded",
        resubmission_count: 0,
      },
    });

    await createVerificationLog({
      file_id: shopFile.file_id,
      shop_id,
      cadmin_id: uploaded_by,
      actor_type: "admin",
      action: "uploaded_by_admin",
      reason: `Document uploaded by admin`,
    });
  }

  // Update shop verification status
  await updateShopVerificationStatus(shop_id);

  return {
    file_id: shopFile.file_id,
    file_type: shopFile.file_type,
    original_name: shopFile.original_name,
    storage_key: shopFile.storage_key,
    mime_type: shopFile.mime_type,
    file_size: shopFile.file_size,
    status: shopFile.status,
    uploaded_at: shopFile.uploaded_at,
  };
}

/**
 * ✅ UPDATED: List shops with filters, sorting, pagination, and UUID search support
 */
export async function listShops({
  page = 1,
  limit = 10,
  search,
  verification_status,
  subscription_status,
  is_active,
  city,
  state,
  date_start,
  date_end,
  sort_by = "created_at",
  sort_order = "desc",
}) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where = {};

  // ✅ UPDATED: Search filter with UUID support
  if (search && search.trim()) {
    const searchTerm = search.trim();
    
    // Check if search term is a UUID (shop_id)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
    
    if (isUUID) {
      // ✅ Exact match by shop_id
      where.shop_id = searchTerm;
    } else {
      // ✅ Text search across multiple fields
      where.OR = [
        { business_name: { contains: searchTerm, mode: "insensitive" } },
        { legal_name: { contains: searchTerm, mode: "insensitive" } },
        { gst_number: { contains: searchTerm, mode: "insensitive" } },
        { city: { contains: searchTerm, mode: "insensitive" } },
        {
          owner: {
            OR: [
              { full_name: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
              { username: { contains: searchTerm, mode: "insensitive" } },
              { phone_number: { contains: searchTerm } },
            ],
          },
        },
      ];
    }
  }

  // Verification status filter
  if (verification_status) {
    where.verification_status = verification_status;
  }

  // Active status filter
  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  // City filter
  if (city && city.trim()) {
    where.city = { contains: city.trim(), mode: "insensitive" };
  }

  // State filter
  if (state && state.trim()) {
    where.state = { contains: state.trim(), mode: "insensitive" };
  }

  // Date range filter
  if (date_start || date_end) {
    where.created_at = {};
    if (date_start) {
      where.created_at.gte = new Date(date_start);
    }
    if (date_end) {
      const endDate = new Date(date_end);
      endDate.setHours(23, 59, 59, 999);
      where.created_at.lte = endDate;
    }
  }

  // Subscription status filter
  if (subscription_status) {
    if (subscription_status === "active") {
      where.AND = [
        ...(where.AND || []),
        { current_subscription_id: { not: null } },
        {
          currentSubscription: {
            status: { in: ["active", "trial"] },
            is_active: true,
            end_date: { gte: new Date() },
          },
        },
      ];
    } else if (subscription_status === "expired") {
      where.AND = [
        ...(where.AND || []),
        { current_subscription_id: { not: null } },
        {
          OR: [
            { currentSubscription: { status: "expired" } },
            { currentSubscription: { status: { in: ["expired", "cancelled"] } } },
            { currentSubscription: { end_date: { lt: new Date() } } },
            { currentSubscription: { is_active: false } },
          ],
        },
      ];
    } else if (subscription_status === "none") {
      where.current_subscription_id = null;
    }
  }

  // Build orderBy
  let orderBy = [];

  if (is_active === undefined) {
    orderBy.push({ is_active: "desc" });
  }

  if (sort_by === "owner") {
    orderBy.push({ owner: { full_name: sort_order } });
  } else if (sort_by === "subscription") {
    orderBy.push({ currentSubscription: { plan: { name: sort_order } } });
  } else {
    orderBy.push({ [sort_by]: sort_order });
  }

  // Execute queries
  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        shop_id: true,
        business_name: true,
        legal_name: true,
        gst_number: true,
        business_type: true,
        city: true,
        state: true,
        pincode: true,
        verification_status: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        owner: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
            phone_number: true,
            is_active: true,
          },
        },
        currentSubscription: {
          select: {
            subscription_id: true,
            status: true,
            is_active: true,
            start_date: true,
            end_date: true,
            plan: {
              select: {
                plan_id: true,
                name: true,
                type: true,
                bonus_months: true,
                promo_free_until: true,
                is_featured: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            branches: true,
            shopFiles: true,
          },
        },
      },
    }),
    prisma.shop.count({ where }),
  ]);

  // Format response with promo info
  const formattedShops = shops.map((shop) => ({
    shop_id: shop.shop_id,
    business_name: shop.business_name,
    legal_name: shop.legal_name,
    gst_number: shop.gst_number,
    business_type: shop.business_type,
    location: `${shop.city}, ${shop.state}`,
    city: shop.city,
    state: shop.state,
    pincode: shop.pincode,
    verification_status: shop.verification_status,
    is_active: shop.is_active,
    created_at: shop.created_at,
    updated_at: shop.updated_at,
    owner: shop.owner
      ? {
          user_id: shop.owner.user_id,
          name: shop.owner.full_name,
          full_name: shop.owner.full_name,
          email: shop.owner.email,
          username: shop.owner.username,
          phone_number: shop.owner.phone_number,
          is_active: shop.owner.is_active,
        }
      : null,
    subscription: shop.currentSubscription
      ? {
          subscription_id: shop.currentSubscription.subscription_id,
          name: shop.currentSubscription.plan?.name || "Unknown",
          type: shop.currentSubscription.plan?.type || "PRE_MADE",
          status: shop.currentSubscription.status,
          is_active: shop.currentSubscription.is_active,
          end_date: shop.currentSubscription.end_date,
          // Promo info
          bonus_months: shop.currentSubscription.plan?.bonus_months || 0,
          is_promo_active: isPromoActive(shop.currentSubscription.plan?.promo_free_until),
          is_featured: shop.currentSubscription.plan?.is_featured || false,
        }
      : null,
    counts: {
      users: shop._count.users,
      branches: shop._count.branches,
      documents: shop._count.shopFiles,
    },
  }));

  return {
    data: formattedShops,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ... rest of your existing functions (getShopById, updateShop, toggleShopActive, getShopStats) remain the same ...

/**
 * Get single shop with full details
 */
export async function getShopById(shop_id) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      owner: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          full_name: true,
          email: true,
          username: true,
          phone_number: true,
          role: true,
          status: true,
          is_active: true,
          login_provider: true,
          last_login_at: true,
          created_at: true,
        },
      },
      branches: {
        select: {
          branch_id: true,
          branch_name: true,
          branch_type: true,
          city: true,
          state: true,
          pincode: true,
          contact_number: true,
          is_active: true,
          created_at: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: [{ branch_type: "asc" }, { created_at: "asc" }],
      },
      users: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          username: true,
          role: true,
          status: true,
          is_active: true,
          branch_id: true,
          last_login_at: true,
          created_at: true,
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
            },
          },
        },
        orderBy: { created_at: "asc" },
      },
      shopFiles: {
        select: {
          file_id: true,
          file_type: true,
          original_name: true,
          mime_type: true,
          file_size: true,
          storage_key: true,
          status: true,
          verification_notes: true,
          resubmission_count: true,
          uploaded_at: true,
          verified_at: true,
          rejected_at: true,
          last_resubmitted_at: true,
          user: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
        },
        orderBy: { uploaded_at: "desc" },
      },
      subscriptions: {
        select: {
          subscription_id: true,
          status: true,
          billing_cycle: true,
          payment_status: true,
          start_date: true,
          end_date: true,
          renewal_date: true,
          branch_limit_snapshot: true,
          user_limit_snapshot: true,
          is_active: true,
          created_at: true,
          plan: {
            select: {
              plan_id: true,
              name: true,
              type: true,
              price: true,
              compare_at_price: true,
              max_branches: true,
              max_users: true,
              billing_cycle_months: true,
              bonus_months: true,
              promo_free_until: true,
              is_featured: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      },
      currentSubscription: {
        select: {
          subscription_id: true,
          status: true,
          billing_cycle: true,
          payment_status: true,
          start_date: true,
          end_date: true,
          renewal_date: true,
          branch_limit_snapshot: true,
          user_limit_snapshot: true,
          is_active: true,
          plan: {
            select: {
              plan_id: true,
              name: true,
              type: true,
              price: true,
              compare_at_price: true,
              max_branches: true,
              max_users: true,
              billing_cycle_months: true,
              bonus_months: true,
              promo_free_until: true,
              is_featured: true,
            },
          },
        },
      },
      paymentTransactions: {
        select: {
          transaction_id: true,
          provider: true,
          provider_order_id: true,
          provider_payment_id: true,
          amount: true,
          currency: true,
          status: true,
          created_at: true,
          subscription: {
            select: {
              subscription_id: true,
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 20,
      },
      _count: {
        select: {
          users: true,
          branches: true,
          shopFiles: true,
          subscriptions: true,
          paymentTransactions: true,
        },
      },
    },
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Get verification logs
  const verificationLogs = await prisma.fileVerificationLog.findMany({
    where: { shop_id },
    select: {
      id: true,
      file_id: true,
      shop_id: true,
      cadmin_id: true,
      actor_type: true,
      action: true,
      reason: true,
      meta: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  // Format plan prices and add computed fields
  const formatPlan = (plan) => {
    if (!plan) return null;
    return {
      ...plan,
      price: Number(plan.price),
      compare_at_price: plan.compare_at_price ? Number(plan.compare_at_price) : null,
      is_promo_active: isPromoActive(plan.promo_free_until),
      total_duration_months: getTotalDurationMonths(plan.billing_cycle_months, plan.bonus_months),
    };
  };

  return {
    ...shop,
    currentSubscription: shop.currentSubscription
      ? {
          ...shop.currentSubscription,
          plan: formatPlan(shop.currentSubscription.plan),
        }
      : null,
    subscriptions: shop.subscriptions.map((sub) => ({
      ...sub,
      plan: formatPlan(sub.plan),
    })),
    verificationLogs,
  };
}

/**
 * Update shop details
 */
export async function updateShop(shop_id, updates, cadmin_id) {
  const existingShop = await prisma.shop.findUnique({
    where: { shop_id },
  });

  if (!existingShop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (updates.gst_number && updates.gst_number !== existingShop.gst_number) {
    const duplicateGst = await prisma.shop.findFirst({
      where: {
        gst_number: updates.gst_number,
        NOT: { shop_id },
      },
    });

    if (duplicateGst) {
      const err = new Error("GST number already exists");
      err.code = "DUPLICATE_GST";
      throw err;
    }
  }

  const updatedShop = await prisma.shop.update({
    where: { shop_id },
    data: {
      ...updates,
      updated_at: new Date(),
    },
    select: {
      shop_id: true,
      business_name: true,
      legal_name: true,
      gst_number: true,
      business_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      verification_status: true,
      verification_notes: true,
      is_active: true,
      updated_at: true,
    },
  });

  return updatedShop;
}

/**
 * Toggle shop active status
 */
export async function toggleShopActive(shop_id, is_active, cadmin_id) {
  const existingShop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      owner: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
  });

  if (!existingShop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const updatedShop = await prisma.shop.update({
    where: { shop_id },
    data: {
      is_active,
      updated_at: new Date(),
    },
    select: {
      shop_id: true,
      business_name: true,
      is_active: true,
      updated_at: true,
    },
  });

  return updatedShop;
}

/**
 * Get shop statistics
 */
export async function getShopStats() {
  const [
    total,
    verified,
    pendingReview,
    pending,
    rejected,
    partiallyRejected,
    activeShops,
    inactiveShops,
    withSubscription,
    withActivePromo,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { verification_status: "verified" } }),
    prisma.shop.count({ where: { verification_status: "pending_review" } }),
    prisma.shop.count({ where: { verification_status: "pending" } }),
    prisma.shop.count({ where: { verification_status: "rejected" } }),
    prisma.shop.count({ where: { verification_status: "partially_rejected" } }),
    prisma.shop.count({ where: { is_active: true } }),
    prisma.shop.count({ where: { is_active: false } }),
    prisma.shop.count({
      where: {
        currentSubscription: {
          isNot: null,
          is_active: true,
        },
      },
    }),
    // Count shops with active promo subscriptions
    prisma.shop.count({
      where: {
        currentSubscription: {
          isNot: null,
          is_active: true,
          plan: {
            promo_free_until: { gt: new Date() },
          },
        },
      },
    }),
  ]);

  return {
    total,
    verified,
    pendingReview,
    pending,
    rejected,
    partiallyRejected,
    activeShops,
    inactiveShops,
    withSubscription,
    withActivePromo,
  };
}