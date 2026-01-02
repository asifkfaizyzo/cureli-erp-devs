// backend/src/modules/tickets/tickets.routes.js

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validateQuery } from "../../middleware/validate.js";
import {
  createTicketController,
  getTicketsController,
  getTicketController,
  getTicketStatsController,
  cancelTicketController,
  reopenTicketController,
} from "./tickets.controller.js";
import { getTicketsQuerySchema } from "./tickets.schema.js";

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("uploads", "tickets");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const sanitizedName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and PDFs are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 3, // Max 3 files
  },
});


router.use(requireAuth);
router.use(requireRole("super_admin", "branch_admin"));



// GET /api/tickets/stats - Must be before /:ticket_id
router.get("/stats", getTicketStatsController);

// GET /api/tickets
router.get("/", validateQuery(getTicketsQuerySchema), getTicketsController);

// POST /api/tickets
router.post("/", upload.array("attachments", 3), createTicketController);

// GET /api/tickets/:ticket_id
router.get("/:ticket_id", getTicketController);

// POST /api/tickets/:ticket_id/cancel
router.post("/:ticket_id/cancel", cancelTicketController);

// POST /api/tickets/:ticket_id/reopen
router.post("/:ticket_id/reopen", reopenTicketController);

export default router;