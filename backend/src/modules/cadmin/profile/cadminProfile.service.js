import prisma from "../../../config/prisma.js";

/**
 * Format role for display
 */
function formatRole(role) {
  const map = {
    SUPER_ADMIN: "Super cAdmin",
    ANALYST: "Analyst",
    ACCOUNTING: "Accounting",
  };
  return map[role] || role;
}

/**
 * Get current admin's profile with pending notification counts
 */
export async function getMyProfileService(cadminId) {
  const cadmin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: cadminId },
    select: {
      cadmin_id: true,
      name: true,
      username: true,
      email: true,
      phone_number: true,
      role: true,
      is_active: true,
      last_login_at: true,
      created_at: true,
    },
  });

  if (!cadmin) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }

  // Get pending counts
  const pendingCounts = await getPendingCountsService();

  return {
    profile: {
      id: cadmin.cadmin_id,
      name: cadmin.name,
      username: cadmin.username,
      email: cadmin.email,
      phone: cadmin.phone_number,
      role: formatRole(cadmin.role),
      rawRole: cadmin.role,
      lastLogin: cadmin.last_login_at,
      createdAt: cadmin.created_at,
    },
    pendingCounts,
  };
}

/**
 * Get counts of items needing attention (computed notifications)
 */
export async function getPendingCountsService() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel
  const [
    pendingDocuments,
    rejectedDocuments,
    expiringSubscriptions,
    pendingShops,
  ] = await Promise.all([
    // Documents waiting for verification
    prisma.shopFile.count({
      where: {
        status: "uploaded",
      },
    }),

    // Rejected documents (awaiting resubmission)
    prisma.shopFile.count({
      where: {
        status: "rejected",
      },
    }),

    // Subscriptions expiring in next 7 days
    prisma.shopSubscription.count({
      where: {
        is_active: true,
        end_date: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
    }),

    // Shops pending verification
    prisma.shop.count({
      where: {
        verification_status: "pending",
      },
    }),
  ]);

  const totalPending = pendingDocuments + expiringSubscriptions + pendingShops;

  return {
    total: totalPending,
    documents: {
      pending: pendingDocuments,
      rejected: rejectedDocuments,
    },
    subscriptions: {
      expiringSoon: expiringSubscriptions,
    },
    shops: {
      pendingVerification: pendingShops,
    },
  };
}