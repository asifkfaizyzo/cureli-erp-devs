// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\index.js

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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

import cadminAuthRoutes from "./src/modules/cadmin/auth/cadminAuth.routes.js";
import cadminDocsRoutes from "./src/modules/cadmin/cadminDocs/cadminDocs.routes.js";
import cadminUserRoutes from "./src/modules/cadmin/users/cadminUser.routes.js";
import cadminShopsRoutes from "./src/modules/cadmin/shops/cadminShops.routes.js";
import cadminPlansRoutes from "./src/modules/cadmin/plans/cadminPlans.routes.js";
import cadminAdminRoutes from "./src/modules/cadmin/admins/cadminAdmin.routes.js";
import cadminProfileRoutes from "./src/modules/cadmin/profile/cadminProfile.routes.js";
import cadminTicketsRoutes from "./src/modules/cadmin/tickets/cadminTickets.routes.js";


// Add to API Routes section (after subscription routes)
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
  })
);

// ============================================
// Helmet - Updated CSP for PDF viewing
// ============================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false, // Allow embedding resources
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", ...allowedOrigins],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // For PDF.js
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", ...allowedOrigins],
        frameSrc: ["'self'", "blob:", "data:"],
        frameAncestors: ["'self'", ...allowedOrigins], // Allow framing from frontends
        workerSrc: ["'self'", "blob:"], // For PDF.js web workers
        objectSrc: ["'self'", "blob:", "data:"], // For PDF object/embed
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
    
    // ✅ Allow embedding in iframes from allowed origins
    res.setHeader("X-Frame-Options", `ALLOW-FROM ${origin || allowedOrigins[0]}`);
    res.removeHeader("X-Frame-Options"); // Remove X-Frame-Options, use CSP instead
    
    next();
  },
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf"].includes(ext)) {
        res.setHeader("Content-Disposition", "inline");
      }
      // ✅ Special headers for PDFs
      if (ext === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Accept-Ranges", "bytes");
      }
    },
  })
);

// ============================================
// PDF Proxy Endpoint - Streams PDF with correct headers
// ============================================
app.get("/api/pdf/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, "uploads", folder, filename);

  // Security: Prevent directory traversal
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

  // Set all necessary headers for PDF viewing
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Stream the file
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
// ============================================
// API Routes - CAdmin
// ============================================
app.use("/cadmin", cadminAuthRoutes);
app.use("/cadmin", cadminDocsRoutes);
app.use("/cadmin", cadminUserRoutes);
app.use("/cadmin", cadminShopsRoutes);
app.use("/cadmin", cadminPlansRoutes);
app.use("/cadmin",cadminAdminRoutes);
app.use("/cadmin", cadminProfileRoutes);
app.use("/cadmin/tickets", cadminTicketsRoutes);
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
  initializeCronJobs();
});