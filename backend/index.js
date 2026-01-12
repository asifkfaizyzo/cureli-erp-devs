// backend/index.js

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE IMPORTS
// ═══════════════════════════════════════════════════════════
import maintenanceMiddleware from "./src/middleware/maintenance.js";

// Route imports
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

import cadminAuthRoutes from "./src/modules/cadmin/auth/cadminAuth.routes.js";
import cadminDocsRoutes from "./src/modules/cadmin/cadminDocs/cadminDocs.routes.js";
import cadminUserRoutes from "./src/modules/cadmin/users/cadminUser.routes.js";
import cadminShopsRoutes from "./src/modules/cadmin/shops/cadminShops.routes.js";
import cadminPlansRoutes from "./src/modules/cadmin/plans/cadminPlans.routes.js";
import cadminAdminRoutes from "./src/modules/cadmin/admins/cadminAdmin.routes.js";
import cadminProfileRoutes from "./src/modules/cadmin/profile/cadminProfile.routes.js";
import cadminTicketsRoutes from "./src/modules/cadmin/tickets/cadminTickets.routes.js";
import cadminSubscriptionsRoutes from "./src/modules/cadmin/subscriptions/cadminSubscriptions.routes.js";
import { initializeCronJobs } from "./src/cron/jobs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  process.env.USER_FRONTEND_ORIGIN || "http://localhost:5173",
  process.env.ADMIN_FRONTEND_ORIGIN || "http://localhost:5174",
].filter(Boolean);

// ============================================
// CORS - Must be before other middleware
// ============================================
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ["X-Maintenance-Mode"], // Expose custom header
  })
);

// ============================================
// Helmet - Security headers
// ============================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", ...allowedOrigins],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", ...allowedOrigins],
        frameSrc: ["'self'", "blob:", "data:"],
        frameAncestors: ["'self'", ...allowedOrigins],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'self'", "blob:", "data:"],
      },
    },
  })
);

// ============================================
// Body Parsing Middleware
// ============================================
app.use(express.json());
app.use(cookieParser());

// ============================================
// MAINTENANCE MODE MIDDLEWARE
// Must be AFTER body parsing, BEFORE routes
// ============================================
app.use(maintenanceMiddleware);

// ============================================
// Static Files - With proper headers for PDFs
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
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf"].includes(ext)) {
        res.setHeader("Content-Disposition", "inline");
      }
      if (ext === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Accept-Ranges", "bytes");
      }
    },
  })
);

// ============================================
// PDF Proxy Endpoint
// ============================================
app.get("/api/pdf/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, "uploads", folder, filename);

  const resolvedPath = path.resolve(filePath);
  const uploadsDir = path.resolve(path.join(__dirname, "uploads"));

  if (!resolvedPath.startsWith(uploadsDir)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  const stat = fs.statSync(resolvedPath);
  const origin = req.headers.origin;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  const readStream = fs.createReadStream(resolvedPath);
  readStream.pipe(res);
});

// ============================================
// Download Endpoint
// ============================================
app.get("/api/download/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, "uploads", folder, filename);

  const resolvedPath = path.resolve(filePath);
  const uploadsDir = path.resolve(path.join(__dirname, "uploads"));

  if (!resolvedPath.startsWith(uploadsDir)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  const downloadName = req.query.name || filename;
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadName)}"`);
  res.sendFile(resolvedPath);
});

// ============================================
// Health Check (Always accessible)
// ============================================
app.get("/api/health", (_req, res) => {
  res.json({ 
    ok: true,
    maintenance_mode: process.env.MAINTENANCE_MODE?.toLowerCase() === "true",
  });
});

// ============================================
// Maintenance Status (Always accessible)
// ============================================
app.use("/api/maintenance", maintenanceRoutes);

// ============================================
// API Routes - User
// ============================================
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

// ============================================
// API Routes - CAdmin (Always accessible)
// ============================================
app.use("/cadmin", cadminAuthRoutes);
app.use("/cadmin", cadminDocsRoutes);
app.use("/cadmin", cadminUserRoutes);
app.use("/cadmin", cadminShopsRoutes);
app.use("/cadmin", cadminPlansRoutes);
app.use("/cadmin", cadminAdminRoutes);
app.use("/cadmin", cadminProfileRoutes);
app.use("/cadmin/tickets", cadminTicketsRoutes);
app.use("/cadmin/enquiries", enquiriesRoutes);
app.use("/cadmin", cadminSubscriptionsRoutes);
// ============================================
// Health Check
// ============================================
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Static files: ${path.join(__dirname, "uploads")}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`🔧 Maintenance mode: ${process.env.MAINTENANCE_MODE?.toLowerCase() === "true" ? "ON" : "OFF"}`);
  initializeCronJobs();
});