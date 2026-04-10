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


// // backend/index.js

// import "./env.js";
// import express from "express";

// import cookieParser from "cookie-parser";
// import cors from "cors";
// import helmet from "helmet";
// import path from "path";
// import fs from "fs";
// import { fileURLToPath } from "url";
// import { initializeCronJobs } from "./src/cron/jobs.js";

// // ═══════════════════════════════════════════════════════════
// // MIDDLEWARE IMPORTS
// // ═══════════════════════════════════════════════════════════
// import maintenanceMiddleware from "./src/middleware/maintenance.js";
// import { globalLimiter, authLimiter } from "./src/middleware/rateLimiter.js";
// import publicUnsubscribeRoutes from './src/modules/public/unsubscribe/unsubscribe.routes.js';

// // ═══════════════════════════════════════════════════════════
// // ROUTE IMPORTS - User/Shop
// // ═══════════════════════════════════════════════════════════
// import authRoutes from "./src/modules/auth/auth.routes.js";
// import shopRoutes from "./src/modules/shop/shop.routes.js";
// import pendingRoutes from "./src/modules/pending/pending.routes.js";
// import shopFilesRoutes from "./src/modules/shopFiles/shopFiles.routes.js";
// import subscriptionRoutes from "./src/modules/subscription/subscription.routes.js";
// import plansRoutes from "./src/modules/plans/plans.routes.js";
// import setupRoutes from "./src/modules/setup/setup.routes.js";
// import branchesRoutes from "./src/modules/branches/branches.routes.js";
// import usersRoutes from "./src/modules/users/users.routes.js";
// import profileRoutes from "./src/modules/profile/profile.routes.js";
// import ticketRoutes from "./src/modules/tickets/tickets.routes.js";
// import enquiriesRoutes from "./src/modules/enquiries/enquiries.routes.js";
// import maintenanceRoutes from "./src/modules/maintenance/maintenance.routes.js";
// import userNotificationRoutes from "./src/modules/notifications/user/userNotifications.routes.js";
// import filesRoutes from './src/modules/files/files.routes.js';
// import linkingRoutes from "./src/modules/medicines/linking.routes.js";

// // ═══════════════════════════════════════════════════════════
// // ROUTE IMPORTS - Pharmacy ERP (NEW)
// // ═══════════════════════════════════════════════════════════
// import medicineRoutes from "./src/modules/medicines/medicine.routes.js";
// import supplierRoutes from "./src/modules/suppliers/supplier.routes.js";
// import purchaseRoutes from "./src/modules/purchase/purchase.routes.js";
// import inventoryRoutes from "./src/modules/inventory/inventory.routes.js";
// import salesRoutes from "./src/modules/sales/sales.routes.js";
// import customerRoutes from "./src/modules/customers/customer.routes.js";
// import excelRoutes from "./src/modules/excel/excel.routes.js";

// // ═══════════════════════════════════════════════════════════
// // ROUTE IMPORTS - CAdmin
// // ═══════════════════════════════════════════════════════════
// import cadminAuthRoutes from "./src/modules/cadmin/auth/cadminAuth.routes.js";
// import cadminDocsRoutes from "./src/modules/cadmin/cadminDocs/cadminDocs.routes.js";
// import cadminUserRoutes from "./src/modules/cadmin/users/cadminUser.routes.js";
// import cadminShopsRoutes from "./src/modules/cadmin/shops/cadminShops.routes.js";
// import cadminPlansRoutes from "./src/modules/cadmin/plans/cadminPlans.routes.js";
// import cadminAdminRoutes from "./src/modules/cadmin/admins/cadminAdmin.routes.js";
// import cadminProfileRoutes from "./src/modules/cadmin/profile/cadminProfile.routes.js";
// import cadminTicketsRoutes from "./src/modules/cadmin/tickets/cadminTickets.routes.js";
// import cadminSubscriptionsRoutes from "./src/modules/cadmin/subscriptions/cadminSubscriptions.routes.js";
// import cadminAuditRoutes from "./src/modules/cadmin/audit/cadminAudit.routes.js";
// import cadminBroadcastInAppRoutes from "./src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.routes.js";
// import cadminNotificationRoutes from "./src/modules/notifications/cadmin/cadminNotifications.routes.js";
// import cadminEmailBroadcastRoutes from './src/modules/cadmin/broadcast/email/cadminEmailBroadcast.routes.js';
// import cadminDashboardRoutes from "./src/modules/cadmin/dashboard/cadminDashboard.routes.js";
// import cadminMasterMedicinesRoutes from "./src/modules/cadmin/master-medicines/cadminMasterMedicines.routes.js";

