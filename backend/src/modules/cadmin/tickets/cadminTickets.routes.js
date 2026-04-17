// backend/src/modules/cadmin/tickets/cadminTickets.routes.js

import { Router } from "express";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
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

router.use(requireCAdmin);

// stats MUST be before /:ticket_id
router.get(
  "/tickets/stats",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_STATS),
  getTicketStatsController
);

router.get(
  "/tickets",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_VIEW),
  validateQuery(getTicketsQuerySchema),
  getAllTicketsController
);

router.get(
  "/tickets/:ticket_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_DETAIL),
  getTicketByIdController
);

router.get(
  "/tickets/:ticket_id/history",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_HISTORY),
  getTicketHistoryController
);

router.patch(
  "/tickets/:ticket_id/status",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_UPDATE_STATUS),
  validateBody(updateTicketStatusSchema),
  updateTicketStatusController
);

export default router;