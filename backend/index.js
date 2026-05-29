import "./env.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { initializeCronJobs } from "./src/cron/jobs.js";
import { ensureIndexes } from "./src/config/ensureIndexes.js";
// ============================================
// MIDDLEWARE IMPORTS
// ============================================
import maintenanceMiddleware from "./src/middleware/maintenance.js";
import { globalLimiter, cadminLimiter, relaxedLimiter, mobileLimiter } from "./src/middleware/rateLimiter.js";
import publicUnsubscribeRoutes from "./src/modules/public/unsubscribe/unsubscribe.routes.js";

// ROUTES
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
import filesRoutes from "./src/modules/files/files.routes.js";
import linkingRoutes from "./src/modules/medicines/linking.routes.js";
import medicineRoutes from "./src/modules/medicines/medicine.routes.js";
import supplierRoutes from "./src/modules/suppliers/supplier.routes.js";
import purchaseRoutes from "./src/modules/purchase/purchase.routes.js";
import inventoryRoutes from "./src/modules/inventory/inventory.routes.js";
import salesRoutes from "./src/modules/sales/sales.routes.js";
import customerRoutes from "./src/modules/customers/customer.routes.js";
import excelRoutes from "./src/modules/excel/excel.routes.js";
import marketplaceRoutes from "./src/modules/marketplace/marketplace.routes.js";
import listingsRoutes from "./src/modules/marketplace-listings/listings.routes.js";

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
import cadminEmailBroadcastRoutes from "./src/modules/cadmin/broadcast/email/cadminEmailBroadcast.routes.js";
import cadminDashboardRoutes from "./src/modules/cadmin/dashboard/cadminDashboard.routes.js";
import cadminMasterMedicinesRoutes from "./src/modules/cadmin/master-medicines/cadminMasterMedicines.routes.js";
import cadminRolesRoutes from "./src/modules/cadmin/roles/cadminRoles.routes.js";

// ── Mobile App Routes ──────────────────────────────────────────
import mobileAuthRoutes from "./src/modules/mobile/auth/mobile.auth.routes.js";
import mobileUsersRoutes from "./src/modules/mobile/users/mobile.users.routes.js";
import mobileMedicinesRoutes from "./src/modules/mobile/medicines/mobile.medicines.routes.js";
import mobileShopsRoutes from "./src/modules/mobile/shops/mobile.shops.routes.js"; 

// ============================================
// APP SETUP
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.USER_FRONTEND_ORIGIN || "http://localhost:5173",
  process.env.ADMIN_FRONTEND_ORIGIN || "http://localhost:5174",
  process.env.LANDING_FRONTEND_ORIGIN || "http://localhost:5175",
].filter(Boolean);

// Shared CORS options — single source of truth
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  exposedHeaders: ["X-Maintenance-Mode"],
};

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// 1. Helmet first (security headers)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// 2. Preflight — must be before cors() middleware and everything else.
//    Handles OPTIONS requests for ALL routes immediately with correct headers.
//    Without this, preflight hits rate limiters / other middleware first.
app.options("/{*path}", cors(corsOptions));

// 3. CORS for all actual requests
app.use(cors(corsOptions));

// 4. Body parsing + cookies
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ============================================
// MAINTENANCE + RATE LIMITING
// ============================================
// ORDER MATTERS. Express applies middleware top-to-bottom.
// Routes mounted before globalLimiter are excluded from it.
//
// Exclusion order:
//   1. maintenanceMiddleware     — always first, checks MAINTENANCE_MODE env
//   2. /api/maintenance          — app startup check, must never be rate limited
//   3. /api/notifications/stream — SSE persistent connection, not a repeated
//                                  request. Limiting it would disconnect users.
//   4. Relaxed limits            — system-driven polling routes declared before
//                                  globalLimiter so they get their own bucket
//   5. globalLimiter             — catches everything else under /api/*
//   6. cadminLimiter             — catches everything under /cadmin/*
//
// OPTIONS requests are already fully handled above by app.options("*").
// The req.method === "OPTIONS" guards below are kept as a safety net only.
// ============================================

app.use(maintenanceMiddleware);

app.use("/api/maintenance", maintenanceRoutes);

app.use("/api/notifications/stream", (req, res, next) => next());

app.use("/api/notifications/unread-count", relaxedLimiter);
app.use("/api/notifications/recent", relaxedLimiter);
app.use("/api/purchase/returns", relaxedLimiter);

app.use("/api", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return globalLimiter(req, res, next);
});

app.use("/cadmin", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return cadminLimiter(req, res, next);
});

app.use("/mobile", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return mobileLimiter(req, res, next);
});

// ============================================
// FILE SERVING
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

app.use(
  "/static/medicine_images",
  express.static(path.join(__dirname, "static/medicine_images"))
);

// ============================================
// ROUTES
// ============================================
app.use("/api/files", filesRoutes);
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
app.use("/api/notifications", userNotificationRoutes);
app.use("/api/public", publicUnsubscribeRoutes);
app.use("/api/medicine-linking", linkingRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/excel", excelRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/marketplace-listing", listingsRoutes);  

app.use("/cadmin", cadminAuthRoutes);
app.use("/cadmin", cadminRolesRoutes);
app.use("/cadmin", cadminDocsRoutes);
app.use("/cadmin", cadminUserRoutes);
app.use("/cadmin", cadminShopsRoutes);
app.use("/cadmin", cadminPlansRoutes);
app.use("/cadmin", cadminAdminRoutes);
app.use("/cadmin", cadminProfileRoutes);
app.use("/cadmin", cadminTicketsRoutes);
app.use("/cadmin", enquiriesRoutes);
app.use("/cadmin", cadminSubscriptionsRoutes);
app.use("/cadmin", cadminAuditRoutes);
app.use("/cadmin", cadminBroadcastInAppRoutes);
app.use("/cadmin", cadminNotificationRoutes);
app.use("/cadmin", cadminEmailBroadcastRoutes);
app.use("/cadmin", cadminDashboardRoutes);
app.use("/cadmin", cadminMasterMedicinesRoutes);

app.use("/mobile", mobileAuthRoutes);
app.use("/mobile", mobileUsersRoutes);
app.use("/mobile", mobileMedicinesRoutes);
app.use("/mobile", mobileShopsRoutes); 

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

function printStartupBanner(port) {
  const env = process.env.NODE_ENV || "development";
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const lines = [
    "",
    "-----------------------------------------------",
    "  SERVER STARTED",
    "-----------------------------------------------",
    `  Port        : ${port}`,
    `  Environment : ${env}`,
    `  Time (IST)  : ${time}`,
    `  Origins     : ${allowedOrigins.join(", ")}`,
    "-----------------------------------------------",
    "",
  ];

  lines.forEach((line) => process.stdout.write(line + "\n"));
}

(async () => {
  console.log("\n🔍 Checking performance indexes...");
  await ensureIndexes();

  app.listen(PORT, () => {
    printStartupBanner(PORT);
    initializeCronJobs();
  });
})();