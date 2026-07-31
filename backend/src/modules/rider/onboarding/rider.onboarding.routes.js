// backend/src/modules/rider/onboarding/rider.onboarding.routes.js

import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import { createUploader, handleMulterError } from "../../../config/multer.js";
import {
  listZones,
  updatePersonalDetails,
  updateBankDetails,
  updateEmergencyContact,
  uploadDocument,
  getDocuments,
  submitOnboarding,
} from "./rider.onboarding.controller.js";

const router = Router();

const documentUpload = createUploader("rider_documents", {
  fieldName:   "file",
  maxFiles:    1,
  maxFileSize: 5 * 1024 * 1024,
});

// All routes require rider auth
router.get("/zones",             riderAuth, listZones);
router.put("/personal-details",  riderAuth, updatePersonalDetails);
router.put("/bank-details",      riderAuth, updateBankDetails);
router.put("/emergency-contact", riderAuth, updateEmergencyContact);
router.get("/documents",         riderAuth, getDocuments);
router.post(
  "/documents/upload",
  riderAuth,
  documentUpload,
  handleMulterError,
  uploadDocument
);
router.post("/submit",           riderAuth, submitOnboarding);

export default router;