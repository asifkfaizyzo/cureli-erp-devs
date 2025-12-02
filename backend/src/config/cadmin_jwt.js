// src/config/cadmin_jwt.js
import dotenv from "dotenv";
dotenv.config();

const ADMIN_ACCESS_EXPIRES = process.env.ADMIN_ACCESS_TOKEN_EXPIRES || "15m";
const ADMIN_REFRESH_EXPIRES = process.env.ADMIN_REFRESH_TOKEN_EXPIRES || "7d";
const ADMIN_ACCESS_SECRET = process.env.ADMIN_JWT_ACCESS_SECRET;
const ADMIN_REFRESH_SECRET = process.env.ADMIN_JWT_REFRESH_SECRET;

// Debug logging - remove in production
console.log("=== CADMIN JWT CONFIG ===");
console.log("ADMIN_ACCESS_SECRET loaded:", ADMIN_ACCESS_SECRET ? `YES (${ADMIN_ACCESS_SECRET.slice(0, 5)}...)` : "❌ NO");
console.log("ADMIN_REFRESH_SECRET loaded:", ADMIN_REFRESH_SECRET ? `YES (${ADMIN_REFRESH_SECRET.slice(0, 5)}...)` : "❌ NO");
console.log("ADMIN_ACCESS_EXPIRES:", ADMIN_ACCESS_EXPIRES);
console.log("ADMIN_REFRESH_EXPIRES:", ADMIN_REFRESH_EXPIRES);
console.log("=========================");

if (!ADMIN_ACCESS_SECRET || !ADMIN_REFRESH_SECRET) {
  console.error("❌ CRITICAL: ADMIN_JWT secrets not set in .env");
  process.exit(1); // Stop the server if secrets are missing
}

export {
  ADMIN_ACCESS_EXPIRES,
  ADMIN_REFRESH_EXPIRES,
  ADMIN_ACCESS_SECRET,
  ADMIN_REFRESH_SECRET,
};