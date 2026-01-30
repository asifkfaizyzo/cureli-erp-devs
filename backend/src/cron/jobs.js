// backend/src/cron/jobs.js

import cron from "node-cron";
import prisma from "../config/prisma.js";  // ✅ Add this import
import { transitionDeprecatedPlans } from "../modules/cadmin/plans/cadminPlans.service.js";
import { cleanupExpiredSessions } from "../utils/session.js";
import {
  cleanupOldPendingUsers,
  cleanupIncompleteUsers,
  cleanupOldDeletionLogs,
} from "../utils/cleanup.js";

// Subscription imports
import {
  transitionExpiredToGrace,
  suspendExpiredGrace,
  transitionPendingToOverdue,
  getSubscriptionsDueForReminders,
  sendSubscriptionReminders,
} from "../modules/subscription/subscription.service.js";

// ✅ ADD: Inventory imports
import inventoryService from "../modules/inventory/inventory.service.js";

import { notifyAsync, NOTIFICATION_EVENTS } from "../modules/notifications/index.js";

// ============================================
// SESSION CLEANUP - Every hour
// ============================================

async function runSessionCleanup() {
  try {
    const count = await cleanupExpiredSessions();
    if (count > 0) {
      console.log(`[CRON] Cleaned up ${count} expired sessions`);
    }
  } catch (err) {
    console.error("[CRON] Session cleanup failed:", err);
  }
}

// ============================================
// PLAN STATUS TRANSITION - Daily at 2:00 AM
// ============================================

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

// ============================================
// CRON 1: SUBSCRIPTION LIFECYCLE (Every hour)
// ============================================

function initializeSubscriptionLifecycleJob() {
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Starting subscription lifecycle check...");

    try {
      // 1. Expired → Grace Period
      const graceResult = await transitionExpiredToGrace();
      if (graceResult.transitioned > 0) {
        console.log(`[CRON] Expired → Grace: ${graceResult.transitioned} subscriptions`);

        for (const r of graceResult.results) {
          console.log(`       - ${r.shop_name}: grace until ${r.grace_period_until.toISOString().split("T")[0]}`);

          // SEND GRACE STARTED EMAIL
          notifyAsync({
            type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED,
            context: {
              shop_id: r.shop_id,
              shop_name: r.shop_name,
              end_date: r.end_date,
              grace_period_until: r.grace_period_until,
            },
          });
        }
      }

      // 2. Grace Expired → Suspended
      const suspendResult = await suspendExpiredGrace();
      if (suspendResult.suspended > 0) {
        console.log(`[CRON] Grace → Suspended: ${suspendResult.suspended} subscriptions`);

        for (const r of suspendResult.results) {
          console.log(`       - ${r.shop_name} (${r.shop_id}): SUSPENDED`);

          // SEND SUSPENDED EMAIL
          notifyAsync({
            type: NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED,
            context: {
              shop_id: r.shop_id,
              shop_name: r.shop_name,
            },
          });
        }
      }

      console.log(`[CRON] Subscription lifecycle complete`);
      console.log(`       Grace: ${graceResult.transitioned} | Suspended: ${suspendResult.suspended}`);
    } catch (err) {
      console.error("[CRON] Subscription lifecycle job failed:", err);
    }
  });

  console.log("[CRON] Subscription lifecycle job scheduled (every hour)");
}

// ============================================
// CRON 2: PAYMENT STATUS SYNC - Daily at 1:00 AM
// ============================================

function initializePaymentStatusSyncJob() {
  cron.schedule("0 1 * * *", async () => {
    console.log("[CRON] Starting payment status sync...");

    try {
      const result = await transitionPendingToOverdue();

      if (result.updated > 0) {
        console.log(`[CRON] Pending → Overdue: ${result.updated} subscriptions`);
      }

      console.log(`[CRON] Payment status sync complete`);
    } catch (err) {
      console.error("[CRON] Payment status sync failed:", err);
    }
  });

  console.log("[CRON] Payment status sync job scheduled (daily at 1:00 AM)");
}

// ============================================
// CRON 3: REMINDERS & FINAL WARNINGS - Daily at 9:00 AM
// ============================================

