// backend/src/cron/jobs.js

import cron from "node-cron";
import prisma from "../config/prisma.js";
import { withCronLock, getInstanceId } from "./cronLock.js";
import { transitionDeprecatedPlans } from "../modules/cadmin/plans/cadminPlans.service.js";
import { cleanupExpiredSessions } from "../utils/session.js";
import {
  cleanupOldPendingUsers,
  cleanupIncompleteUsers,
  cleanupOldDeletionLogs,
} from "../utils/cleanup.js";
import { initializeEmailBroadcastWorker } from "./emailBroadcastWorker.js";
import { initializeFileCleanupWorker } from "./emailFileCleanupWorker.js";
import cronLogger from "../utils/cronLogger.js";

// Subscription imports
import {
  transitionExpiredToGrace,
  suspendExpiredGrace,
  transitionPendingToOverdue,
  getSubscriptionsDueForReminders,
} from "../modules/subscription/subscription.service.js";

// Inventory imports
import inventoryService from "../modules/inventory/inventory.service.js";

import {
  notifyAsync,
  NOTIFICATION_EVENTS,
} from "../modules/notifications/index.js";

// ============================================
// CRON 5: SCHEDULED BROADCASTS - Every 5 minutes
// ============================================

async function processScheduledBroadcasts() {
  cronLogger.info("Checking for scheduled broadcasts...");

  try {
    const now = new Date();

    const dueBroadcasts = await prisma.broadcastCampaign.findMany({
      where: {
        status: "scheduled",
        scheduled_for: { lte: now },
      },
      orderBy: { scheduled_for: "asc" },
    });

    if (dueBroadcasts.length === 0) {
      cronLogger.info("No scheduled broadcasts due for sending");
      return;
    }

    cronLogger.info(`Found ${dueBroadcasts.length} broadcast(s) to send`);

    let sent = 0;
    let failed = 0;

    for (const campaign of dueBroadcasts) {
      try {
        cronLogger.info(
          `Sending broadcast: ${campaign.campaign_id} - "${campaign.title}"`,
        );

        const { sendScheduled } = await import(
          "../modules/cadmin/broadcast/inapp/cadminInAppBroadcast.service.js"
        );

        const result = await sendScheduled(campaign.campaign_id);

        cronLogger.success(
          `Broadcast ${campaign.campaign_id} sent to ${result.sent} recipients`,
        );
        sent++;
      } catch (err) {
        cronLogger.error(
          `Failed to send broadcast ${campaign.campaign_id}`,
          err,
        );
        failed++;
      }
    }

    cronLogger.info(
      `Scheduled broadcasts complete: ${sent} sent, ${failed} failed`,
    );
  } catch (err) {
    cronLogger.error("Scheduled broadcasts job failed", err);
  }
}

function initializeScheduledBroadcastsJob() {
  cron.schedule("*/5 * * * *", () =>
    withCronLock("scheduled-broadcasts", 10, processScheduledBroadcasts),
  );
  cronLogger.info("Scheduled broadcasts job initialized (every 5 minutes)");
}

// ============================================
// SESSION CLEANUP - Every hour
// ============================================

async function runSessionCleanup() {
  try {
    const count = await cleanupExpiredSessions();
    if (count > 0) {
      cronLogger.info(`Cleaned up ${count} expired sessions`);
    }
  } catch (err) {
    cronLogger.error("Session cleanup failed", err);
  }
}

// ============================================
// PLAN STATUS TRANSITION - Daily at 2:00 AM
// ============================================

function initializePlanTransitionJob() {
  cron.schedule("0 2 * * *", () =>
    withCronLock("plan-transition", 30, async () => {
      cronLogger.info("Starting plan status transition check...");

      try {
        const result = await transitionDeprecatedPlans();

        cronLogger.info(
          `Plan transition complete: checked=${result.checked} deprecated plans, transitioned=${result.transitioned} plans to SUSPENDED`,
        );

        if (result.transitioned > 0) {
          cronLogger.info(
            `Transitioned plans: ${result.plans.map((p) => p.name).join(", ")}`,
          );
        }
      } catch (err) {
        cronLogger.error("Plan transition job failed", err);
      }
    }),
  );

  cronLogger.info("Plan transition job scheduled (daily at 2:00 AM)");
}

// ============================================
// CRON 1: SUBSCRIPTION LIFECYCLE (Every hour)
// ============================================

function initializeSubscriptionLifecycleJob() {
  cron.schedule("0 * * * *", () =>
    withCronLock("subscription-lifecycle", 30, async () => {
      cronLogger.info("Starting subscription lifecycle check...");

      try {
        // 1. Expired → Grace Period
        const graceResult = await transitionExpiredToGrace();
        if (graceResult.transitioned > 0) {
          cronLogger.info(
            `Expired → Grace: ${graceResult.transitioned} subscriptions`,
          );

          for (const r of graceResult.results) {
            cronLogger.info(
              `  - ${r.shop_name}: grace until ${r.grace_period_until.toISOString().split("T")[0]}`,
            );

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
          cronLogger.info(
            `Grace → Suspended: ${suspendResult.suspended} subscriptions`,
          );

          for (const r of suspendResult.results) {
            cronLogger.info(`  - ${r.shop_name} (${r.shop_id}): SUSPENDED`);

            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED,
              context: {
                shop_id: r.shop_id,
                shop_name: r.shop_name,
              },
            });
          }
        }

        cronLogger.info(
          `Subscription lifecycle complete | Grace: ${graceResult.transitioned} | Suspended: ${suspendResult.suspended}`,
        );
      } catch (err) {
        cronLogger.error("Subscription lifecycle job failed", err);
      }
    }),
  );

  cronLogger.info("Subscription lifecycle job scheduled (every hour)");
}

