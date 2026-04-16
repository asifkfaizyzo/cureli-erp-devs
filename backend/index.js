// backend/index.js

import "./env.js";
import express from "express";

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initializeCronJobs } from "./src/cron/jobs.js";

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE IMPORTS
// ═══════════════════════════════════════════════════════════
import maintenanceMiddleware from "./src/middleware/maintenance.js";
import { globalLimiter, authLimiter } from "./src/middleware/rateLimiter.js";
import publicUnsubscribeRoutes from './src/modules/public/unsubscribe/unsubscribe.routes.js';

// ROUTES (unchanged)
import authRoutes from "./src/modules/auth/auth.routes.js";
import shopRoutes from "./src/modules/shop/shop.routes.js";
import pendingRoutes from "./src/modules/pending/pending.routes.js";
import shopFilesRoutes from "./src/modules/shopFiles/shopFiles.routes.js";
import subscriptionRoutes from "./src/modules/subscription/subscription.routes.js";
import plansRoutes from "./src/modules/plans/plans.routes.js";
import setupRoutes from "./src/modules/setup/setup.routes.js";
import branchesRoutes from "./src/modules/branches/branches.routes.js";
import usersRoutes from "./src/modules/users/users.routes.js";
import profileRoutes from "./src/modules/profile/profile.routes.js";
import ticketRoutes from "./src/modules/tickets/tickets.routes.js";
import enquiriesRoutes from "./src/modules/enquiries/enquiries.routes.js";
import maintenanceRoutes from "./src/modules/maintenance/maintenance.routes.js";
import userNotificationRoutes from "./src/modules/notifications/user/userNotifications.routes.js";
import filesRoutes from './src/modules/files/files.routes.js';
import linkingRoutes from "./src/modules/medicines/linking.routes.js";

import medicineRoutes from "./src/modules/medicines/medicine.routes.js";
import supplierRoutes from "./src/modules/suppliers/supplier.routes.js";
import purchaseRoutes from "./src/modules/purchase/purchase.routes.js";
import inventoryRoutes from "./src/modules/inventory/inventory.routes.js";
import salesRoutes from "./src/modules/sales/sales.routes.js";
import customerRoutes from "./src/modules/customers/customer.routes.js";
import excelRoutes from "./src/modules/excel/excel.routes.js";

import cadminAuthRoutes from "./src/modules/cadmin/auth/cadminAuth.routes.js";
import cadminDocsRoutes from "./src/modules/cadmin/cadminDocs/cadminDocs.routes.js";
import cadminUserRoutes from "./src/modules/cadmin/users/cadminUser.routes.js";
import cadminShopsRoutes from "./src/modules/cadmin/shops/cadminShops.routes.js";
import cadminPlansRoutes from "./src/modules/cadmin/plans/cadminPlans.routes.js";
import cadminAdminRoutes from "./src/modules/cadmin/admins/cadminAdmin.routes.js";
import cadminProfileRoutes from "./src/modules/cadmin/profile/cadminProfile.routes.js";
import cadminTicketsRoutes from "./src/modules/cadmin/tickets/cadminTickets.routes.js";
import cadminSubscriptionsRoutes from "./src/modules/cadmin/subscriptions/cadminSubscriptions.routes.js";
import cadminAuditRoutes from "./src/modules/cadmin/audit/cadminAudit.routes.js";
import cadminBroadcastInAppRoutes from "./src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.routes.js";
import cadminNotificationRoutes from "./src/modules/notifications/cadmin/cadminNotifications.routes.js";
import cadminEmailBroadcastRoutes from './src/modules/cadmin/broadcast/email/cadminEmailBroadcast.routes.js';
import cadminDashboardRoutes from "./src/modules/cadmin/dashboard/cadminDashboard.routes.js";
import cadminMasterMedicinesRoutes from "./src/modules/cadmin/master-medicines/cadminMasterMedicines.routes.js";

// APP SETUP
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  process.env.USER_FRONTEND_ORIGIN || "http://localhost:5173",
  process.env.ADMIN_FRONTEND_ORIGIN || "http://localhost:5174",
  process.env.LANDING_FRONTEND_ORIGIN || "http://localhost:5175",
].filter(Boolean);

// CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ["X-Maintenance-Mode"],
  })
);

// Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// Body parser
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ============================================
// MAINTENANCE + RATE LIMIT
// ============================================
app.use(maintenanceMiddleware);
app.use("/api", globalLimiter);
app.use("/cadmin", globalLimiter);

// ============================================
// FILE SERVING (Uploads)
// ============================================
app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.removeHeader("X-Frame-Options");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// ============================================
// STATIC MEDICINE IMAGES
// ============================================
app.use(
  '/static/medicine_images',
  express.static(path.join(__dirname, 'static/medicine_images'))
);

// ============================================
// ROUTES
// ============================================
app.use('/api/files', filesRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/pending", pendingRoutes);
app.use("/api/shop/files", shopFilesRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/enquiries", enquiriesRoutes);
app.use('/api/notifications', userNotificationRoutes);
app.use('/api/public', publicUnsubscribeRoutes);

app.use("/api/medicines", medicineRoutes);
app.use("/api/medicines/linking", linkingRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/excel", excelRoutes);

app.use("/cadmin", cadminAuthRoutes);
app.use("/cadmin", cadminDocsRoutes);
app.use("/cadmin", cadminUserRoutes);
app.use("/cadmin", cadminShopsRoutes);
app.use("/cadmin", cadminPlansRoutes);
app.use("/cadmin", cadminAdminRoutes);
app.use("/cadmin", cadminProfileRoutes);
app.use("/cadmin", cadminTicketsRoutes);
app.use("/cadmin/enquiries", enquiriesRoutes);
app.use("/cadmin", cadminSubscriptionsRoutes);
app.use("/cadmin", cadminAuditRoutes);
app.use("/cadmin", cadminBroadcastInAppRoutes);
app.use("/cadmin", cadminNotificationRoutes);
app.use('/cadmin', cadminEmailBroadcastRoutes);
app.use('/cadmin', cadminDashboardRoutes);
app.use('/cadmin', cadminMasterMedicinesRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    maintenance_mode: process.env.MAINTENANCE_MODE?.toLowerCase() === "true",
  });
});

// ============================================
// 404 + ERROR
// ============================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  initializeCronJobs();
});

