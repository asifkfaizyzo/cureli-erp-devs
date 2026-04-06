// backend/src/modules/cadmin/master-medicines/cadminMasterMedicines.routes.js

import { Router } from "express";
import {
  listMasterMedicines,
  getMasterMedicine,
  getMasterMedicinesStats,
} from "./cadminMasterMedicines.controller.js";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";

const router = Router();

// All routes require CAdmin authentication
router.use(requireCAdmin);

// GET /cadmin/master-medicines/stats - Get statistics (must be before /:id)
router.get("/master-medicines/stats", getMasterMedicinesStats);

// GET /cadmin/master-medicines - List all with pagination
router.get("/master-medicines", listMasterMedicines);

// GET /cadmin/master-medicines/:id - Get single by ID
router.get("/master-medicines/:id", getMasterMedicine);

export default router;