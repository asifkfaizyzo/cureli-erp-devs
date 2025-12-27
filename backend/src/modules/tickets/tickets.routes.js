// src/modules/tickets/tickets.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";

import {
  createTicketController,
  getTicketsController,
  getTicketController,
  getTicketStatsController,
  cancelTicketController,
  reopenTicketController,
} from "./tickets.controller.js";

import {
  createTicketSchema,
  getTicketsQuerySchema,
  cancelTicketSchema,
  reopenTicketSchema,
} from "./tickets.schema.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// All routes require super_admin or branch_admin role
router.use(requireRole("super_admin", "branch_admin"));

/**
 * GET /api/tickets
 * List tickets with filtering and pagination
 * - SA: sees all shop tickets
 * - BA: sees only their branch tickets
 */
router.get(
  "/",
  validateQuery(getTicketsQuerySchema),
  getTicketsController
);

/**
 * GET /api/tickets/stats
 * Get ticket statistics
 */
router.get("/stats", getTicketStatsController);

/**
 * POST /api/tickets
 * Create a new support ticket
 */
router.post(
  "/",
  validateBody(createTicketSchema),
  createTicketController
);

/**
 * GET /api/tickets/:ticket_id
 * Get single ticket details
 */
router.get("/:ticket_id", getTicketController);

/**
 * POST /api/tickets/:ticket_id/cancel
 * Cancel a ticket
 */
router.post(
  "/:ticket_id/cancel",
  validateBody(cancelTicketSchema),
  cancelTicketController
);

/**
 * POST /api/tickets/:ticket_id/reopen
 * Reopen a cancelled ticket
 */
router.post(
  "/:ticket_id/reopen",
  validateBody(reopenTicketSchema),
  reopenTicketController
);

export default router;