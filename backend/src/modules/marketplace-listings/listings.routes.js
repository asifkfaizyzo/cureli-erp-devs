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
  listingIdParamSchema,
} from "./listings.schema.js";

const router = Router();

router.use(requireAuth);

// GET /api/marketplace/listings/summary
router.get("/summary", Controller.getBranchSummary);

// GET /api/marketplace/listings/categories
router.get(
  "/categories",
  validate(branchIdQuerySchema, "query"),
  Controller.getCategories
);

// PATCH /api/marketplace/listings/categories
router.patch(
  "/categories",
  requireRole("super_admin", "branch_admin"),
  validate(categoryVisibilitySchema),
  Controller.updateCategoryVisibility
);

// GET /api/marketplace/listings
router.get(
  "/",
  validate(getListingsSchema, "query"),
  Controller.getListings
);

// POST /api/marketplace/listings/sync
router.post(
  "/sync",
  requireRole("super_admin", "branch_admin"),
  validate(branchIdQuerySchema, "query"),
  Controller.syncInventory
);

// POST /api/marketplace/listings/bulk
router.post(
  "/bulk",
  requireRole("super_admin", "branch_admin"),
  validate(bulkUpdateSchema),
  Controller.bulkUpdateListings
);

// GET /api/marketplace/listings/:listing_id/detail
// IMPORTANT: This must come BEFORE /:listing_id PATCH
// to avoid Express matching "detail" as a listing_id param
router.get(
  "/:listing_id/detail",
  validate(listingIdParamSchema, "params"),
  Controller.getListingDetail
);

// PATCH /api/marketplace/listings/:listing_id
router.patch(
  "/:listing_id",
  requireRole("super_admin", "branch_admin"),
  validate(updateListingSchema),
  Controller.updateListing
);

export default router;