// backend/src/modules/cadmin/tickets/cadminTickets.routes.js

import { Router } from "express";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import {requireCAdmin} from "../../../middleware/requireCAdmin.js";

import {
  getAllTicketsController,
  getTicketStatsController,
  getTicketByIdController,
  updateTicketStatusController,
  addAdminNoteController,
} from "./cadminTickets.controller.js";

import {
  getTicketsQuerySchema,
  updateTicketStatusSchema,
  addAdminNoteSchema,
} from "./cadminTickets.schema.js";

const router = Router();

// All routes require CAdmin authentication
router.use(requireCAdmin);

/**
 * GET /cadmin/tickets/stats
 * Get ticket statistics (must be before /:ticket_id)
 */
router.get("/stats", getTicketStatsController);

/**
 * GET /cadmin/tickets
 * List all tickets from all shops with filtering
 */
router.get("/", validateQuery(getTicketsQuerySchema), getAllTicketsController);

/**
 * GET /cadmin/tickets/:ticket_id
 * Get single ticket details
 */
router.get("/:ticket_id", getTicketByIdController);

/**
 * PATCH /cadmin/tickets/:ticket_id/status
 * Update ticket status
 */
router.patch(
  "/:ticket_id/status",
  validateBody(updateTicketStatusSchema),
  updateTicketStatusController
);

/**
 * POST /cadmin/tickets/:ticket_id/notes
 * Add admin note to ticket
 */
router.post(
  "/:ticket_id/notes",
  validateBody(addAdminNoteSchema),
  addAdminNoteController
);

export default router;
