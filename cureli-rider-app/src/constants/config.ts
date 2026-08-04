// ── Local development ───────────────────────────────────────
// const DEV_BASE_URL = "http://192.168.29.47:5000";
// const DEV_BASE_URL = "http://192.168.100.106:3500";
// const DEV_BASE_URL = "http://localhost:5000";

// ── Production ──────────────────────────────────────────────
// const PROD_BASE_URL = "https://api.curelihealth.com";

export const CONFIG = {
  BASE_URL: "https://api.curelihealth.com", // ← hardcoded for this build
  // BASE_URL: "http://192.168.29.47:5000",  // ← uncomment for local dev
  API_TIMEOUT: 15000,
};