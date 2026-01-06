// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\cron\jobs.js

import cron from "node-cron";
import { transitionDeprecatedPlans } from "../modules/cadmin/plans/cadminPlans.service.js";
import { cleanupExpiredSessions } from "../utils/session.js";
import { SubscriptionStatus, GRACE_PERIOD_DAYS } from "../config/subscription.js";
import {
  cleanupOldPendingUsers,
  cleanupIncompleteUsers,
  cleanupOldDeletionLogs,
} from "../utils/cleanup.js";

/**
 * Session cleanup - runs every hour
 */
async function runSessionCleanup() {
  try {
    const count = await cleanupExpiredSessions();
    if (count > 0) {
      console.log(`🧹 [CRON] Cleaned up ${count} expired sessions`);
    }
  } catch (err) {
    console.error("[CRON] Session cleanup failed:", err);
  }
}

/**
 * Plan Status Transition Job
 * Runs daily at 2:00 AM
 */
function initializePlanTransitionJob() {
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Starting plan status transition check...");

    try {
      const result = await transitionDeprecatedPlans();

      console.log(`[CRON] Plan transition complete:`);
      console.log(`  - Checked: ${result.checked} deprecated plans`);
      console.log(`  - Transitioned: ${result.transitioned} plans to SUSPENDED`);

      if (result.transitioned > 0) {
        console.log(`  - Plans: ${result.plans.map((p) => p.name).join(", ")}`);
      }
    } catch (err) {
      console.error("[CRON] Plan transition job failed:", err);
    }
  });

  console.log("[CRON] Plan transition job scheduled (daily at 2:00 AM)");
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  console.log("⏰ Initializing cron jobs...");

  // ============================================
  // SESSION CLEANUP - Every hour
  // ============================================
  setInterval(runSessionCleanup, 60 * 60 * 1000);
  // Run once on startup
  runSessionCleanup();

  // ============================================
  // PLAN TRANSITION - Daily at 2:00 AM
  // ============================================
  initializePlanTransitionJob();

  // ============================================
  // CLEANUP OLD PENDING USERS - Daily at 3:00 AM
  // ============================================
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 [CRON] Running pending users cleanup...");
    try {
      await cleanupOldPendingUsers();
      console.log("✅ [CRON] Pending users cleanup completed");
    } catch (err) {
      console.error("❌ [CRON] Pending users cleanup failed:", err);
    }
  });

  // ============================================
  // CLEANUP INCOMPLETE USERS - Daily at 3:15 AM
  // ============================================
  cron.schedule("15 3 * * *", async () => {
    console.log("🧹 [CRON] Running incomplete users cleanup...");
    try {
      const result = await cleanupIncompleteUsers();
      console.log(`✅ [CRON] Incomplete users cleanup completed: ${result.deleted} deleted`);
    } catch (err) {
      console.error("❌ [CRON] Incomplete users cleanup failed:", err);
    }
  });

  // ============================================
  // CLEANUP OLD DELETION LOGS - Daily at 3:30 AM
  // ============================================
  cron.schedule("30 3 * * *", async () => {
    console.log("🧹 [CRON] Running deletion logs cleanup...");
    try {
      const count = await cleanupOldDeletionLogs();
      console.log(`✅ [CRON] Deletion logs cleanup completed: ${count} old logs removed`);
    } catch (err) {
      console.error("❌ [CRON] Deletion logs cleanup failed:", err);
    }
  });

  console.log("✅ All cron jobs initialized:");
  console.log("   - Session cleanup: Every hour");
  console.log("   - Plan transition: Daily at 2:00 AM");
  console.log("   - Pending users cleanup: Daily at 3:00 AM");
  console.log("   - Incomplete users cleanup: Daily at 3:15 AM");
  console.log("   - Deletion logs cleanup: Daily at 3:30 AM");
}

export async function markExpiredSubscriptions() {
  const now = new Date();
  
  const result = await prisma.shopSubscription.updateMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      end_date: { lt: now },
    },
    data: {
      status: SubscriptionStatus.EXPIRED,
    },
  });

  if (result.count > 0) {
    console.log(`[CRON] Marked ${result.count} subscriptions as EXPIRED`);
  }

  return result;
}

/**
 * Run daily: Send renewal reminders
 * - 30 days before expiry
 * - 7 days before expiry
 * - On expiry day
 * - During grace period (every 5 days)
 */
export async function sendRenewalReminders() {
  const now = new Date();
  
  // 30 days reminder
  const thirtyDays = new Date(now);
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  
  const expiringSoon = await prisma.shopSubscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      end_date: {
        gte: new Date(thirtyDays.setHours(0, 0, 0, 0)),
        lt: new Date(thirtyDays.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      shop: {
        include: {
          owner: {
            select: { email: true, full_name: true },
          },
        },
      },
      plan: true,
    },
  });

  // TODO: Send emails for expiringSoon subscriptions
  console.log(`[CRON] ${expiringSoon.length} subscriptions expiring in 30 days`);

  // Similar for 7-day, same-day, and grace period reminders
}