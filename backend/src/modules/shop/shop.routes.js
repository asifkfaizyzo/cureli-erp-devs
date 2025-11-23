import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { shopInfoSchema, shopGstSchema } from "./shop.schema.js";
import {
  updateShopInfoController,
  updateShopGstController,
} from "./shop.controller.js";

const router = express.Router();

router.patch(
  "/setup/info",
  requireAuth,
  validateBody(shopInfoSchema),
  updateShopInfoController
);

router.patch(
  "/setup/gst",
  requireAuth,
  validateBody(shopGstSchema),
  updateShopGstController
);

export default router;
