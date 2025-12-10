//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\middleware\requireCAdmin.js
import { ADMIN_ACCESS_SECRET } from "../config/cadmin_jwt.js";
import jwt from "jsonwebtoken";
import { fail } from "../utils/response.js";

export const requireCAdmin = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return fail(res, "Missing authorization", 401);

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, ADMIN_ACCESS_SECRET);
    req.cadmin = {
      cadmin_id: payload.cadmin_id,
      username: payload.username,
    };
    return next();
  } catch (err) {
    return fail(res, "Invalid or expired token", 401);
  }
};
