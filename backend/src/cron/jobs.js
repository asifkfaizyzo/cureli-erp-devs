import cron from "node-cron";
import {
  cleanupOldPendingUsers,
  cleanupIncompleteUsers,
  cleanupOldDeletionLogs,
} from "../utils/cleanup.js";

/**
 * Initialize all scheduled cron jobs
 */
export function initializeCronJobs() {
  console.log("⏰ Initializing cron jobs...");

  // Cleanup old pending users (every day at 3:00 AM)
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 Running pending users cleanup...");
    try {
      await cleanupOldPendingUsers();
      console.log("✅ Pending users cleanup completed");
    } catch (err) {
      console.error("❌ Pending users cleanup failed:", err);
    }
  });

  // Cleanup incomplete users (every day at 3:15 AM)
  cron.schedule("15 3 * * *", async () => {
    console.log("🧹 Running incomplete users cleanup...");
    try {
      const result = await cleanupIncompleteUsers();
      console.log(`✅ Incomplete users cleanup completed: ${result.deleted} deleted`);
    } catch (err) {
      console.error("❌ Incomplete users cleanup failed:", err);
    }
  });

  // Cleanup old deletion logs (every day at 3:30 AM)
  cron.schedule("30 3 * * *", async () => {
    console.log("🧹 Running deletion logs cleanup...");
    try {
      const count = await cleanupOldDeletionLogs();
      console.log(`✅ Deletion logs cleanup completed: ${count} old logs removed`);
    } catch (err) {
      console.error("❌ Deletion logs cleanup failed:", err);
    }
  });

  console.log("✅ All cron jobs initialized:");
  console.log("   - Pending users cleanup: Daily at 3:00 AM");
  console.log("   - Incomplete users cleanup: Daily at 3:15 AM");
  console.log("   - Deletion logs cleanup: Daily at 3:30 AM");
}