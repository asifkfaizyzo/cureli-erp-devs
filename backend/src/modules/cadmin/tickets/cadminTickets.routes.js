// backend/src/modules/cadmin/tickets/cadminTickets.routes.js

import { Router } from "express";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";

import {
  getAllTicketsController,
  getTicketStatsController,
  getTicketByIdController,
  getTicketHistoryController,
  updateTicketStatusController,
} from "./cadminTickets.controller.js";

import {
  getTicketsQuerySchema,
  updateTicketStatusSchema,
} from "./cadminTickets.schema.js";

const router = Router();

// All routes require CAdmin authentication
router.use(requireCAdmin);

/**
 * GET /cadmin/tickets/stats
 */
router.get("/tickets/stats", getTicketStatsController);

/**
 * GET /cadmin/tickets
 */
router.get("/tickets", validateQuery(getTicketsQuerySchema), getAllTicketsController);

/**
 * GET /cadmin/tickets/:ticket_id
 */
router.get("/tickets/:ticket_id", getTicketByIdController);

/**
 * GET /cadmin/tickets/:ticket_id/history
 */
router.get("/tickets/:ticket_id/history", getTicketHistoryController);

/**
 * PATCH /cadmin/tickets/:ticket_id/status
 */
router.patch(
  "/tickets/:ticket_id/status",
  validateBody(updateTicketStatusSchema),
  updateTicketStatusController
);

export default router;