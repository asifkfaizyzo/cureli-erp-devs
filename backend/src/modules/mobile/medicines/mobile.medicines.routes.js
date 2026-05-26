// src/modules/mobile/medicines/mobile.medicines.routes.js
//
// PUBLIC mobile medicine discovery routes.
//
// IMPORTANT: Unlike mobile.users.routes.js, this router does NOT apply
// `mobileAuth`. Medicine discovery is public for the showcase build — a
// logged-out user can browse the catalog. (The /mobile mount in index.js
// still applies mobileLimiter at the app level, so these stay rate-limited.)
//
// NOTE ON VALIDATION: your existing `validate` middleware is only ever used
// to validate req.body (see mobile.users.routes.js). These endpoints validate
// QUERY and PARAMS instead, so rather than assume validate() supports a
// target argument, the controllers parse req.query / req.params directly with
// the zod schemas. This keeps the module self-contained and avoids coupling
// to validate()'s internal behaviour.
//
// Route ordering: the static "/medicines/categories" path MUST be declared
// before the dynamic "/medicines/:variantId", otherwise "categories" would
// be captured as a variantId.

import { Router } from "express";
import {
  handleListMedicines,
  handleListCategories,
  handleGetMedicine,
} from "./mobile.medicines.controller.js";

const router = Router();

// ── Static routes first ───────────────────────────────────────
router.get("/medicines/categories", handleListCategories);

// ── Feed ──────────────────────────────────────────────────────
router.get("/medicines", handleListMedicines);

// ── Dynamic single variant (must be last) ─────────────────────
router.get("/medicines/:variantId", handleGetMedicine);

export default router;