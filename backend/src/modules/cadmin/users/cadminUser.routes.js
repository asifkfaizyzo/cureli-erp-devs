import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { getAllUsersController } from "./cadminUser.controller.js";

const router = express.Router();

// Full-list users endpoint
router.get("/users/all", requireCAdmin, getAllUsersController);

export default router;