// // ═══════════════════════════════════════════════════════════
// // APP SETUP
// // ═══════════════════════════════════════════════════════════
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// const allowedOrigins = [
//   process.env.USER_FRONTEND_ORIGIN || "http://localhost:5173",
//   process.env.ADMIN_FRONTEND_ORIGIN || "http://localhost:5174",
//   process.env.LANDING_FRONTEND_ORIGIN || "http://localhost:5175",
// ].filter(Boolean);

// // ============================================
// // CORS - Must be before other middleware
// // ============================================
// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//     exposedHeaders: ["X-Maintenance-Mode"],
//   })
// );

// // ============================================
// // Helmet - Security headers (Modified for static assets)
// // ============================================
// app.use(
//   helmet({
//     crossOriginResourcePolicy: false, // Allow cross-origin resource loading
//     crossOriginEmbedderPolicy: false,
//     contentSecurityPolicy: false, // Disable CSP for images to work in emails
//   })
// );

// // ============================================
// // Body Parsing Middleware
// // ============================================
// app.use(express.json({ limit: "1mb" }));
// app.use(cookieParser());

// // ════════════════════════════════════════════════════════════
// // ✅ STATIC ASSETS - MUST BE BEFORE MAINTENANCE MIDDLEWARE
// // This section serves public assets like email logos
// // ════════════════════════════════════════════════════════════

// // Direct logo endpoint (for testing/debugging)
// app.get("/logo-white.png", (req, res) => {
//   const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'cureli-logo-white.png');
//   if (fs.existsSync(logoPath)) {
//     res.setHeader('Content-Type', 'image/png');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cache-Control', 'public, max-age=31536000');
//     res.sendFile(logoPath);
//   } else {
//     res.status(404).json({ error: 'Logo not found', path: logoPath });
//   }
// });

// app.get("/logo-dark.png", (req, res) => {
//   const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'cureli-logo-dark.png');
//   if (fs.existsSync(logoPath)) {
//     res.setHeader('Content-Type', 'image/png');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cache-Control', 'public, max-age=31536000');
//     res.sendFile(logoPath);
//   } else {
//     res.status(404).json({ error: 'Logo not found', path: logoPath });
//   }
// });

// // Serve static assets from public/assets folder
// app.use('/assets', (req, res, next) => {
//   // Log requests for debugging
//   console.log(`[ASSETS] ${req.method} ${req.path}`);
  
//   // Set headers for email client compatibility
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
//   res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  
//   next();
// });

// app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), {
//   index: false,
//   setHeaders: (res, filePath) => {
//     const ext = path.extname(filePath).toLowerCase();
    
//     // Set correct MIME types
//     const mimeTypes = {
//       '.png': 'image/png',
//       '.jpg': 'image/jpeg',
//       '.jpeg': 'image/jpeg',
//       '.gif': 'image/gif',
//       '.webp': 'image/webp',
//       '.svg': 'image/svg+xml',
//       '.ico': 'image/x-icon',
//     };
    
//     if (mimeTypes[ext]) {
//       res.setHeader('Content-Type', mimeTypes[ext]);
//     }
    
//     res.setHeader('Content-Disposition', 'inline');
//   },
// }));