// ============================================
// CRON 2: PAYMENT STATUS SYNC - Daily at 1:00 AM
// ============================================

function initializePaymentStatusSyncJob() {
  cron.schedule("0 1 * * *", () =>
    withCronLock("payment-sync", 30, async () => {
      cronLogger.info("Starting payment status sync...");

      try {
        const result = await transitionPendingToOverdue();

        if (result.updated > 0) {
          cronLogger.info(
            `Pending → Overdue: ${result.updated} subscriptions`,
          );
        }

        cronLogger.info("Payment status sync complete");
      } catch (err) {
        cronLogger.error("Payment status sync failed", err);
      }
    }),
  );

  cronLogger.info("Payment status sync job scheduled (daily at 1:00 AM)");
}

// ============================================
// CRON 3: REMINDERS & FINAL WARNINGS - Daily at 9:00 AM
// ============================================

function initializeReminderJob() {
  cron.schedule("0 9 * * *", () =>
    withCronLock("reminder-emails", 60, async () => {
      cronLogger.info("Starting reminder emails...");

      try {
        const reminders = await getSubscriptionsDueForReminders();

        // 7 DAYS BEFORE EXPIRY
        if (reminders.expiring7Days.length > 0) {
          cronLogger.info(
            `Expiring in 7 days: ${reminders.expiring7Days.length} shops`,
          );
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
          cronLogger.info(
            `Expiring in 3 days: ${reminders.expiring3Days.length} shops`,
          );
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
          cronLogger.info(
            `Grace ending tomorrow: ${reminders.graceEndingSoon.length} shops`,
          );
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

        cronLogger.info("All reminder emails dispatched");
      } catch (err) {
        cronLogger.error("Reminder job failed", err);
      }
    }),
  );

  cronLogger.info("Reminder job scheduled (daily at 9:00 AM)");
}

// ============================================
// CRON 4: INVENTORY EXPIRY CHECKS - Daily at 6:00 AM
// ============================================

function initializeInventoryExpiryJob() {
  cron.schedule("0 6 * * *", () =>
    withCronLock("inventory-expiry", 60, async () => {
      cronLogger.info("Starting inventory expiry checks...");

      try {
        const shops = await prisma.shop.findMany({
          where: { is_active: true },
          select: { shop_id: true, business_name: true },
        });

        let totalExpired = 0;
        let totalNearExpiry = 0;

        for (const shop of shops) {
          try {
            const expiredResult = await inventoryService.markExpiredItems(
              shop.shop_id,
            );
            totalExpired += expiredResult.count || 0;

            if (expiredResult.count > 0) {
              cronLogger.info(
                `  - ${shop.business_name}: ${expiredResult.count} items expired`,
              );
            }

            const nearExpiryResult =
              await inventoryService.sendNearExpiryAlerts(shop.shop_id, 30);
            totalNearExpiry += nearExpiryResult.sent || 0;

            if (nearExpiryResult.sent > 0) {
              cronLogger.info(
                `  - ${shop.business_name}: ${nearExpiryResult.sent} near-expiry alerts sent`,
              );
            }
          } catch (shopErr) {
            cronLogger.error(`  - ${shop.business_name} failed`, shopErr);
          }
        }

        cronLogger.info(
          `Inventory expiry checks complete | Expired: ${totalExpired} | Near-expiry alerts: ${totalNearExpiry}`,
        );
      } catch (err) {
        cronLogger.error("Inventory expiry job failed", err);
      }
    }),
  );

  cronLogger.info("Inventory expiry job scheduled (daily at 6:00 AM)");
}

// ============================================
// MARKETPLACE ORDER AUTO-COMPLETE - Every hour
// ============================================

async function autoCompleteStaleOrders() {
  cronLogger.info('Checking for stale READY_FOR_PICKUP orders...');

  try {
    // Orders stuck in READY_FOR_PICKUP for more than 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const staleOrders = await prisma.marketplaceOrder.findMany({
      where: {
        status: 'READY_FOR_PICKUP',
        ready_at: { lt: cutoff },
        auto_completed: false,
      },
      select: {
        order_id: true,
        order_number: true,
        shop_id: true,
      },
    });

    if (staleOrders.length === 0) {
      cronLogger.info('No stale orders found');
      return;
    }

    cronLogger.info(
      `Found ${staleOrders.length} stale order(s) to auto-complete`,
    );

    const now = new Date();
    let completed = 0;
    let failed = 0;

    for (const order of staleOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.marketplaceOrder.update({
            where: { order_id: order.order_id },
            data: {
              status: 'COMPLETED',
              completed_at: now,
              auto_completed: true,
            },
          });

          await tx.marketplaceOrderStatusHistory.create({
            data: {
              order_id: order.order_id,
              from_status: 'READY_FOR_PICKUP',
              to_status: 'COMPLETED',
              changed_by_type: 'system',
              changed_by_id: null,
              reason: 'auto_completed',
            },
          });
        });

        cronLogger.info(`  - Auto-completed order ${order.order_number}`);
        completed++;
      } catch (err) {
        cronLogger.error(
          `  - Failed to auto-complete ${order.order_number}`,
          err,
        );
        failed++;
      }
    }

    cronLogger.info(
      `Marketplace auto-complete done: ${completed} completed, ${failed} failed`,
    );
  } catch (err) {
    cronLogger.error('Marketplace order auto-complete job failed', err);
  }
}

