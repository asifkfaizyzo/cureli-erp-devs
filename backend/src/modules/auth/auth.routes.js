import express from "express";
import { validateBody } from "../../middleware/validate.js";
import { loginController } from "./login.controller.js";
import { loginSchema } from "./auth.schema.js";

const router = express.Router();

router.post("/login", validateBody(loginSchema), loginController);
// router.post("/signup", validateBody(ownerSignupSchema), signupOwner);


export default router;
