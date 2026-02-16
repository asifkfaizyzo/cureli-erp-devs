// backend/src/modules/cadmin/broadcast/email/emailBroadcast.recipients.js

import prisma from '../../../../config/prisma.js';
import { filterUnsubscribedRecipients } from './emailBroadcast.unsubscribe.js';

/**
 * Email Broadcast Recipient Resolver
 * 
 * Features:
 * - Shop owner targeting (super_admin only)
 * - CAdmin targeting
 * - AND/OR filter mode support
 * - Registration date filtering
 * - Unsubscribe exclusion
 * - Deduplication by email
 */

// ============================================
// MAIN RESOLVER
// ============================================

/**
 * Resolve all recipients based on filters
 * 
 * @param {Object} filters - Target filters
 * @param {Array} filters.shop_ids - Specific shop UUIDs
 * @param {Array} filters.plan_ids - Plan UUIDs
 * @param {string} filters.filter_mode - 'AND' or 'OR' (default: 'OR')
 * @param {string} filters.registration_date_from - ISO date string
 * @param {string} filters.registration_date_to - ISO date string
 * @param {Array} filters.cadmin_roles - CAdmin roles ['SUPER_ADMIN', 'ANALYST', 'ACCOUNTING']
 * @param {boolean} targetUsers - Include shop owners
 * @param {boolean} targetCAdmins - Include CAdmins
 * @param {boolean} excludeUnsubscribed - Filter out unsubscribed (default: true)
 * @returns {Array} - Array of recipient objects
 */
export async function resolveRecipients(
  filters = {},
  targetUsers = true,
  targetCAdmins = false,
  excludeUnsubscribed = true
) {
  const recipients = [];

  // ─────────────────────────────────────────
  // RESOLVE SHOP OWNERS
  // ─────────────────────────────────────────
  if (targetUsers) {
    const shopOwners = await resolveShopOwners(filters);
    recipients.push(...shopOwners);
    console.log(`[Recipients] Resolved ${shopOwners.length} shop owner(s)`);
  }

  // ─────────────────────────────────────────
  // RESOLVE CADMINS
  // ─────────────────────────────────────────
  if (targetCAdmins) {
    const cadmins = await resolveCAdmins(filters);
    recipients.push(...cadmins);
    console.log(`[Recipients] Resolved ${cadmins.length} CAdmin(s)`);
  }

  // ─────────────────────────────────────────
  // DEDUPLICATE BY EMAIL
  // ─────────────────────────────────────────
  const seen = new Set();
  const deduplicated = recipients.filter((r) => {
    const key = r.email.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Recipients] After dedup: ${deduplicated.length} unique recipient(s)`);

  // ─────────────────────────────────────────
  // EXCLUDE UNSUBSCRIBED
  // ─────────────────────────────────────────
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

/**
 * Resolve shop owners (users with role = super_admin)
 */
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

  // ─────────────────────────────────────────
  // BUILD SHOP QUERY BASED ON FILTER MODE
  // ─────────────────────────────────────────

  if (hasShopFilter && hasPlanFilter) {
    if (filter_mode === 'AND') {
      // AND: Shops that match BOTH shop_ids AND plan_ids
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
      // OR: Shops that match shop_ids OR shops with plan_ids
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

      // Merge and dedupe by shop_id
      const shopMap = new Map();
      [...shopsByIds, ...shopsByPlan].forEach((shop) => {
        shopMap.set(shop.shop_id, shop);
      });
      shops = Array.from(shopMap.values());
    }
  } else if (hasShopFilter) {
    // Only shop_ids filter
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
    // Only plan_ids filter
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
    // No shop/plan filter - get all active shops
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

  // ─────────────────────────────────────────
  // APPLY REGISTRATION DATE FILTER (on shop.created_at)
  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  // MAP TO RECIPIENTS
  // ─────────────────────────────────────────
  const recipients = [];

  for (const shop of shops) {
    // Skip if no owner
    if (!shop.owner) continue;

    // Skip if owner is not active
    if (!shop.owner.is_active) continue;

    // Skip if owner has no email
    if (!shop.owner.email) continue;

    // Only super_admin role (shop owners)
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

/**
 * Resolve CAdmins
 */
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

/**
 * Get recipient preview with breakdown
 * Does NOT exclude unsubscribed (for accurate preview)
 */
export async function previewRecipients(
  filters = {},
  targetUsers = true,
  targetCAdmins = false
) {
  const recipients = await resolveRecipients(
    filters,
    targetUsers,
    targetCAdmins,
    false // Don't exclude unsubscribed for preview count
  );

  // Count unsubscribed separately
  const unsubscribedCount = await countUnsubscribedInList(recipients);

  // Build breakdown
  const byType = {
    users: recipients.filter((r) => r.type === 'user').length,
    cadmins: recipients.filter((r) => r.type === 'cadmin').length,
  };

  // Group by shop
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

/**
 * Count how many recipients in list are unsubscribed
 */
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
}

/**
 * Get active plans for filter dropdown
 */
export async function getActivePlans() {
  const plans = await prisma.plan.findMany({
    where: { status: 'ACTIVE' },
    select: {
      plan_id: true,
      name: true,
      type: true,
    },
    orderBy: { name: 'asc' },
  });

  return { plans };
}

/**
 * Get CAdmin roles for filter dropdown
 */
export function getCAdminRoles() {
  return [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ANALYST', label: 'Analyst' },
    { value: 'ACCOUNTING', label: 'Accounting' },
  ];
}

export default {
  resolveRecipients,
  previewRecipients,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
};