// ============================================
// AUDIENCE RESOLUTION RULES
// ============================================

import prisma from '../../config/prisma.js';

/**
 * Resolves recipients based on event type and context
 * 
 * For email channel: Returns array of { email, name, user_id?, ... }
 * For inapp channel: Returns array of { user_id, shop_id?, branch_id?, ... }
 */
export async function resolveAudience(eventType, context, audienceFilters = {}) {
  const { EVENT_CONFIG } = await import('./notification.events.js');
  const config = EVENT_CONFIG[eventType];

  if (!config) {
    console.warn(`[Notifications] Unknown event type: ${eventType}`);
    return [];
  }

  switch (config.audienceType) {
    case 'direct_user':
      return resolveDirectUser(context);

    case 'direct_cadmin':
      return resolveDirectCAdmin(context);

    case 'shop_owner':
      return resolveShopOwner(context);

    case 'shop_admins':
      return resolveShopAdmins(context);

    case 'shop_inventory_users':
      return resolveShopInventoryUsers(context);

    case 'ticket_creator':
      return resolveTicketCreator(context);

    case 'broadcast_filter':
      return resolveBroadcastAudience(audienceFilters);

    default:
      console.warn(`[Notifications] Unknown audience type: ${config.audienceType}`);
      return [];
  }
}

// ─────────────────────────────────────────
// RESOLUTION STRATEGIES
// ─────────────────────────────────────────

/**
 * Direct user - context must contain user_id or email
 */
async function resolveDirectUser(context) {
  // If email provided directly (for OTP/password reset emails)
  if (context.email) {
    return [{
      email: context.email,
      name: context.name || context.full_name || 'User',
      user_id: context.user_id || null,
      type: 'user',
    }];
  }

  // Fetch by user_id
  if (context.user_id) {
    const user = await prisma.user.findUnique({
      where: { user_id: context.user_id },
      select: { 
        user_id: true, 
        email: true, 
        full_name: true,
        shop_id: true,
        branch_id: true,
        is_active: true,
      },
    });

    // Don't notify deactivated users
    if (!user || !user.is_active) {
      return [];
    }

    if (user?.email) {
      return [{
        email: user.email,
        name: user.full_name || 'User',
        user_id: user.user_id,
        shop_id: user.shop_id,
        branch_id: user.branch_id,
        type: 'user',
      }];
    }
  }

  return [];
}

/**
 * Direct CAdmin - for admin-specific notifications
 */
async function resolveDirectCAdmin(context) {
  if (context.email) {
    return [{
      email: context.email,
      name: context.name || 'Admin',
      cadmin_id: context.cadmin_id || null,
      type: 'cadmin',
    }];
  }

  if (context.cadmin_id) {
    const admin = await prisma.cAdmin.findUnique({
      where: { cadmin_id: context.cadmin_id },
      select: { cadmin_id: true, email: true, name: true, is_active: true },
    });

    if (!admin || !admin.is_active) {
      return [];
    }

    if (admin?.email) {
      return [{
        email: admin.email,
        name: admin.name || 'Admin',
        cadmin_id: admin.cadmin_id,
        type: 'cadmin',
      }];
    }
  }

  return [];
}

/**
 * Shop owner - single user who owns the shop
 */
async function resolveShopOwner(context) {
  const { shop_id } = context;

  if (!shop_id) {
    console.warn('[Notifications] resolveShopOwner: No shop_id in context');
    return [];
  }

  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      owner: {
        select: { 
          user_id: true, 
          email: true, 
          full_name: true,
          is_active: true,
        },
      },
    },
  });

  if (!shop?.owner?.is_active) {
    return [];
  }

  if (shop?.owner?.email) {
    return [{
      email: shop.owner.email,
      name: shop.owner.full_name || 'Shop Owner',
      user_id: shop.owner.user_id,
      shop_id: shop.shop_id,
      shop_name: shop.business_name,
      type: 'user',
    }];
  }

  return [];
}

/**
 * Shop admins - super_admin and branch_admin roles in shop
 * Used for: USER_DEACTIVATED, USER_REACTIVATED, USER_CREATED
 */
async function resolveShopAdmins(context) {
  const { shop_id, exclude_user_id } = context;

  if (!shop_id) {
    console.warn('[Notifications] resolveShopAdmins: No shop_id in context');
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      shop_id,
      is_active: true,
      role: { in: ['super_admin', 'branch_admin'] },
      ...(exclude_user_id && { user_id: { not: exclude_user_id } }),
    },
    select: {
      user_id: true,
      email: true,
      full_name: true,
      role: true,
      branch_id: true,
    },
  });

  return users
    .filter(u => u.email)
    .map(user => ({
      email: user.email,
      name: user.full_name || 'Admin',
      user_id: user.user_id,
      shop_id,
      branch_id: user.branch_id,
      role: user.role,
      type: 'user',
    }));
}

/**
 * Shop inventory users - all users who should see inventory alerts
 * Includes: staff, branch_admin, super_admin in the shop
 * If branch_id provided, prioritizes branch users but includes shop admins
 */
