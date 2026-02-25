// backend/src/modules/cadmin/dashboard/cadminDashboard.controller.js

import { success, fail } from "../../../utils/response.js";
import * as svc from "./cadminDashboard.service.js";

/**
 * GET /cadmin/dashboard/overview
 * Get main dashboard KPIs and statistics
 */
export async function getDashboardOverviewController(req, res) {
  try {
    const { period = "30d" } = req.query;
    const cadminRole = req.cadmin?.role;
    
    console.log("[DASHBOARD] Fetching overview for role:", cadminRole, "period:", period);
    
    const result = await svc.getDashboardOverview(period, cadminRole);
    
    console.log("[DASHBOARD] Overview result:", JSON.stringify(result, null, 2));
    
    return success(res, result, "Dashboard overview fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD] getDashboardOverviewController error:", err);
    return fail(res, err.message || "Failed to fetch dashboard overview", 500);
  }
}

/**
 * GET /cadmin/dashboard/revenue
 * Get revenue chart data
 */
export async function getRevenueDataController(req, res) {
  try {
    const { period = "30d" } = req.query;
    
    console.log("[DASHBOARD] Fetching revenue data for period:", period);
    
    const result = await svc.getRevenueData(period);
    
    console.log("[DASHBOARD] Revenue data points:", result.data?.length || 0);
    
    return success(res, result, "Revenue data fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD] getRevenueDataController error:", err);
    return fail(res, err.message || "Failed to fetch revenue data", 500);
  }
}

/**
 * GET /cadmin/dashboard/user-growth
 * Get user and shop growth data
 */
export async function getUserGrowthController(req, res) {
  try {
    const { period = "30d" } = req.query;
    
    console.log("[DASHBOARD] Fetching user growth for period:", period);
    
    const result = await svc.getUserGrowthData(period);
    
    console.log("[DASHBOARD] User growth data points:", result.data?.length || 0);
    
    return success(res, result, "User growth data fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD] getUserGrowthController error:", err);
    return fail(res, err.message || "Failed to fetch user growth data", 500);
  }
}

/**
 * GET /cadmin/dashboard/onboarding
 * Get recent onboarding users/shops
 */
export async function getRecentOnboardingController(req, res) {
  try {
    const { limit = 5 } = req.query;
    
    console.log("[DASHBOARD] Fetching recent onboarding, limit:", limit);
    
    const result = await svc.getRecentOnboarding(Number(limit));
    
    console.log("[DASHBOARD] Onboarding records:", result.length);
    
    return success(res, result, "Recent onboarding fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD] getRecentOnboardingController error:", err);
    return fail(res, err.message || "Failed to fetch recent onboarding", 500);
  }
}

/**
 * GET /cadmin/dashboard/top-shops
 * Get top performing shops
 */
export async function getTopShopsController(req, res) {
  try {
    const { period = "30d", limit = 5 } = req.query;
    
    console.log("[DASHBOARD] Fetching top shops for period:", period, "limit:", limit);
    
    const result = await svc.getTopShops(period, Number(limit));
    
    console.log("[DASHBOARD] Top shops:", result.length);
    
    return success(res, result, "Top shops fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD] getTopShopsController error:", err);
    return fail(res, err.message || "Failed to fetch top shops", 500);
  }
}

/**
 * GET /cadmin/dashboard/activity
 * Get recent system activity
 */
export async function getRecentActivityController(req, res) {
  try {
    const { limit = 10 } = req.query;
    
    console.log("[DASHBOARD] Fetching recent activity, limit:", limit);
    
    const result = await svc.getRecentActivity(Number(limit));
    
    console.log("[DASHBOARD] Activity records:", result.length);
    
    return success(res, result, "Recent activity fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD] getRecentActivityController error:", err);
    return fail(res, err.message || "Failed to fetch recent activity", 500);
  }
}

/**
 * GET /cadmin/dashboard/alerts
 * Get system alerts and warnings
 */
export async function getDashboardAlertsController(req, res) {
  try {
    const cadminRole = req.cadmin?.role;
    
    console.log("[DASHBOARD] Fetching alerts for role:", cadminRole);
    
    const result = await svc.getDashboardAlerts(cadminRole);
    
    console.log("[DASHBOARD] Alerts:", result.length);
    
    return success(res, result, "Dashboard alerts fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD] getDashboardAlertsController error:", err);
    return fail(res, err.message || "Failed to fetch dashboard alerts", 500);
  }
}