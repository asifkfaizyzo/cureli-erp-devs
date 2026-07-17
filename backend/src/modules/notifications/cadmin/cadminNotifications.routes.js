// backend/src/modules/notifications/cadmin/cadminNotifications.routes.js

import { Router } from "express";
import jwt from "jsonwebtoken";
import * as controller from "./cadminNotifications.controller.js";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { validate } from "../../../middleware/validate.js";
import {
  ADMIN_ACCESS_SECRET,
  ADMIN_REFRESH_SECRET,
} from "../../../config/cadmin_jwt.js";
import prisma from "../../../config/prisma.js";
import * as schema from "./cadminNotifications.schema.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// SSE Stream Route
// Uses the REFRESH token (7d) instead of access token (15m)
// so the stream stays alive for the whole session
// ─────────────────────────────────────────────────────────────────────────────

router.get("/notifications/stream", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  try {
    // ── Try refresh token first (long-lived, preferred for SSE) ──
    let payload;
    let tokenValid = false;

    try {
      payload = jwt.verify(token, ADMIN_REFRESH_SECRET); // 7d
      tokenValid = true;
    } catch (refreshErr) {
      // Fallback: try access token (handles existing connections mid-migration)
      try {
        payload = jwt.verify(token, ADMIN_ACCESS_SECRET); // 15m
        tokenValid = true;
      } catch (accessErr) {
        // Both failed
        tokenValid = false;
      }
    }

    if (!tokenValid || !payload?.cadmin_id) {
      return res.status(401).end();
    }

    // Verify the CAdmin account is active
    const admin = await prisma.cAdmin.findUnique({
      where: { cadmin_id: payload.cadmin_id },
      select: { is_active: true },
    });

    if (!admin || !admin.is_active) return res.status(403).end();

    const cadminId = payload.cadmin_id;

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": req.headers.origin || "*",
    });

    // Track this connection
    const clients = sseClients;
    if (!clients.has(cadminId)) clients.set(cadminId, new Set());
    clients.get(cadminId).add(res);

    // Send initial connected event with unread count
    const unreadCount = await prisma.notification.count({
      where: { cadmin_id: cadminId, is_read: false },
    });
    res.write(
      `event: connected\ndata: ${JSON.stringify({ unread_count: unreadCount })}\n\n`,
    );

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      const set = clients.get(cadminId);
      if (set) {
        set.delete(res);
        if (set.size === 0) clients.delete(cadminId);
      }
    });
  } catch (err) {
    console.error("[SSE] Stream error:", err);
    return res.status(401).end();
  }
});

// Simple in-memory client map (replaces the incomplete sse.service.js)
const sseClients = new Map(); // Map<cadminId, Set<Response>>

// ─────────────────────────────────────────────────────────────────────────────
// Protected Routes
// ─────────────────────────────────────────────────────────────────────────────

router.use(requireCAdmin);

router.get(
  "/notifications/",
  validate(schema.listNotificationsQuerySchema, "query"),
  controller.listNotifications,
);

router.get("/notifications/unread-count", controller.getUnreadCount);

router.get("/notifications/recent", controller.getRecentNotifications);

router.patch(
  "/notifications/read-all",
  validate(schema.markAllAsReadBodySchema, "body"),
  controller.markAllAsRead,
);

router.get(
  "/notifications/:id",
  validate(schema.notificationIdParamSchema, "params"),
  controller.getNotification,
);

router.patch(
  "/notifications/:id/read",
  validate(schema.notificationIdParamSchema, "params"),
  controller.markAsRead,
);

router.delete(
  "/notifications/:id",
  validate(schema.notificationIdParamSchema, "params"),
  controller.deleteNotification,
);

export default router;
