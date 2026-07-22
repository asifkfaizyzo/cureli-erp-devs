// src/config/reviewCredentials.js

// ── App Store / Play Store Review Bypass ─────────────────────
//
// When REVIEW_MODE=true in .env, the fixed review phone and OTP
// are active. The schema accepts the number and the service skips
// MSG91. Set REVIEW_MODE=false (or remove it) before production
// deployments that are not under review.
//
// Both the schema and service import from here so the values
// are never duplicated and rotation is a single-line change.

const REVIEW_MODE_ACTIVE =
  process.env.REVIEW_MODE?.trim().toUpperCase() === "TRUE";

export const REVIEW_PHONE = REVIEW_MODE_ACTIVE ? "1234567890" : null;
export const REVIEW_OTP   = REVIEW_MODE_ACTIVE ? "123456"     : null;

// Convenience boolean used in schema and service guards
export const IS_REVIEW_MODE = REVIEW_MODE_ACTIVE;