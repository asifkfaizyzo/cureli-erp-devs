import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { shopSetupSchema } from "./shop.schema.js";
import { setupShop } from "./shop.services.js";

const router = express.Router();

router.post("/setup", requireAuth, validateBody(shopSetupSchema), setupShop);

export default router;
