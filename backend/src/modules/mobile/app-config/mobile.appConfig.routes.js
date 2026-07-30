// backend/src/modules/mobile/app-config/mobile.appConfig.routes.js
//
// Public mobile routes for app display configuration.
// No auth required — same as /mobile/medicines/categories.
//
// ROUTE:
//   GET /mobile/app-config/marketplace-display
//   Returns top-level category display overrides (images + visibility).

import { Router } from "express";
import { handleGetMarketplaceDisplay } from "./mobile.appConfig.controller.js";

const router = Router();

router.get("/marketplace-display", handleGetMarketplaceDisplay);

export default router;