function initializeMarketplaceOrderAutoComplete() {
  cron.schedule('0 * * * *', () =>
    withCronLock('marketplace-order-autocomplete', 10, autoCompleteStaleOrders),
  );
  cronLogger.info('Marketplace order auto-complete scheduled (every hour)');
}

// ============================================
// INITIALIZE ALL CRON JOBS
// ============================================

export function initializeCronJobs() {
  cronLogger.info("Initializing cron jobs...");
  cronLogger.info(`Instance ID: ${getInstanceId()}`);
  cronLogger.info("Distributed locking: ENABLED");

  // Email broadcast worker (has its own lock + atomic claims)
  initializeEmailBroadcastWorker();
  initializeFileCleanupWorker();
  cronLogger.info("Email broadcast worker: Every 1 minute");
  cronLogger.info("Email file cleanup: Daily at 4:00 AM");

  // Session cleanup (every hour)
  setInterval(
    () => withCronLock("session-cleanup", 10, runSessionCleanup),
    60 * 60 * 1000,
  );
  // Run once on startup
  withCronLock("session-cleanup", 10, runSessionCleanup);

  // Scheduled jobs
  initializePlanTransitionJob();
  initializeSubscriptionLifecycleJob();
  initializePaymentStatusSyncJob();
  initializeReminderJob();
  initializeInventoryExpiryJob();
  initializeScheduledBroadcastsJob();
  initializeMarketplaceOrderAutoComplete();

  // Cleanup jobs
  cron.schedule("0 3 * * *", () =>
    withCronLock("cleanup-pending-users", 15, async () => {
      cronLogger.info("Running pending users cleanup...");
      try {
        await cleanupOldPendingUsers();
        cronLogger.success("Pending users cleanup completed");
      } catch (err) {
        cronLogger.error("Pending users cleanup failed", err);
      }
    }),
  );

  cron.schedule("15 3 * * *", () =>
    withCronLock("cleanup-incomplete-users", 15, async () => {
      cronLogger.info("Running incomplete users cleanup...");
      try {
        const result = await cleanupIncompleteUsers();
        cronLogger.success(
          `Incomplete users cleanup completed: ${result.deleted} deleted`,
        );
      } catch (err) {
        cronLogger.error("Incomplete users cleanup failed", err);
      }
    }),
  );

  cron.schedule("30 3 * * *", () =>
    withCronLock("cleanup-deletion-logs", 15, async () => {
      cronLogger.info("Running deletion logs cleanup...");
      try {
        const count = await cleanupOldDeletionLogs();
        cronLogger.success(
          `Deletion logs cleanup completed: ${count} old logs removed`,
        );
      } catch (err) {
        cronLogger.error("Deletion logs cleanup failed", err);
      }
    }),
  );

  cron.schedule("45 3 * * *", () =>
    withCronLock("cleanup-otp-limits", 10, async () => {
      cronLogger.info("Cleaning up old OTP daily limits...");
      try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await prisma.otpDailyLimit.deleteMany({
          where: { date: { lt: cutoff } },
        });
        cronLogger.success(`Removed ${result.count} old OTP limit records`);
      } catch (err) {
        cronLogger.error("OTP limits cleanup failed", err);
      }
    }),
  );

  cronLogger.info("All cron jobs initialized:");
  cronLogger.info("  - Session cleanup: Every hour");
  cronLogger.info("  - Plan transition: Daily at 2:00 AM");
  cronLogger.info("  - Subscription lifecycle + emails: Every hour");
  cronLogger.info("  - Payment status sync: Daily at 1:00 AM");
  cronLogger.info("  - Inventory expiry checks + alerts: Daily at 6:00 AM");
  cronLogger.info("  - Reminder emails (7d/3d/final): Daily at 9:00 AM");
  cronLogger.info("  - Pending users cleanup: Daily at 3:00 AM");
  cronLogger.info("  - Incomplete users cleanup: Daily at 3:15 AM");
  cronLogger.info("  - Deletion logs cleanup: Daily at 3:30 AM");
  cronLogger.info("  - Scheduled broadcasts: Every 5 minutes");
  cronLogger.info("  - OTP daily limits cleanup: Daily at 3:45 AM");
  cronLogger.info("  - Marketplace order auto-complete: Every hour");
}