function initializeReminderJob() {
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Starting reminder emails...");

    try {
      const reminders = await getSubscriptionsDueForReminders();

      // 7 DAYS BEFORE EXPIRY
      if (reminders.expiring7Days.length > 0) {
        console.log(`[CRON] Expiring in 7 days: ${reminders.expiring7Days.length} shops`);
        for (const sub of reminders.expiring7Days) {
          notifyAsync({
            type: NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS,
            context: {
              shop_id: sub.shop_id,
              shop_name: sub.shop.business_name,
              end_date: sub.end_date,
              plan_name: sub.plan?.name || "Standard",
              daysLeft: 7,
            },
          });
        }
      }

      // 3 DAYS BEFORE EXPIRY
      if (reminders.expiring3Days.length > 0) {
        console.log(`[CRON] Expiring in 3 days: ${reminders.expiring3Days.length} shops`);
        for (const sub of reminders.expiring3Days) {
          notifyAsync({
            type: NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS,
            context: {
              shop_id: sub.shop_id,
              shop_name: sub.shop.business_name,
              end_date: sub.end_date,
              plan_name: sub.plan?.name || "Standard",
              daysLeft: 3,
            },
          });
        }
      }

      // GRACE ENDING TOMORROW
      if (reminders.graceEndingSoon.length > 0) {
        console.log(`[CRON] Grace ending tomorrow: ${reminders.graceEndingSoon.length} shops`);
        for (const sub of reminders.graceEndingSoon) {
          notifyAsync({
            type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING,
            context: {
              shop_id: sub.shop_id,
              shop_name: sub.shop.business_name,
              grace_period_until: sub.grace_period_until,
            },
          });
        }
      }

      console.log("[CRON] All reminder emails dispatched");
    } catch (err) {
      console.error("[CRON] Reminder job failed:", err);
    }
  });

  console.log("[CRON] Reminder job scheduled (daily at 9:00 AM)");
}

// ============================================
// ✅ NEW: CRON 4: INVENTORY EXPIRY CHECKS - Daily at 6:00 AM
// ============================================

function initializeInventoryExpiryJob() {
  cron.schedule("0 6 * * *", async () => {
    console.log("[CRON] Starting inventory expiry checks...");

    try {
      // Get all active shops
      const shops = await prisma.shop.findMany({
        where: { is_active: true },
        select: { shop_id: true, business_name: true },
      });

      let totalExpired = 0;
      let totalNearExpiry = 0;

      for (const shop of shops) {
        try {
          // 1. Mark expired items and send alerts
          const expiredResult = await inventoryService.markExpiredItems(shop.shop_id);
          totalExpired += expiredResult.count || 0;
          
          if (expiredResult.count > 0) {
            console.log(`       - ${shop.business_name}: ${expiredResult.count} items expired`);
          }

          // 2. Send near-expiry alerts (30 days ahead)
          const nearExpiryResult = await inventoryService.sendNearExpiryAlerts(shop.shop_id, 30);
          totalNearExpiry += nearExpiryResult.sent || 0;
          
          if (nearExpiryResult.sent > 0) {
            console.log(`       - ${shop.business_name}: ${nearExpiryResult.sent} near-expiry alerts sent`);
          }
        } catch (shopErr) {
          console.error(`       - ${shop.business_name} failed:`, shopErr.message);
        }
      }

      console.log(`[CRON] Inventory expiry checks complete`);
      console.log(`       Expired: ${totalExpired} | Near-expiry alerts: ${totalNearExpiry}`);
    } catch (err) {
      console.error("[CRON] Inventory expiry job failed:", err);
    }
  });

  console.log("[CRON] Inventory expiry job scheduled (daily at 6:00 AM)");
}

// ============================================
// INITIALIZE ALL CRON JOBS
// ============================================

export function initializeCronJobs() {
  console.log("Initializing cron jobs...");

  // Session cleanup (every hour)
  setInterval(runSessionCleanup, 60 * 60 * 1000);
  runSessionCleanup();

  // Scheduled jobs
  initializePlanTransitionJob();
  initializeSubscriptionLifecycleJob();
  initializePaymentStatusSyncJob();
  initializeReminderJob();
  initializeInventoryExpiryJob();  // ✅ NEW: Inventory expiry checks

  // Cleanup jobs
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 [CRON] Running pending users cleanup...");
    try {
      await cleanupOldPendingUsers();
      console.log("✅ [CRON] Pending users cleanup completed");
    } catch (err) {
      console.error("❌ [CRON] Pending users cleanup failed:", err);
    }
  });

  cron.schedule("15 3 * * *", async () => {
    console.log("🧹 [CRON] Running incomplete users cleanup...");
    try {
      const result = await cleanupIncompleteUsers();
      console.log(`✅ [CRON] Incomplete users cleanup completed: ${result.deleted} deleted`);
    } catch (err) {
      console.error("❌ [CRON] Incomplete users cleanup failed:", err);
    }
  });

  cron.schedule("30 3 * * *", async () => {
    console.log("🧹 [CRON] Running deletion logs cleanup...");
    try {
      const count = await cleanupOldDeletionLogs();
      console.log(`✅ [CRON] Deletion logs cleanup completed: ${count} old logs removed`);
    } catch (err) {
      console.error("❌ [CRON] Deletion logs cleanup failed:", err);
    }
  });

  console.log("All cron jobs initialized:");
  console.log("   - Session cleanup: Every hour");
  console.log("   - Plan transition: Daily at 2:00 AM");
  console.log("   - Subscription lifecycle + emails: Every hour");
  console.log("   - Payment status sync: Daily at 1:00 AM");
  console.log("   - Inventory expiry checks + alerts: Daily at 6:00 AM");  // ✅ NEW
  console.log("   - Reminder emails (7d/3d/final): Daily at 9:00 AM");
  console.log("   - Pending users cleanup: Daily at 3:00 AM");
  console.log("   - Incomplete users cleanup: Daily at 3:15 AM");
  console.log("   - Deletion logs cleanup: Daily at 3:30 AM");
}