async function resolveShopInventoryUsers(context) {
  const { shop_id, branch_id } = context;

  if (!shop_id) {
    console.warn('[Notifications] resolveShopInventoryUsers: No shop_id in context');
    return [];
  }

  // Build where clause
  const whereClause = {
    shop_id,
    is_active: true,
    role: { in: ['staff', 'branch_admin', 'super_admin'] },
  };

  // If branch-specific, get branch users + shop-wide admins
  if (branch_id) {
    const users = await prisma.user.findMany({
      where: {
        shop_id,
        is_active: true,
        role: { in: ['staff', 'branch_admin', 'super_admin'] },
        OR: [
          { branch_id: branch_id },           // Users in the specific branch
          { role: 'super_admin' },            // Super admins see all
        ],
      },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        branch_id: true,
      },
    });

    return users
      .filter(u => u.email)
      .map(user => ({
        email: user.email,
        name: user.full_name || 'User',
        user_id: user.user_id,
        shop_id,
        branch_id: user.branch_id,
        role: user.role,
        type: 'user',
      }));
  }

  // Shop-wide: all inventory users
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      user_id: true,
      email: true,
      full_name: true,
      role: true,
      branch_id: true,
    },
  });

  return users
    .filter(u => u.email)
    .map(user => ({
      email: user.email,
      name: user.full_name || 'User',
      user_id: user.user_id,
      shop_id,
      branch_id: user.branch_id,
      role: user.role,
      type: 'user',
    }));
}

/**
 * Ticket creator - the user who created the ticket
 */
async function resolveTicketCreator(context) {
  const { ticket_id, user_id, email, name } = context;

  // If email provided directly
  if (email) {
    return [{
      email,
      name: name || 'Customer',
      user_id: user_id || null,
      type: 'user',
    }];
  }

  // If user_id provided directly
  if (user_id) {
    const user = await prisma.user.findUnique({
      where: { user_id },
      select: { 
        user_id: true, 
        email: true, 
        full_name: true,
        shop_id: true,
        branch_id: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      return [];
    }

    if (user?.email) {
      return [{
        email: user.email,
        name: user.full_name || 'Customer',
        user_id: user.user_id,
        shop_id: user.shop_id,
        branch_id: user.branch_id,
        type: 'user',
      }];
    }
  }

  // Fetch from ticket
  if (ticket_id) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
      include: {
        created_by: {
          select: { 
            user_id: true, 
            email: true, 
            full_name: true,
            shop_id: true,
            branch_id: true,
            is_active: true,
          },
        },
      },
    });

    if (!ticket?.created_by?.is_active) {
      return [];
    }

    if (ticket?.created_by?.email) {
      return [{
        email: ticket.created_by.email,
        name: ticket.created_by.full_name || 'Customer',
        user_id: ticket.created_by.user_id,
        shop_id: ticket.created_by.shop_id,
        branch_id: ticket.created_by.branch_id,
        type: 'user',
      }];
    }
  }

  return [];
}

/**
 * Broadcast audience - for system-wide announcements
 * Filters: roles, shopVerificationStatus, subscriptionStatus
 */
async function resolveBroadcastAudience(filters = {}) {
  const recipients = [];

  // ─────────────────────────────────────────
  // RESOLVE ERP USERS
  // ─────────────────────────────────────────
  if (filters.includeUsers !== false) {
    const userWhere = { is_active: true };

    // Role filter
    if (filters.roles && filters.roles.length > 0) {
      userWhere.role = { in: filters.roles };
    }

    // Shop verification status filter
    if (filters.shopVerificationStatus) {
      userWhere.shops_owned = {
        some: {
          verification_status: filters.shopVerificationStatus,
        },
      };
    }

    // Subscription status filter
    let users;
    if (filters.subscriptionStatus) {
      users = await prisma.user.findMany({
        where: {
          ...userWhere,
          shops_owned: {
            some: {
              currentSubscription: {
                status: filters.subscriptionStatus,
              },
            },
          },
        },
        select: { 
          user_id: true, 
          email: true, 
          full_name: true, 
          role: true,
          shop_id: true,
        },
      });
    } else {
      users = await prisma.user.findMany({
        where: userWhere,
        select: { 
          user_id: true, 
          email: true, 
          full_name: true, 
          role: true,
          shop_id: true,
        },
      });
    }

    for (const user of users) {
      if (user.email) {
        recipients.push({
          email: user.email,
          name: user.full_name || 'User',
          user_id: user.user_id,
          shop_id: user.shop_id,
          type: 'user',
        });
      }
    }
  }

  // ─────────────────────────────────────────
  // RESOLVE CADMINS (Email channel only, not in-app)
  // ─────────────────────────────────────────
  if (filters.includeCAdmins === true) {
    const cadminWhere = { is_active: true };

    if (filters.cadminRoles && filters.cadminRoles.length > 0) {
      cadminWhere.role = { in: filters.cadminRoles };
    }

    const cadmins = await prisma.cAdmin.findMany({
      where: cadminWhere,
      select: { cadmin_id: true, email: true, name: true, role: true },
    });

    for (const admin of cadmins) {
      if (admin.email) {
        recipients.push({
          email: admin.email,
          name: admin.name || 'Admin',
          cadmin_id: admin.cadmin_id,
          type: 'cadmin',
        });
      }
    }
  }

  // Deduplicate by email
  const seen = new Set();
  return recipients.filter((r) => {
    if (seen.has(r.email)) return false;
    seen.add(r.email);
    return true;
  });
}

export default { resolveAudience };