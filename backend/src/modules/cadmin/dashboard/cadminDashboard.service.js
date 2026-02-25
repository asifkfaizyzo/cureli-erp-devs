// backend/src/modules/cadmin/dashboard/cadminDashboard.service.js

import prisma from "../../../config/prisma.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPeriodDates(period) {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "6m":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1y":
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return { startDate, endDate: now };
}

function getPreviousPeriodDates(period) {
  const { startDate, endDate } = getPeriodDates(period);
  const duration = endDate.getTime() - startDate.getTime();
  
  return {
    startDate: new Date(startDate.getTime() - duration),
    endDate: startDate,
  };
}

function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ============================================
// GET DASHBOARD OVERVIEW
// ============================================

export async function getDashboardOverview(period = "30d", role = "SUPER_ADMIN") {
  const { startDate, endDate } = getPeriodDates(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodDates(period);
  
  console.log("[DASHBOARD SVC] Period dates:", { startDate, endDate });
  console.log("[DASHBOARD SVC] Previous period:", { prevStartDate, prevEndDate });
  
  try {
    // ============================================
    // SHOP STATISTICS
    // ============================================
    const [
      totalShops,
      totalShopsPrev,
      activeShops,
      verifiedShops,
      pendingVerification,
      newShopsInPeriod,
      newShopsPrevPeriod,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { created_at: { lt: prevEndDate } } }),
      prisma.shop.count({ where: { is_active: true } }),
      prisma.shop.count({ where: { verification_status: "verified" } }),
      prisma.shop.count({ where: { verification_status: "pending_review" } }),
      prisma.shop.count({ 
        where: { created_at: { gte: startDate, lte: endDate } } 
      }),
      prisma.shop.count({ 
        where: { created_at: { gte: prevStartDate, lte: prevEndDate } } 
      }),
    ]);
    
    console.log("[DASHBOARD SVC] Shop stats:", { 
      totalShops, activeShops, verifiedShops, pendingVerification, newShopsInPeriod 
    });

    // ============================================
    // USER STATISTICS
    // ============================================
    const [
      totalUsers,
      totalUsersPrev,
      activeUsers,
      newUsersInPeriod,
      newUsersPrevPeriod,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { created_at: { lt: prevEndDate } } }),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ 
        where: { created_at: { gte: startDate, lte: endDate } } 
      }),
      prisma.user.count({ 
        where: { created_at: { gte: prevStartDate, lte: prevEndDate } } 
      }),
    ]);
    
    console.log("[DASHBOARD SVC] User stats:", { 
      totalUsers, activeUsers, newUsersInPeriod 
    });

    // ============================================
    // SUBSCRIPTION STATISTICS
    // ============================================
    const now = new Date();
    
    const [
      activeSubscriptions,
      expiringSubscriptions,
      gracePeriodSubscriptions,
      suspendedSubscriptions,
    ] = await Promise.all([
      prisma.shopSubscription.count({ 
        where: { is_active: true, end_date: { gte: now } } 
      }),
      prisma.shopSubscription.count({ 
        where: { 
          is_active: true, 
          end_date: { 
            gte: now, 
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      }),
      prisma.shopSubscription.count({ 
        where: { 
          is_active: true, 
          end_date: { lt: now },
          grace_period_until: { gt: now },
        } 
      }),
      prisma.shopSubscription.count({ 
        where: { is_active: false } 
      }),
    ]);
    
    console.log("[DASHBOARD SVC] Subscription stats:", { 
      activeSubscriptions, expiringSubscriptions, gracePeriodSubscriptions, suspendedSubscriptions 
    });

    // ============================================
    // PLAN STATISTICS
    // ============================================
    const [
      activePlans,
      draftPlans,
    ] = await Promise.all([
      prisma.plan.count({ where: { status: "ACTIVE", deleted_at: null } }),
      prisma.plan.count({ where: { status: "DRAFT", deleted_at: null } }),
    ]);
    
    console.log("[DASHBOARD SVC] Plan stats:", { activePlans, draftPlans });

    // ============================================
    // TICKET & ENQUIRY STATISTICS
    // ============================================
    const [
      pendingTickets,
      inProgressTickets,
      resolvedTicketsInPeriod,
      pendingEnquiries,
      repliedEnquiriesInPeriod,
    ] = await Promise.all([
      prisma.ticket.count({ where: { status: "PENDING" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ 
        where: { 
          status: { in: ["RESOLVED", "CLOSED"] },
          updated_at: { gte: startDate, lte: endDate },
        } 
      }),
      prisma.enquiry.count({ where: { status: "PENDING" } }),
      prisma.enquiry.count({ 
        where: { 
          status: "REPLIED",
          updated_at: { gte: startDate, lte: endDate },
        } 
      }),
    ]);
    
    console.log("[DASHBOARD SVC] Ticket/Enquiry stats:", { 
      pendingTickets, inProgressTickets, pendingEnquiries 
    });

    // ============================================
    // REVENUE STATISTICS (for SUPER_ADMIN and ACCOUNTING)
    // ============================================
    let revenueStats = null;
    
    if (role === "SUPER_ADMIN" || role === "ACCOUNTING") {
      const [currentPeriodPayments, previousPeriodPayments] = await Promise.all([
        prisma.paymentTransaction.aggregate({
          where: {
            status: "success",
            created_at: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.paymentTransaction.aggregate({
          where: {
            status: "success",
            created_at: { gte: prevStartDate, lte: prevEndDate },
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]);
      
      const currentRevenue = Number(currentPeriodPayments._sum.amount || 0);
      const previousRevenue = Number(previousPeriodPayments._sum.amount || 0);
      
      revenueStats = {
        totalRevenue: currentRevenue,
        previousRevenue: previousRevenue,
        revenueGrowth: calculateGrowth(currentRevenue, previousRevenue),
        transactionCount: currentPeriodPayments._count,
      };
      
      console.log("[DASHBOARD SVC] Revenue stats:", revenueStats);
    }

    // ============================================
    // CALCULATE GROWTH PERCENTAGES
    // ============================================
    const shopGrowth = calculateGrowth(newShopsInPeriod, newShopsPrevPeriod);
    const userGrowth = calculateGrowth(newUsersInPeriod, newUsersPrevPeriod);
    
    console.log("[DASHBOARD SVC] Growth rates:", { shopGrowth, userGrowth });

    // ============================================
    // RETURN BASED ON ROLE
    // ============================================
    const baseStats = {
      shops: {
        total: totalShops,
        active: activeShops,
        verified: verifiedShops,
        pendingVerification: pendingVerification,
        newInPeriod: newShopsInPeriod,
        growth: shopGrowth,
      },
      subscriptions: {
        active: activeSubscriptions,
        expiring: expiringSubscriptions,
        gracePeriod: gracePeriodSubscriptions,
        suspended: suspendedSubscriptions,
        atRiskTotal: expiringSubscriptions + gracePeriodSubscriptions + suspendedSubscriptions,
      },
      period: period,
      generatedAt: new Date().toISOString(),
    };

    // SUPER_ADMIN gets everything
    if (role === "SUPER_ADMIN") {
      return {
        ...baseStats,
        users: {
          total: totalUsers,
          active: activeUsers,
          newInPeriod: newUsersInPeriod,
          growth: userGrowth,
        },
        plans: {
          active: activePlans,
          draft: draftPlans,
        },
        tickets: {
          pending: pendingTickets,
          inProgress: inProgressTickets,
          resolvedInPeriod: resolvedTicketsInPeriod,
          total: pendingTickets + inProgressTickets,
        },
        enquiries: {
          pending: pendingEnquiries,
          repliedInPeriod: repliedEnquiriesInPeriod,
        },
        revenue: revenueStats,
      };
    }

    // ANALYST gets analytics without revenue details
    if (role === "ANALYST") {
      return {
        ...baseStats,
        users: {
          total: totalUsers,
          active: activeUsers,
          newInPeriod: newUsersInPeriod,
          growth: userGrowth,
        },
        plans: {
          active: activePlans,
          draft: draftPlans,
        },
        tickets: {
          pending: pendingTickets,
          inProgress: inProgressTickets,
          resolvedInPeriod: resolvedTicketsInPeriod,
          total: pendingTickets + inProgressTickets,
        },
        enquiries: {
          pending: pendingEnquiries,
          repliedInPeriod: repliedEnquiriesInPeriod,
        },
      };
    }

    // ACCOUNTING gets financial focus
    if (role === "ACCOUNTING") {
      return {
        ...baseStats,
        revenue: revenueStats,
      };
    }

    return baseStats;
  } catch (error) {
    console.error("[DASHBOARD SVC] getDashboardOverview error:", error);
    throw error;
  }
}

// ============================================
// GET REVENUE DATA
// ============================================

export async function getRevenueData(period = "30d") {
  const { startDate, endDate } = getPeriodDates(period);
  
  console.log("[DASHBOARD SVC] getRevenueData period:", { startDate, endDate });
  
  try {
    // Get all successful payments in the period
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        status: "success",
        created_at: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        created_at: true,
      },
      orderBy: { created_at: "asc" },
    });
    
    console.log("[DASHBOARD SVC] Raw payments count:", payments.length);
    
    // Group by day
    const dailyRevenue = {};
    
    payments.forEach((payment) => {
      const dateKey = payment.created_at.toISOString().split("T")[0];
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = 0;
      }
      dailyRevenue[dateKey] += Number(payment.amount || 0);
    });
    
    // Convert to array with all days filled
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      data.push({
        date: dateKey,
        label: new Date(dateKey).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: dailyRevenue[dateKey] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate totals
    const totalRevenue = data.reduce((sum, d) => sum + d.value, 0);
    const avgRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;
    
    console.log("[DASHBOARD SVC] Revenue data processed:", { 
      dataPoints: data.length, 
      totalRevenue, 
      avgRevenue 
    });
    
    return {
      data,
      summary: {
        total: totalRevenue,
        average: avgRevenue,
        maxValue: Math.max(...data.map((d) => d.value), 0),
        period,
      },
    };
  } catch (error) {
    console.error("[DASHBOARD SVC] getRevenueData error:", error);
    throw error;
  }
}

// ============================================
// GET USER GROWTH DATA
// ============================================

export async function getUserGrowthData(period = "30d") {
  const { startDate, endDate } = getPeriodDates(period);
  
  console.log("[DASHBOARD SVC] getUserGrowthData period:", { startDate, endDate });
  
  try {
    // Get cumulative user and shop counts
    const [usersBeforePeriod, shopsBeforePeriod] = await Promise.all([
      prisma.user.count({ where: { created_at: { lt: startDate } } }),
      prisma.shop.count({ where: { created_at: { lt: startDate } } }),
    ]);
    
    // Get daily new users and shops
    const [newUsers, newShops] = await Promise.all([
      prisma.user.findMany({
        where: { created_at: { gte: startDate, lte: endDate } },
        select: { created_at: true },
        orderBy: { created_at: "asc" },
      }),
      prisma.shop.findMany({
        where: { created_at: { gte: startDate, lte: endDate } },
        select: { created_at: true },
        orderBy: { created_at: "asc" },
      }),
    ]);
    
    console.log("[DASHBOARD SVC] New users in period:", newUsers.length);
    console.log("[DASHBOARD SVC] New shops in period:", newShops.length);
    
    // Group by day
    const dailyUsers = {};
    const dailyShops = {};
    
    newUsers.forEach((u) => {
      const dateKey = u.created_at.toISOString().split("T")[0];
      dailyUsers[dateKey] = (dailyUsers[dateKey] || 0) + 1;
    });
    
    newShops.forEach((s) => {
      const dateKey = s.created_at.toISOString().split("T")[0];
      dailyShops[dateKey] = (dailyShops[dateKey] || 0) + 1;
    });
    
    // Build cumulative data
    const data = [];
    let cumulativeUsers = usersBeforePeriod;
    let cumulativeShops = shopsBeforePeriod;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      cumulativeUsers += dailyUsers[dateKey] || 0;
      cumulativeShops += dailyShops[dateKey] || 0;
      
      data.push({
        date: dateKey,
        label: new Date(dateKey).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        users: cumulativeUsers,
        shops: cumulativeShops,
        newUsers: dailyUsers[dateKey] || 0,
        newShops: dailyShops[dateKey] || 0,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate growth
    const firstData = data[0] || { users: 0, shops: 0 };
    const lastData = data[data.length - 1] || { users: 0, shops: 0 };
    
    console.log("[DASHBOARD SVC] User growth data:", { 
      dataPoints: data.length,
      startUsers: firstData.users,
      endUsers: lastData.users,
    });
    
    return {
      data,
      summary: {
        totalUsers: lastData.users,
        totalShops: lastData.shops,
        newUsersInPeriod: newUsers.length,
        newShopsInPeriod: newShops.length,
        userGrowth: calculateGrowth(lastData.users, firstData.users),
        shopGrowth: calculateGrowth(lastData.shops, firstData.shops),
        period,
      },
    };
  } catch (error) {
    console.error("[DASHBOARD SVC] getUserGrowthData error:", error);
    throw error;
  }
}

// ============================================
// GET RECENT ONBOARDING
// ============================================

export async function getRecentOnboarding(limit = 5) {
  console.log("[DASHBOARD SVC] getRecentOnboarding limit:", limit);
  
  try {
    // Get shop owners (super_admin role) with their shop info
    const recentUsers = await prisma.user.findMany({
      where: {
        role: "super_admin",
        shop_id: { not: null },
      },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        user_id: true,
        full_name: true,
        email: true,
        status: true,
        onboarding_step: true,
        created_at: true,
        shop: {
          select: {
            shop_id: true,
            business_name: true,
            verification_status: true,
            is_active: true,
          },
        },
      },
    });
    
    console.log("[DASHBOARD SVC] Recent onboarding users:", recentUsers.length);
    
    const result = recentUsers.map((user) => {
      // Determine onboarding status
      let status = "in_progress";
      if (user.onboarding_step >= 4 && user.shop?.verification_status === "verified") {
        status = "completed";
      } else if (user.onboarding_step < 2 && 
                 new Date().getTime() - new Date(user.created_at).getTime() > 24 * 60 * 60 * 1000) {
        status = "stuck";
      }
      
      return {
        id: user.user_id,
        shop_name: user.shop?.business_name || "N/A",
        shop_id: user.shop?.shop_id,
        owner_name: user.full_name,
        email: user.email,
        step: user.onboarding_step,
        max_steps: 4,
        status,
        verification_status: user.shop?.verification_status || "pending",
        created_at: user.created_at,
      };
    });
    
    return result;
  } catch (error) {
    console.error("[DASHBOARD SVC] getRecentOnboarding error:", error);
    throw error;
  }
}

// ============================================
// GET TOP SHOPS
// ============================================

export async function getTopShops(period = "30d", limit = 5) {
  const { startDate, endDate } = getPeriodDates(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodDates(period);
  
  console.log("[DASHBOARD SVC] getTopShops period:", { startDate, endDate, limit });
  
  try {
    // Get shops with their payment totals
    const shopsWithPayments = await prisma.shop.findMany({
      where: { is_active: true },
      select: {
        shop_id: true,
        business_name: true,
        city: true,
        state: true,
        _count: {
          select: {
            users: true,
            branches: true,
          },
        },
        paymentTransactions: {
          where: {
            status: "success",
            created_at: { gte: startDate, lte: endDate },
          },
          select: { amount: true },
        },
        currentSubscription: {
          select: {
            plan: {
              select: { name: true },
            },
          },
        },
      },
    });
    
    console.log("[DASHBOARD SVC] Shops with payment data:", shopsWithPayments.length);
    
    // Calculate revenue for each shop
    const shopsWithRevenue = shopsWithPayments.map((shop) => {
      const currentRevenue = shop.paymentTransactions.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );
      
      return {
        id: shop.shop_id,
        name: shop.business_name,
        location: `${shop.city || ""}${shop.city && shop.state ? ", " : ""}${shop.state || ""}`,
        revenue: currentRevenue,
        users: shop._count.users,
        branches: shop._count.branches,
        plan: shop.currentSubscription?.plan?.name || "No Plan",
        growth: 0, // Will calculate if we have previous period data
      };
    });
    
    // Sort by revenue and take top N
    const topShops = shopsWithRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
    
    console.log("[DASHBOARD SVC] Top shops:", topShops.length);
    
    return topShops;
  } catch (error) {
    console.error("[DASHBOARD SVC] getTopShops error:", error);
    throw error;
  }
}

// ============================================
// GET RECENT ACTIVITY
// ============================================

export async function getRecentActivity(limit = 10) {
  console.log("[DASHBOARD SVC] getRecentActivity limit:", limit);
  
  try {
    // Get from audit logs
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        audit_id: true,
        action: true,
        actor_type: true,
        entity_type: true,
        metadata: true,
        created_at: true,
      },
    });
    
    console.log("[DASHBOARD SVC] Audit logs fetched:", auditLogs.length);
    
    // Map to activity format
    const activities = auditLogs.map((log) => {
      const metadata = log.metadata || {};
      
      // Generate human-readable message
      let message = log.action.replace(/_/g, " ").toLowerCase();
      let type = "settings_updated";
      
      // Map action to type and message
      if (log.action.includes("USER")) {
        type = "user_created";
        if (log.action.includes("SUSPENDED")) {
          type = "user_suspended";
          message = `User suspended: ${metadata.username || "Unknown"}`;
        } else if (log.action.includes("ACTIVATED")) {
          type = "user_activated";
          message = `User activated: ${metadata.username || "Unknown"}`;
        }
      } else if (log.action.includes("SHOP")) {
        type = "shop_created";
        if (log.action.includes("VERIFIED")) {
          type = "shop_verified";
          message = `Shop verified: ${metadata.shop_name || "Unknown"}`;
        } else if (log.action.includes("SUSPENDED")) {
          type = "shop_suspended";
          message = `Shop suspended: ${metadata.shop_name || "Unknown"}`;
        }
      } else if (log.action.includes("SUBSCRIPTION")) {
        type = "subscription_created";
        message = `Subscription ${log.action.split("_").pop()?.toLowerCase() || "updated"}`;
      } else if (log.action.includes("TICKET")) {
        type = "ticket_resolved";
        if (metadata.ticket_number) {
          message = `Ticket #${metadata.ticket_number} ${log.action.split("_").pop()?.toLowerCase() || "updated"}`;
        }
      } else if (log.action.includes("BROADCAST")) {
        type = "broadcast_sent";
        message = `Broadcast sent to ${metadata.recipient_count || 0} users`;
      } else if (log.action.includes("PLAN")) {
        type = "plan_updated";
        message = `Plan ${metadata.name || ""} ${log.action.split("_").pop()?.toLowerCase() || "updated"}`;
      }
      
      return {
        id: log.audit_id,
        type,
        action: log.action,
        message,
        actor: log.actor_type === "cadmin" ? "Admin" : "System",
        entity_type: log.entity_type,
        timestamp: log.created_at,
      };
    });
    
    return activities;
  } catch (error) {
    console.error("[DASHBOARD SVC] getRecentActivity error:", error);
    throw error;
  }
}

// ============================================
// GET DASHBOARD ALERTS
// ============================================

export async function getDashboardAlerts(role = "SUPER_ADMIN") {
  console.log("[DASHBOARD SVC] getDashboardAlerts for role:", role);
  
  try {
    const alerts = [];
    const now = new Date();
    
    // Check suspended subscriptions
    const suspendedCount = await prisma.shopSubscription.count({
      where: { is_active: false },
    });
    
    if (suspendedCount > 0) {
      alerts.push({
        id: "suspended-subscriptions",
        type: "error",
        title: "Suspended Subscriptions",
        message: `${suspendedCount} subscription(s) are currently suspended.`,
        action: { label: "View", path: "/subscriptions/risk" },
        priority: 1,
      });
    }
    
    // Check grace period subscriptions
    const graceCount = await prisma.shopSubscription.count({
      where: {
        is_active: true,
        end_date: { lt: now },
        grace_period_until: { gt: now },
      },
    });
    
    if (graceCount > 0) {
      alerts.push({
        id: "grace-period",
        type: "warning",
        title: "Grace Period Active",
        message: `${graceCount} subscription(s) in grace period need attention.`,
        action: { label: "Review", path: "/subscriptions/risk" },
        priority: 2,
      });
    }
    
    // Check expiring soon (within 7 days)
    const expiringCount = await prisma.shopSubscription.count({
      where: {
        is_active: true,
        end_date: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });
    
    if (expiringCount > 0) {
      alerts.push({
        id: "expiring-soon",
        type: "warning",
        title: "Expiring Soon",
        message: `${expiringCount} subscription(s) expiring within 7 days.`,
        action: { label: "View", path: "/subscriptions/risk" },
        priority: 3,
      });
    }
    
    // For SUPER_ADMIN: Check pending tickets
    if (role === "SUPER_ADMIN" || role === "ANALYST") {
      const pendingTickets = await prisma.ticket.count({
        where: { status: "PENDING" },
      });
      
      if (pendingTickets > 5) {
        alerts.push({
          id: "pending-tickets",
          type: "warning",
          title: "Pending Tickets",
          message: `${pendingTickets} tickets awaiting response.`,
          action: { label: "View", path: "/communications/tickets" },
          priority: 4,
        });
      }
      
      // Check pending verifications
      const pendingVerifications = await prisma.shop.count({
        where: { verification_status: "pending_review" },
      });
      
      if (pendingVerifications > 0) {
        alerts.push({
          id: "pending-verifications",
          type: "info",
          title: "Pending Verifications",
          message: `${pendingVerifications} shop(s) awaiting verification.`,
          action: { label: "Review", path: "/verification" },
          priority: 5,
        });
      }
      
      // Check pending enquiries
      const pendingEnquiries = await prisma.enquiry.count({
        where: { status: "PENDING" },
      });
      
      if (pendingEnquiries > 3) {
        alerts.push({
          id: "pending-enquiries",
          type: "info",
          title: "Pending Enquiries",
          message: `${pendingEnquiries} enquiries awaiting response.`,
          action: { label: "View", path: "/communications/enquiries" },
          priority: 6,
        });
      }
    }
    
    // Sort by priority
    alerts.sort((a, b) => a.priority - b.priority);
    
    console.log("[DASHBOARD SVC] Alerts generated:", alerts.length);
    
    return alerts;
  } catch (error) {
    console.error("[DASHBOARD SVC] getDashboardAlerts error:", error);
    throw error;
  }
}