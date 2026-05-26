// backend/src/modules/marketplace-listings/listings.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import * as Controller from "./listings.controller.js";
import {
  getListingsSchema,
  updateListingSchema,
  bulkUpdateSchema,
  categoryVisibilitySchema,
  branchIdQuerySchema,
} from "./listings.schema.js";

const router = Router();

router.use(requireAuth);

// Summary — all roles
router.get("/listings/summary", Controller.getBranchSummary);

// Categories — all roles can view, branch_admin+ can update
router.get(
  "/listings/categories",
  validate(branchIdQuerySchema, "query"),
  Controller.getCategories
);

router.patch(
  "/listings/categories",
  requireRole("super_admin", "branch_admin"),
  validate(categoryVisibilitySchema),
  Controller.updateCategoryVisibility
);

// Main listings — all roles can view
router.get(
  "/listings",
  validate(getListingsSchema, "query"),
  Controller.getListings
);

// Sync — super_admin and branch_admin only
router.post(
  "/listings/sync",
  requireRole("super_admin", "branch_admin"),
  validate(branchIdQuerySchema, "query"),
  Controller.syncInventory
);

// Bulk update — super_admin and branch_admin only
router.post(
  "/listings/bulk",
  requireRole("super_admin", "branch_admin"),
  validate(bulkUpdateSchema),
  Controller.bulkUpdateListings
);

// Single listing update — super_admin and branch_admin only
router.patch(
  "/listings/:listing_id",
  requireRole("super_admin", "branch_admin"),
  validate(updateListingSchema),
  Controller.updateListing
);

export default router;