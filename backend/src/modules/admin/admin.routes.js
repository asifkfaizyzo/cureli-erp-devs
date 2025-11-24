import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { cleanupUsersController } from "./admin.controller.js";

const router = express.Router();

// Manual cleanup endpoint (for testing/admin use)
router.post("/cleanup-users", requireAuth, cleanupUsersController);

export default router;