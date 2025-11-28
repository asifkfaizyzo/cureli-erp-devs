import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { validateBody } from "../../../middleware/validate.js";
import {
  listFilesController,
  getFileController,
  verifyFileController,
  rejectFileController,
} from "./cadminDocs.controller.js";
import { rejectSchema } from "./cadminDocs.schema.js";

const router = express.Router();

router.use(requireCAdmin);

// List files with filters
router.get("/files", listFilesController);

// Single file + logs
router.get("/files/:file_id", getFileController);

// Admin actions
router.patch("/files/:file_id/verify", verifyFileController);
router.patch("/files/:file_id/reject", validateBody(rejectSchema), rejectFileController);

export default router;
