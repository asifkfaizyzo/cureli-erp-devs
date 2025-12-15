// ============================================
// Add to existing cron/jobs.js file
// ============================================

import cron from "node-cron";
import { transitionDeprecatedPlans } from "../modules/cadmin/plans/cadminPlans.service.js";

// ... existing imports and jobs ...

/**
 * Plan Status Transition Job
 * Runs daily at 2:00 AM
 * Transitions DEPRECATED plans to SUSPENDED when all subscriptions end
 */
function initializePlanTransitionJob() {
  // Run at 2:00 AM every day
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Starting plan status transition check...");
    
    try {
      const result = await transitionDeprecatedPlans();
      
      console.log(`[CRON] Plan transition complete:`);
      console.log(`  - Checked: ${result.checked} deprecated plans`);
      console.log(`  - Transitioned: ${result.transitioned} plans to SUSPENDED`);
      
      if (result.transitioned > 0) {
        console.log(`  - Plans: ${result.plans.map(p => p.name).join(", ")}`);
      }
    } catch (err) {
      console.error("[CRON] Plan transition job failed:", err);
    }
  });

  console.log("[CRON] Plan transition job scheduled (daily at 2:00 AM)");
}

// ============================================
// Update initializeCronJobs function
// ============================================

export function initializeCronJobs() {
  console.log("[CRON] Initializing cron jobs...");
  
  // ... existing job initializations ...
  
  // Add plan transition job
  initializePlanTransitionJob();
  
  console.log("[CRON] All cron jobs initialized");
}