// // Debug endpoint to check paths
// app.get("/api/debug/assets", (req, res) => {
//   const publicPath = path.join(__dirname, 'public', 'assets', 'images');
//   let files = [];
//   let exists = false;
  
//   try {
//     exists = fs.existsSync(publicPath);
//     if (exists) {
//       files = fs.readdirSync(publicPath);
//     }
//   } catch (e) {
//     // Folder doesn't exist
//   }
  
//   const logoWhitePath = path.join(publicPath, 'cureli-logo-white.png');
//   const logoDarkPath = path.join(publicPath, 'cureli-logo-dark.png');
  
//   res.json({
//     __dirname,
//     publicAssetsPath: publicPath,
//     folderExists: exists,
//     files,
//     logos: {
//       white: {
//         path: logoWhitePath,
//         exists: fs.existsSync(logoWhitePath),
//         url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/assets/images/cureli-logo-white.png`,
//         directUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/logo-white.png`,
//       },
//       dark: {
//         path: logoDarkPath,
//         exists: fs.existsSync(logoDarkPath),
//         url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/assets/images/cureli-logo-dark.png`,
//         directUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/logo-dark.png`,
//       },
//     },
//   });
// });

// // Logo test page with visual preview
// app.get("/api/test/logo-preview", async (req, res) => {
//   const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  
//   // Try different URL patterns
//   const urls = {
//     direct: `${backendUrl}/logo-white.png`,
//     assets: `${backendUrl}/assets/images/cureli-logo-white.png`,
//   };
  
//   res.send(`
// <!DOCTYPE html>
// <html>
// <head>
//   <title>Logo Test - Cureli Health</title>
//   <style>
//     body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
//     .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 800px; margin-left: auto; margin-right: auto; }
//     h1 { color: #05015A; margin: 0 0 10px; }
//     .logo-box { padding: 30px; border-radius: 8px; text-align: center; margin: 10px 0; }
//     .logo-box.dark { background: #05015A; }
//     .logo-box.light { background: #f0f0f0; border: 1px solid #ddd; }
//     .logo-box img { max-width: 150px; height: auto; }
//     .url { font-family: monospace; font-size: 12px; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; word-break: break-all; margin: 5px 0; }
//     .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
//     .status.success { background: #d1fae5; color: #065f46; }
//     .status.error { background: #fee2e2; color: #991b1b; }
//     .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
//     @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
//   </style>
// </head>
// <body>
//   <div class="card">
//     <h1>📧 Email Logo Test</h1>
//     <p>Testing if logos are accessible for email templates</p>
//   </div>
  
//   <div class="card">
//     <h2>Method 1: Direct URL (Recommended)</h2>
//     <div class="url">${urls.direct}</div>
//     <div class="logo-box dark">
//       <img src="${urls.direct}" alt="Logo" onerror="this.parentElement.innerHTML='<span class=\\'status error\\'>❌ FAILED</span>'" onload="this.parentElement.querySelector('.status')?.remove()">
//       <span class="status success" style="display:block;margin-top:10px;">Loading...</span>
//     </div>
//   </div>
  
//   <div class="card">
//     <h2>Method 2: Static Assets URL</h2>
//     <div class="url">${urls.assets}</div>
//     <div class="logo-box dark">
//       <img src="${urls.assets}" alt="Logo" onerror="this.parentElement.innerHTML='<span class=\\'status error\\'>❌ FAILED</span>'" onload="this.parentElement.querySelector('.status')?.remove()">
//       <span class="status success" style="display:block;margin-top:10px;">Loading...</span>
//     </div>
//   </div>
  
