import express from "express";
import {
  getPlansController,
  getPlanByIdController,
} from "./plans.controller.js";

const router = express.Router();

router.get("/", getPlansController);
router.get("/:id", getPlanByIdController);

export default router;
