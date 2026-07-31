// backend/src/modules/cadmin/delivery/cadminRiders.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  getRiders,
  getRider,
  reviewRiderDocument,
  approveRiderApplication,
  rejectRiderApplication,
  suspendRiderAccount,
  reactivateRiderAccount,
  createRider,
  getZones,
  addZone,
  editZone,
} from "./cadminRiders.controller.js";

const router = Router();

// All routes require CAdmin auth
router.use(requireCAdmin);

// Rider management
router.get("/delivery/riders",                         getRiders);
router.post("/delivery/riders",                        createRider);
router.get("/delivery/riders/:riderId",                getRider);
router.post("/delivery/riders/:riderId/approve",       approveRiderApplication);
router.post("/delivery/riders/:riderId/reject",        rejectRiderApplication);
router.post("/delivery/riders/:riderId/suspend",       suspendRiderAccount);
router.post("/delivery/riders/:riderId/reactivate",    reactivateRiderAccount);
router.patch(
  "/delivery/riders/:riderId/documents/:documentId/review",
  reviewRiderDocument
);

// Zone management
router.get("/delivery/zones",          getZones);
router.post("/delivery/zones",         addZone);
router.patch("/delivery/zones/:zoneId", editZone);

export default router;