//   <div class="card">
//     <h2>Both Logos Preview</h2>
//     <div class="grid">
//       <div>
//         <p><strong>White Logo (for dark backgrounds)</strong></p>
//         <div class="logo-box dark">
//           <img src="${backendUrl}/logo-white.png" alt="White Logo" onerror="this.style.display='none'">
//         </div>
//       </div>
//       <div>
//         <p><strong>Dark Logo (for light backgrounds)</strong></p>
//         <div class="logo-box light">
//           <img src="${backendUrl}/logo-dark.png" alt="Dark Logo" onerror="this.style.display='none'">
//         </div>
//       </div>
//     </div>
//   </div>
  
//   <div class="card">
//     <h2>Debug Info</h2>
//     <p><strong>Backend URL:</strong> <code>${backendUrl}</code></p>
//     <p><a href="/api/debug/assets" target="_blank">View Full Debug Info →</a></p>
//   </div>
  
//   <script>
//     document.querySelectorAll('img').forEach(img => {
//       img.onload = function() {
//         const status = this.parentElement.querySelector('.status');
//         if (status) {
//           status.textContent = '✅ LOADED';
//           status.className = 'status success';
//         }
//       };
//       img.onerror = function() {
//         const status = this.parentElement.querySelector('.status');
//         if (status) {
//           status.textContent = '❌ FAILED';
//           status.className = 'status error';
//         }
//       };
//     });
//   </script>
// </body>
// </html>
//   `);
// });

// // ============================================
// // MAINTENANCE MODE MIDDLEWARE
// // ============================================
// app.use(maintenanceMiddleware);
// app.use("/api", globalLimiter);
// app.use("/cadmin", globalLimiter);

// // ============================================
// // Static Files - Uploads (PDFs, Images, etc.)
// // ============================================
// app.use(
//   "/uploads",
//   (req, res, next) => {
//     const origin = req.headers.origin;
//     if (allowedOrigins.includes(origin)) {
//       res.setHeader("Access-Control-Allow-Origin", origin);
//       res.setHeader("Access-Control-Allow-Credentials", "true");
//     }
//     res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
//     res.removeHeader("X-Frame-Options");
//     next();
//   },
//   express.static(path.join(__dirname, "uploads"), {
//     setHeaders: (res, filePath) => {
//       const ext = path.extname(filePath).toLowerCase();
//       if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf"].includes(ext)) {
//         res.setHeader("Content-Disposition", "inline");
//       }
//       if (ext === ".pdf") {
//         res.setHeader("Content-Type", "application/pdf");
//         res.setHeader("Accept-Ranges", "bytes");
//       }
//     },
//   })
// );

// // ============================================
// // Static Files - Master Medicine Images
// // ============================================
// app.use(
//   '/static/medicine_images',
//   (req, res, next) => {
//     const origin = req.headers.origin;
//     if (allowedOrigins.includes(origin)) {
//       res.setHeader("Access-Control-Allow-Origin", origin);
//       res.setHeader("Access-Control-Allow-Credentials", "true");
//     }
//     res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
//     next();
//   },
//   express.static(path.join(__dirname, 'static/medicine_images'), {
//     setHeaders: (res, filePath) => {
//       const ext = path.extname(filePath).toLowerCase();
//       if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
//         res.setHeader("Content-Disposition", "inline");
//         res.setHeader("Cache-Control", "public, max-age=86400");
//       }
//     },
//   })
// );

// // ============================================
// // Logo Test JSON Endpoint
// // ============================================
// app.get("/api/test/logo", (req, res) => {
//   const logoWhitePath = path.join(__dirname, 'public', 'assets', 'images', 'cureli-logo-white.png');
//   const logoDarkPath = path.join(__dirname, 'public', 'assets', 'images', 'cureli-logo-dark.png');
  
//   const logoWhiteExists = fs.existsSync(logoWhitePath);
//   const logoDarkExists = fs.existsSync(logoDarkPath);
  
