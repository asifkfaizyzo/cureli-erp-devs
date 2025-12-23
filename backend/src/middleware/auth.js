// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\middleware\auth.js

import jwt from "jsonwebtoken";
import { ACCESS_SECRET } from "../config/jwt.js";
import { fail } from "../utils/response.js";
import { validateUserSession } from "../utils/session.js";

export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return fail(res, "Missing authorization", 401);
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);

    // ✅ Validate session is still active in database
    if (payload.session_id) {
      const session = await validateUserSession(payload.user_id, payload.session_id);

      if (!session) {
        return fail(
          res,
          "Session expired or logged in from another device",
          401,
          { code: "SESSION_INVALIDATED" }
        );
      }
    }

    // Attach user info to request
    req.user = {
      user_id: payload.user_id,
      shop_id: payload.shop_id,
      role: payload.role,
      status: payload.status,
      session_id: payload.session_id,
    };

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return fail(res, "Token expired", 401, { code: "TOKEN_EXPIRED" });
    }
    return fail(res, "Invalid or expired token", 401);
  }
};

/**
 * Optional auth - doesn't fail if no token, just sets req.user to null
 */
export const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);

    if (payload.session_id) {
      const session = await validateUserSession(payload.user_id, payload.session_id);
      if (!session) {
        req.user = null;
        return next();
      }
    }

    req.user = {
      user_id: payload.user_id,
      shop_id: payload.shop_id,
      role: payload.role,
      status: payload.status,
      session_id: payload.session_id,
    };
  } catch (err) {
    req.user = null;
  }

  return next();
};