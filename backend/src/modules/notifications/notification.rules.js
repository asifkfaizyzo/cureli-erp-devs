// ============================================
// AUDIENCE RESOLUTION RULES
// ============================================

import prisma from '../../config/prisma.js';

/**
 * Resolves recipients based on event type and context
 * Returns array of { email, name, user_id?, cadmin_id?, type: 'user' | 'cadmin' }
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

async function resolveDirectUser(context) {
  // Context must contain user info directly
  if (context.email) {
    return [{
      email: context.email,
      name: context.name || context.full_name || 'User',
      user_id: context.user_id || null,
      type: 'user',
    }];
  }

  // Or fetch by user_id
  if (context.user_id) {
    const user = await prisma.user.findUnique({
      where: { user_id: context.user_id },
      select: { user_id: true, email: true, full_name: true },
    });

    if (user?.email) {
      return [{
        email: user.email,
        name: user.full_name || 'User',
        user_id: user.user_id,
        type: 'user',
      }];
    }
  }

  return [];
}

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
      select: { cadmin_id: true, email: true, name: true },
    });

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
        select: { user_id: true, email: true, full_name: true },
      },
    },
  });

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

  // Fetch from ticket
  if (ticket_id) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
      include: {
        created_by: {
          select: { user_id: true, email: true, full_name: true },
        },
      },
    });

    if (ticket?.created_by?.email) {
      return [{
        email: ticket.created_by.email,
        name: ticket.created_by.full_name || 'Customer',
        user_id: ticket.created_by.user_id,
        type: 'user',
      }];
    }
  }

  return [];
}

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

    // Subscription status filter (requires join)
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
        select: { user_id: true, email: true, full_name: true, role: true },
      });
    } else {
      users = await prisma.user.findMany({
        where: userWhere,
        select: { user_id: true, email: true, full_name: true, role: true },
      });
    }

    for (const user of users) {
      if (user.email) {
        recipients.push({
          email: user.email,
          name: user.full_name || 'User',
          user_id: user.user_id,
          type: 'user',
        });
      }
    }
  }

  // ─────────────────────────────────────────
  // RESOLVE CADMINS
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