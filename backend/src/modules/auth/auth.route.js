import express from "express";
import { signupOwner } from "./auth.controller.js";
import { validateBody } from "../../middleware/validate.js";
import { ownerSignupSchema } from "./auth.schema.js";

const router = express.Router();

router.post("/signup", validateBody(ownerSignupSchema), signupOwner);

export default router;
