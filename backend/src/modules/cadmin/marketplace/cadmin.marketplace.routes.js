// backend/src/modules/cadmin/marketplace/cadmin.marketplace.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  listShops,
  getShop,
  blockShop,
  blockBranch,
  updateBranchConfig,
  listUsers,
  getUser,
  blockUser,
  searchPlaces,
  getPlaceDetails,
} from "./cadmin.marketplace.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// ─────────────────────────────────────────────
// PLACES PROXY
// Must be declared before /:shop_id routes
// to avoid param conflicts
// ─────────────────────────────────────────────
router.get("/marketplace/places/search", searchPlaces);
router.get("/marketplace/places/details", getPlaceDetails);

// ─────────────────────────────────────────────
// SHOPS
// GET    /cadmin/marketplace/shops
// GET    /cadmin/marketplace/shops/:shop_id
// PATCH  /cadmin/marketplace/shops/:shop_id/block
// PATCH  /cadmin/marketplace/shops/:shop_id/branches/:branch_id/block
// PATCH  /cadmin/marketplace/shops/:shop_id/branches/:branch_id/config
// ─────────────────────────────────────────────
router.get("/marketplace/shops", listShops);
router.get("/marketplace/shops/:shop_id", getShop);
router.patch("/marketplace/shops/:shop_id/block", blockShop);
router.patch(
  "/marketplace/shops/:shop_id/branches/:branch_id/block",
  blockBranch
);
router.patch(
  "/marketplace/shops/:shop_id/branches/:branch_id/config",
  updateBranchConfig
);

// ─────────────────────────────────────────────
// MOBILE USERS
// GET    /cadmin/marketplace/users
// GET    /cadmin/marketplace/users/:user_id
// PATCH  /cadmin/marketplace/users/:user_id/block
// ─────────────────────────────────────────────
router.get("/marketplace/users", listUsers);
router.get("/marketplace/users/:user_id", getUser);
router.patch("/marketplace/users/:user_id/block", blockUser);

export default router;