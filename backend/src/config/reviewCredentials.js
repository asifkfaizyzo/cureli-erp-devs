// src/config/reviewCredentials.js

// ── App Store / Play Store Review Bypass Configuration ────────
//
// When REVIEW_MODE=TRUE in the backend .env, the reviewer bypass is enabled.
// If set to FALSE or not defined, the bypass is fully disabled.

const REVIEW_MODE_ACTIVE =
  process.env.REVIEW_MODE?.trim().toUpperCase() === "TRUE";

export const REVIEW_PHONE = "1234567890";
export const REVIEW_OTP   = "123456";

// Single source of truth boolean
export const IS_REVIEW_MODE = REVIEW_MODE_ACTIVE;