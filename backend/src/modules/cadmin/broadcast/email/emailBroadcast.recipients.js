// backend/src/modules/cadmin/broadcast/email/emailBroadcast.recipients.js

import prisma from '../../../../config/prisma.js';
import { filterUnsubscribedRecipients } from './emailBroadcast.unsubscribe.js';

/**
 * Email Broadcast Recipient Resolver
 */

// ============================================
// MAIN RESOLVER
// ============================================

export async function resolveRecipients(
  filters = {},
  targetUsers = true,
  targetCAdmins = false,
  excludeUnsubscribed = true
) {
  const recipients = [];

  if (targetUsers) {
    const shopOwners = await resolveShopOwners(filters);
    recipients.push(...shopOwners);
    console.log(`[Recipients] Resolved ${shopOwners.length} shop owner(s)`);
  }

  if (targetCAdmins) {
    const cadmins = await resolveCAdmins(filters);
    recipients.push(...cadmins);
    console.log(`[Recipients] Resolved ${cadmins.length} CAdmin(s)`);
  }

  // Deduplicate by email
  const seen = new Set();
  const deduplicated = recipients.filter((r) => {
    const key = r.email.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Recipients] After dedup: ${deduplicated.length} unique recipient(s)`);

  if (excludeUnsubscribed) {
    const filtered = await filterUnsubscribedRecipients(deduplicated);
    console.log(`[Recipients] After unsubscribe filter: ${filtered.length} recipient(s)`);
    return filtered;
  }

  return deduplicated;
}

// ============================================
// SHOP OWNER RESOLVER
// ============================================

async function resolveShopOwners(filters) {
  const {
    shop_ids,
    plan_ids,
    filter_mode = 'OR',
    registration_date_from,
    registration_date_to,
  } = filters;

  let shops = [];

  const hasShopFilter = shop_ids && shop_ids.length > 0;
  const hasPlanFilter = plan_ids && plan_ids.length > 0;

  if (hasShopFilter && hasPlanFilter) {
    if (filter_mode === 'AND') {
      shops = await prisma.shop.findMany({
        where: {
          is_active: true,
          shop_id: { in: shop_ids },
          currentSubscription: {
            plan_id: { in: plan_ids },
            status: 'active',
            is_active: true,
          },
        },
        include: {
          owner: {
            select: {
              user_id: true,
              email: true,
              full_name: true,
              role: true,
              is_active: true,
            },
          },
        },
      });
    } else {
      const [shopsByIds, shopsByPlan] = await Promise.all([
        prisma.shop.findMany({
          where: {
            is_active: true,
            shop_id: { in: shop_ids },
          },
          include: {
            owner: {
              select: {
                user_id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
              },
            },
          },
        }),
        prisma.shop.findMany({
          where: {
            is_active: true,
            currentSubscription: {
              plan_id: { in: plan_ids },
              status: 'active',
              is_active: true,
            },
          },
          include: {
            owner: {
              select: {
                user_id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
              },
            },
          },
        }),
      ]);

      const shopMap = new Map();
      [...shopsByIds, ...shopsByPlan].forEach((shop) => {
        shopMap.set(shop.shop_id, shop);
      });
      shops = Array.from(shopMap.values());
    }
  } else if (hasShopFilter) {
    shops = await prisma.shop.findMany({
      where: {
        is_active: true,
        shop_id: { in: shop_ids },
      },
      include: {
        owner: {
          select: {
            user_id: true,
            email: true,
            full_name: true,
            role: true,
            is_active: true,
          },
        },
      },
    });
  } else if (hasPlanFilter) {
    shops = await prisma.shop.findMany({
      where: {
        is_active: true,
        currentSubscription: {
          plan_id: { in: plan_ids },
          status: 'active',
          is_active: true,
        },
      },
      include: {
        owner: {
          select: {
            user_id: true,
            email: true,
            full_name: true,
            role: true,
            is_active: true,
          },
        },
      },
    });
  } else {
    // No filter - get all active shops
    shops = await prisma.shop.findMany({
      where: { is_active: true },
      include: {
        owner: {
          select: {
            user_id: true,
            email: true,
            full_name: true,
            role: true,
            is_active: true,
          },
        },
      },
    });
  }

  // Apply registration date filter
  if (registration_date_from || registration_date_to) {
    shops = shops.filter((shop) => {
      const shopDate = new Date(shop.created_at);

      if (registration_date_from) {
        const fromDate = new Date(registration_date_from);
        if (shopDate < fromDate) return false;
      }

      if (registration_date_to) {
        const toDate = new Date(registration_date_to);
        toDate.setHours(23, 59, 59, 999);
        if (shopDate > toDate) return false;
      }

      return true;
    });
  }

  // Map to recipients
  const recipients = [];

  for (const shop of shops) {
    if (!shop.owner) continue;
    if (!shop.owner.is_active) continue;
    if (!shop.owner.email) continue;
    if (shop.owner.role !== 'super_admin') continue;

    recipients.push({
      email: shop.owner.email,
      name: shop.owner.full_name || shop.business_name || 'Shop Owner',
      user_id: shop.owner.user_id,
      shop_id: shop.shop_id,
      shop_name: shop.business_name,
      type: 'user',
    });
  }

  return recipients;
}

// ============================================
// CADMIN RESOLVER
// ============================================

async function resolveCAdmins(filters) {
  const { cadmin_roles } = filters;

  const where = { is_active: true };

  if (cadmin_roles && cadmin_roles.length > 0) {
    where.role = { in: cadmin_roles };
  }

  const cadmins = await prisma.cAdmin.findMany({
    where,
    select: {
      cadmin_id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return cadmins
    .filter((c) => c.email)
    .map((cadmin) => ({
      email: cadmin.email,
      name: cadmin.name || 'Admin',
      cadmin_id: cadmin.cadmin_id,
      role: cadmin.role,
      type: 'cadmin',
    }));
}

// ============================================
// PREVIEW FUNCTIONS
// ============================================

export async function previewRecipients(
  filters = {},
  targetUsers = true,
  targetCAdmins = false
) {
  const recipients = await resolveRecipients(
    filters,
    targetUsers,
    targetCAdmins,
    false
  );

  const unsubscribedCount = await countUnsubscribedInList(recipients);

  const byType = {
    users: recipients.filter((r) => r.type === 'user').length,
    cadmins: recipients.filter((r) => r.type === 'cadmin').length,
  };

  const byShop = {};
  recipients
    .filter((r) => r.type === 'user' && r.shop_id)
    .forEach((r) => {
      if (!byShop[r.shop_id]) {
        byShop[r.shop_id] = { name: r.shop_name, count: 0 };
      }
      byShop[r.shop_id].count++;
    });

  return {
    total: recipients.length,
    total_after_unsubscribe: recipients.length - unsubscribedCount,
    unsubscribed_count: unsubscribedCount,
    by_type: byType,
    by_shop: byShop,
  };
}

async function countUnsubscribedInList(recipients) {
  if (recipients.length === 0) return 0;

  const emails = recipients.map((r) => r.email.toLowerCase().trim());

  const unsubscribed = await prisma.emailUnsubscribe.count({
    where: {
      email: { in: emails },
    },
  });

  return unsubscribed;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get shops for filter dropdown
 */
export async function getShopsForFilter(search = '', page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const where = {
    is_active: true,
    ...(search && {
      business_name: { contains: search, mode: 'insensitive' },
    }),
  };

  try {
    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        select: {
          shop_id: true,
          business_name: true,
          created_at: true,
          owner: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { business_name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.shop.count({ where }),
    ]);

    console.log(`[Recipients] getShopsForFilter: Found ${shops.length} shops (total: ${total})`);

    return {
      shops: shops.map((shop) => ({
        shop_id: shop.shop_id,
        business_name: shop.business_name,
        owner_name: shop.owner?.full_name || 'N/A',
        owner_email: shop.owner?.email || 'N/A',
        created_at: shop.created_at,
      })),
      pagination: { page, limit, total },
    };
  } catch (error) {
    console.error('[Recipients] getShopsForFilter error:', error);
    throw error;
  }
}

/**
 * Get active plans for filter dropdown
 * ✅ FIXED: Use the enum value from Prisma
 */
export async function getActivePlans() {
  try {
    const plans = await prisma.plan.findMany({
      where: { 
        status: 'ACTIVE',  // ✅ This should match your PlanStatus enum
        deleted_at: null,  // ✅ Exclude soft-deleted plans
      },
      select: {
        plan_id: true,
        name: true,
        type: true,
      },
      orderBy: { name: 'asc' },
    });

    console.log(`[Recipients] getActivePlans: Found ${plans.length} active plans`);

    return { plans };
  } catch (error) {
    console.error('[Recipients] getActivePlans error:', error);
    throw error;
  }
}

/**
 * Get CAdmin roles for filter dropdown
 * ✅ FIXED: Match CAdminRole enum from Prisma schema
 */
export function getCAdminRoles() {
  // These should match your CAdminRole enum
  return [
    { value: 'SUPER_CADMIN', label: 'Super Admin' },
    { value: 'ANALYST', label: 'Analyst' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'SALESMAN', label: 'Salesman' },
  ];
}

export default {
  resolveRecipients,
  previewRecipients,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
};