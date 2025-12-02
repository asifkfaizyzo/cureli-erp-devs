// src/utils/cadminTokens.js
import jwt from "jsonwebtoken";
import {
  ADMIN_ACCESS_EXPIRES,
  ADMIN_REFRESH_EXPIRES,
  ADMIN_ACCESS_SECRET,
  ADMIN_REFRESH_SECRET,
} from "../config/cadmin_jwt.js";

// 🔴 TEMPORARY DEBUG - Remove after fixing!
console.log("=== FULL SECRETS DEBUG ===");
console.log("ADMIN_REFRESH_SECRET FULL:", ADMIN_REFRESH_SECRET);
console.log("ADMIN_REFRESH_SECRET length:", ADMIN_REFRESH_SECRET?.length);
console.log("==========================");

export function generateCAdminAccessToken(payload) {
  console.log("Generating access token with secret:", ADMIN_ACCESS_SECRET?.slice(0, 5) + "...");
  return jwt.sign(payload, ADMIN_ACCESS_SECRET, { expiresIn: ADMIN_ACCESS_EXPIRES });
}

export function generateCAdminRefreshToken(payload) {
  console.log("Generating refresh token with secret:", ADMIN_REFRESH_SECRET);  // 👈 Log full secret
  const token = jwt.sign(payload, ADMIN_REFRESH_SECRET, { expiresIn: ADMIN_REFRESH_EXPIRES });
  console.log("Generated token:", token.slice(0, 50) + "...");
  return token;
}

export function verifyCAdminAccessToken(token) {
  return jwt.verify(token, ADMIN_ACCESS_SECRET);
}

export function verifyCAdminRefreshToken(token) {
  console.log("Verifying refresh token with secret:", ADMIN_REFRESH_SECRET);  // 👈 Log full secret
  return jwt.verify(token, ADMIN_REFRESH_SECRET);
}