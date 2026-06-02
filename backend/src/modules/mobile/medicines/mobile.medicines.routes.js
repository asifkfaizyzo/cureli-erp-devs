// src/modules/mobile/medicines/mobile.medicines.routes.js
//
// PUBLIC mobile medicine discovery routes.
//
// IMPORTANT: Unlike mobile.users.routes.js, this router does NOT apply
// mobileAuth. Medicine discovery is public for the showcase build — a
// logged-out user can browse the catalog. The /mobile mount in index.js
// still applies mobileLimiter at the app level, so these stay rate-limited.
//
// ROUTE ORDERING IS CRITICAL.
// Express matches routes in declaration order. Static paths must be
// declared before dynamic paths that would otherwise capture them.
//
// Correct order:
//   1. /medicines/feed        — static, must be before /:variantId
//   2. /medicines/categories  — static, must be before /:variantId
//   3. /medicines             — no param segment, safe anywhere
//   4. /medicines/:variantId  — dynamic, must be last

import { Router } from "express";
import {
  handleGetFeed,
  handleListMedicines,
  handleListCategories,
  handleGetMedicine,
} from "./mobile.medicines.controller.js";

const router = Router();

// ── Static routes first ───────────────────────────────────────
router.get("/feed", handleGetFeed);
router.get("/categories", handleListCategories);

// ── Paginated catalog (CategoryScreen) ───────────────────────
router.get("", handleListMedicines);

// ── Dynamic single variant (must be last) ─────────────────────
router.get("/:variantId", handleGetMedicine);

export default router;