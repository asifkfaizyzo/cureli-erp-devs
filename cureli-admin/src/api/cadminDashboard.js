// src/api/cadminDashboard.js

import CAdminAPI from "./axios";

// Logger for debugging
const log = (...args) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[DASHBOARD API]", ...args);
  }
};

/**
 * Get dashboard overview with KPIs
 * @param {string} period - Time period (7d, 30d, 90d, 6m, 1y)
 */
export async function getDashboardOverview(period = "30d") {
  try {
    log("Fetching overview, period:", period);
    const response = await CAdminAPI.get("/dashboard/overview", { params: { period } });
    log("Overview response:", response.data);
    return response.data;
  } catch (error) {
    log("Overview error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get revenue chart data
 * @param {string} period - Time period
 */
export async function getRevenueData(period = "30d") {
  try {
    log("Fetching revenue, period:", period);
    const response = await CAdminAPI.get("/dashboard/revenue", { params: { period } });
    log("Revenue response:", response.data);
    return response.data;
  } catch (error) {
    log("Revenue error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get user and shop growth data
 * @param {string} period - Time period
 */
export async function getUserGrowthData(period = "30d") {
  try {
    log("Fetching user growth, period:", period);
    const response = await CAdminAPI.get("/dashboard/user-growth", { params: { period } });
    log("User growth response:", response.data);
    return response.data;
  } catch (error) {
    log("User growth error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get recent onboarding users/shops
 * @param {number} limit - Number of records
 */
export async function getRecentOnboarding(limit = 5) {
  try {
    log("Fetching onboarding, limit:", limit);
    const response = await CAdminAPI.get("/dashboard/onboarding", { params: { limit } });
    log("Onboarding response:", response.data);
    return response.data;
  } catch (error) {
    log("Onboarding error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get top performing shops
 * @param {string} period - Time period
 * @param {number} limit - Number of shops
 */
export async function getTopShops(period = "30d", limit = 5) {
  try {
    log("Fetching top shops, period:", period, "limit:", limit);
    const response = await CAdminAPI.get("/dashboard/top-shops", { params: { period, limit } });
    log("Top shops response:", response.data);
    return response.data;
  } catch (error) {
    log("Top shops error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get recent activity feed
 * @param {number} limit - Number of activities
 */
export async function getRecentActivity(limit = 10) {
  try {
    log("Fetching activity, limit:", limit);
    const response = await CAdminAPI.get("/dashboard/activity", { params: { limit } });
    log("Activity response:", response.data);
    return response.data;
  } catch (error) {
    log("Activity error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get dashboard alerts
 */
export async function getDashboardAlerts() {
  try {
    log("Fetching alerts");
    const response = await CAdminAPI.get("/dashboard/alerts");
    log("Alerts response:", response.data);
    return response.data;
  } catch (error) {
    log("Alerts error:", error.response?.data || error.message);
    throw error;
  }
}

export default {
  getDashboardOverview,
  getRevenueData,
  getUserGrowthData,
  getRecentOnboarding,
  getTopShops,
  getRecentActivity,
  getDashboardAlerts,
};