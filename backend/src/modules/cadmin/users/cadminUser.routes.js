
import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {getUsersController,
  getUserByIdController,
  updateUserController,
  toggleUserAccessController,
  resetUserPasswordController,
} from "./cadminUser.controller.js";
import { validateCAdminUsersQuery } from "./cadminUser.schema.js";

const router = express.Router();

// GET  /cadmin/users
router.get("/users", requireCAdmin, getUsersController);

// GET /cadmin/users/:id
router.get("/users/:id", requireCAdmin, getUserByIdController);

// PATCH /cadmin/users/:id  -> update allowed fields (first_name, last_name, username, role)
router.patch("/users/:id", requireCAdmin, updateUserController);

// PATCH /cadmin/users/:id/access  -> toggle is_active
router.patch("/users/:id/access", requireCAdmin, toggleUserAccessController);

// POST /cadmin/users/:id/reset-password -> send reset link to user's email
router.post("/users/:id/reset-password", requireCAdmin, resetUserPasswordController);

export default router;
