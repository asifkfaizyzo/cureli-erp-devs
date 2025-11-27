import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./src/modules/auth/auth.routes.js";
import shopRoutes from "./src/modules/shop/shop.routes.js";
import adminRoutes from "./src/modules/admin/admin.routes.js";
import pendingRoutes from "./src/modules/pending/pending.routes.js";
import shopFilesRoutes from "./src/modules/shopFiles/shopFiles.routes.js";
import subscriptionRoutes from "./src/modules/subscription/subscription.routes.js";
import plansRoutes from "./src/modules/plans/plans.routes.js";

import { initializeCronJobs } from "./src/cron/jobs.js";

const app = express();
const allowedOrigins = [
  process.env.USER_FRONTEND_ORIGIN || "http://localhost:5173",
  process.env.ADMIN_FRONTEND_ORIGIN || "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/pending", pendingRoutes);
app.use("/api/shop/files", shopFilesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/plans", plansRoutes);

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);

  // ✅ Initialize cron jobs after server starts
  initializeCronJobs();
});
