// backend/src/modules/cadmin/dashboard/cadminDashboard.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  getDashboardOverviewController,
  getRevenueDataController,
  getUserGrowthController,
  getRecentOnboardingController,
  getTopShopsController,
  getRecentActivityController,
  getDashboardAlertsController,
} from "./cadminDashboard.controller.js";

const router = express.Router();

// All routes require CAdmin authentication
router.use(requireCAdmin);

// GET /cadmin/dashboard/overview - Main KPIs and stats
router.get("/dashboard/overview", getDashboardOverviewController);

// GET /cadmin/dashboard/revenue - Revenue chart data
router.get("/dashboard/revenue", getRevenueDataController);

// GET /cadmin/dashboard/user-growth - User/shop growth data
router.get("/dashboard/user-growth", getUserGrowthController);

// GET /cadmin/dashboard/onboarding - Recent onboarding users
router.get("/dashboard/onboarding", getRecentOnboardingController);

// GET /cadmin/dashboard/top-shops - Top performing shops
router.get("/dashboard/top-shops", getTopShopsController);

// GET /cadmin/dashboard/activity - Recent activity feed
router.get("/dashboard/activity", getRecentActivityController);

// GET /cadmin/dashboard/alerts - System alerts
router.get("/dashboard/alerts", getDashboardAlertsController);

export default router;