//   const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
//   res.json({
//     success: true,
//     files: {
//       white: { exists: logoWhiteExists, path: logoWhitePath },
//       dark: { exists: logoDarkExists, path: logoDarkPath },
//     },
//     urls: {
//       white: {
//         direct: `${backendUrl}/logo-white.png`,
//         static: `${backendUrl}/assets/images/cureli-logo-white.png`,
//       },
//       dark: {
//         direct: `${backendUrl}/logo-dark.png`,
//         static: `${backendUrl}/assets/images/cureli-logo-dark.png`,
//       },
//     },
//     testPage: `${backendUrl}/api/test/logo-preview`,
//     instructions: [
//       "1. Visit the test page URL above",
//       "2. Check if logos load correctly",
//       "3. If logos load, update email.config.js to use the working URL",
//     ],
//   });
// });

// app.use('/api/files', filesRoutes);

// // ============================================
// // PDF Proxy Endpoint
// // ============================================
// app.get("/api/pdf/:folder/:filename", (req, res) => {
//   const { folder, filename } = req.params;
//   const filePath = path.join(__dirname, "uploads", folder, filename);

//   const resolvedPath = path.resolve(filePath);
//   const uploadsDir = path.resolve(path.join(__dirname, "uploads"));

//   if (!resolvedPath.startsWith(uploadsDir)) {
//     return res.status(403).json({ success: false, message: "Access denied" });
//   }

//   if (!fs.existsSync(resolvedPath)) {
//     return res.status(404).json({ success: false, message: "File not found" });
//   }

//   const stat = fs.statSync(resolvedPath);
//   const origin = req.headers.origin;

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Length", stat.size);
//   res.setHeader("Content-Disposition", "inline");
//   res.setHeader("Accept-Ranges", "bytes");
//   res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

//   if (allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     res.setHeader("Access-Control-Allow-Credentials", "true");
//   }

//   const readStream = fs.createReadStream(resolvedPath);
//   readStream.pipe(res);
// });

// // ============================================
// // Download Endpoint
// // ============================================
// app.get("/api/download/:folder/:filename", (req, res) => {
//   const { folder, filename } = req.params;
//   const filePath = path.join(__dirname, "uploads", folder, filename);

//   const resolvedPath = path.resolve(filePath);
//   const uploadsDir = path.resolve(path.join(__dirname, "uploads"));

//   if (!resolvedPath.startsWith(uploadsDir)) {
//     return res.status(403).json({ success: false, message: "Access denied" });
//   }

//   if (!fs.existsSync(resolvedPath)) {
//     return res.status(404).json({ success: false, message: "File not found" });
//   }

//   const downloadName = req.query.name || filename;
//   res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadName)}"`);
//   res.sendFile(resolvedPath);
// });

// // ============================================
// // Health Check (Always accessible)
// // ============================================
// app.get("/api/health", (_req, res) => {
//   res.json({
//     ok: true,
//     maintenance_mode: process.env.MAINTENANCE_MODE?.toLowerCase() === "true",
//   });
// });

// // ============================================
// // Maintenance Status (Always accessible)
// // ============================================
// app.use("/api/maintenance", maintenanceRoutes);

// // ============================================
// // API Routes - User/Shop
// // ============================================
// app.use("/api/auth", authRoutes);
// app.use("/api/shop", shopRoutes);
// app.use("/api/pending", pendingRoutes);
// app.use("/api/shop/files", shopFilesRoutes);
// app.use("/api/subscriptions", subscriptionRoutes);
// app.use("/api/plans", plansRoutes);
// app.use("/api/setup", setupRoutes);
// app.use("/api/branches", branchesRoutes);
// app.use("/api/users", usersRoutes);
// app.use("/api/tickets", ticketRoutes);
// app.use("/api/profile", profileRoutes);
// app.use("/api/enquiries", enquiriesRoutes);
// app.use('/api/notifications', userNotificationRoutes);
// app.use('/api/public', publicUnsubscribeRoutes);

