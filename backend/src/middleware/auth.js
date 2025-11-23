import jwt from "jsonwebtoken";
import { ACCESS_SECRET } from "../config/jwt.js";
import { fail } from "../utils/response.js";

export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer "))
    return fail(res, "Missing authorization", 401);

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);

    // 🔥 ENSURE THESE FIELDS EXIST FOR SHOP MODULE
    req.user = {
      user_id: payload.user_id,
      shop_id: payload.shop_id,   // REQUIRED for shop info + file uploads
      role: payload.role,
      status: payload.status,
    };

    return next();
  } catch (err) {
    return fail(res, "Invalid or expired token", 401);
  }
};
