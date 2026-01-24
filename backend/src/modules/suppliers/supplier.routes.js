// backend/src/modules/suppliers/supplier.routes.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";

import {
  createSupplierController,
  getSuppliersController,
  getSupplierByIdController,
  updateSupplierController,
} from "./supplier.controller.js";

import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./supplier.schema.js";

const router = express.Router();

router.use(requireAuth);

// CRUD
router.post("/", validateBody(createSupplierSchema), createSupplierController);
router.get("/", getSuppliersController);
router.get("/:supplierId", getSupplierByIdController);
router.put(
  "/:supplierId",
  validateBody(updateSupplierSchema),
  updateSupplierController
);

export default router;