// // ============================================
// // API Routes - Pharmacy ERP
// // ============================================
// app.use("/api/medicines", medicineRoutes);
// app.use("/api/medicines/linking", linkingRoutes);
// app.use("/api/suppliers", supplierRoutes);
// app.use("/api/purchase", purchaseRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/sales", salesRoutes);
// app.use("/api/customers", customerRoutes);
// app.use("/api/excel", excelRoutes);

// // ============================================
// // API Routes - CAdmin
// // ============================================
// app.use("/cadmin", cadminAuthRoutes);
// app.use("/cadmin", cadminDocsRoutes);
// app.use("/cadmin", cadminUserRoutes);
// app.use("/cadmin", cadminShopsRoutes);
// app.use("/cadmin", cadminPlansRoutes);
// app.use("/cadmin", cadminAdminRoutes);
// app.use("/cadmin", cadminProfileRoutes);
// app.use("/cadmin", cadminTicketsRoutes);
// app.use("/cadmin/enquiries", enquiriesRoutes);
// app.use("/cadmin", cadminSubscriptionsRoutes);
// app.use("/cadmin", cadminAuditRoutes);
// app.use("/cadmin", cadminBroadcastInAppRoutes);  
// app.use("/cadmin", cadminNotificationRoutes);
// app.use('/cadmin', cadminEmailBroadcastRoutes);
// app.use('/cadmin', cadminDashboardRoutes);
// app.use('/cadmin', cadminMasterMedicinesRoutes);

// // ============================================
// // 404 Handler
// // ============================================
// app.use((req, res) => {
//   res.status(404).json({ success: false, message: "Route not found" });
// });

// // ============================================
// // Error Handler
// // ============================================
// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err);
//   res.status(500).json({ success: false, message: "Internal server error" });
// });

// // ============================================
// // STATIC FILE SERVING (for email attachments)
// // ============================================
// app.use(
//   '/uploads/email_attachments',
//   express.static(path.join(process.cwd(), 'uploads/email_attachments'))
// );

// // ============================================
// // Start Server
// // ============================================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`\n${'═'.repeat(60)}`);
//   console.log(`✅ Server running on port ${PORT}`);
//   console.log(`${'═'.repeat(60)}`);
//   console.log(`📁 Static files: ${path.join(__dirname, "uploads")}`);
//   console.log(`🖼️  Email assets: ${path.join(__dirname, "public", "assets")}`);
//   console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
//   console.log(`🔧 Maintenance mode: ${process.env.MAINTENANCE_MODE?.toLowerCase() === "true" ? "ON" : "OFF"}`);
  
//   // Check if logo files exist
//   const logoWhitePath = path.join(__dirname, 'public', 'assets', 'images', 'cureli-logo-white.png');
//   const logoDarkPath = path.join(__dirname, 'public', 'assets', 'images', 'cureli-logo-dark.png');
  
//   const logoWhiteExists = fs.existsSync(logoWhitePath);
//   const logoDarkExists = fs.existsSync(logoDarkPath);
  
//   console.log(`\n📧 Email Logo Status:`);
//   console.log(`   White Logo (PNG): ${logoWhiteExists ? '✅ Found' : '❌ Missing'}`);
//   console.log(`   Dark Logo (PNG):  ${logoDarkExists ? '✅ Found' : '❌ Missing'}`);
  
//   const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  
//   console.log(`\n🔗 Logo URLs:`);
//   console.log(`   Direct URL: ${backendUrl}/logo-white.png`);
//   console.log(`   Static URL: ${backendUrl}/assets/images/cureli-logo-white.png`);
  
//   console.log(`\n🧪 Test URLs:`);
//   console.log(`   Logo JSON: ${backendUrl}/api/test/logo`);
//   console.log(`   Logo Preview: ${backendUrl}/api/test/logo-preview`);
//   console.log(`   Debug Info: ${backendUrl}/api/debug/assets`);
//   console.log(`${'═'.repeat(60)}\n`);
  
//   // Initialize cron jobs
//   initializeCronJobs();
// });