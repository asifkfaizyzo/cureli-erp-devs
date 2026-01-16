// ============================================
// backend\src\modules\cadmin\profile\cadminProfile.service.js
// ============================================

import prisma from "../../../config/prisma.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format role for display
 */
function formatRole(role) {
  const roleMap = {
    SUPER_ADMIN: "Super cAdmin",
    ANALYST: "Analyst",
    ACCOUNTING: "Accounting",
  };
  return roleMap[role] || role;
}

// ============================================
// GET MY PROFILE
// ============================================

/**
 * Get current admin's profile with pending notification counts
 * 
 * @param {string} cadminId - Current admin's ID
 * @returns {Promise<Object>} Profile data with pending counts
 * @throws {Error} If admin not found
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

  // Get pending counts in parallel
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
      isActive: cadmin.is_active,
      lastLogin: cadmin.last_login_at,
      createdAt: cadmin.created_at,
    },
    pendingCounts,
  };
}

// ============================================
// GET PENDING COUNTS
// ============================================

/**
 * Get counts of items needing attention (computed notifications)
 * Used for dashboard badges and notification UI
 * 
 * @returns {Promise<Object>} Pending counts by category
 */
export async function getPendingCountsService() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel for better performance
  const [
    pendingDocuments,
    rejectedDocuments,
    expiringSubscriptions,
    pendingShops,
    overduePayments,
  ] = await Promise.all([
    // Documents waiting for admin verification
    prisma.shopFile.count({
      where: {
        status: "uploaded",
      },
    }),

    // Rejected documents awaiting owner resubmission
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

    // Shops pending verification (never verified)
    prisma.shop.count({
      where: {
        verification_status: "pending_review",
      },
    }),

    // Payment transactions that failed or are pending
    prisma.paymentTransaction.count({
      where: {
        status: {
          in: ["failed", "pending"],
        },
      },
    }),
  ]);

  // Calculate total actionable items
  const totalPending = pendingDocuments + expiringSubscriptions + pendingShops + overduePayments;

  return {
    total: totalPending,
    
    documents: {
      pending: pendingDocuments,
      rejected: rejectedDocuments,
      total: pendingDocuments + rejectedDocuments,
    },
    
    subscriptions: {
      expiringSoon: expiringSubscriptions,
    },
    
    shops: {
      pendingVerification: pendingShops,
    },
    
    payments: {
      overdue: overduePayments,
    },
  };
}