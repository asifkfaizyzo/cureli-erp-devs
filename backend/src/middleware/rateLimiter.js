// backend/src/middleware/rateLimiter.js

import rateLimit from "express-rate-limit";

// ============================================
// GLOBAL API LIMITER — for /api/* (ERP users)
// ============================================

export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max:      100,             // 100 req/min per IP for ERP users — unchanged
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// CADMIN API LIMITER — for /cadmin/* (internal admins)
//
// CAdmin panel makes significantly more requests per page:
//   - Notification polling
//   - Filter dropdowns (shops, plans, roles)
//   - Preview endpoint on every filter change
//   - Drafts/history pagination
//   - SSE connection (persistent, doesn't count but still opens)
//
// 300 req/min = 5 req/sec — plenty for a single admin user's UI
// and still protects against abuse.
// ============================================

export const cadminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max:      300,             // 300 req/min per IP for internal admins
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// AUTH LIMITER — login, OTP verify, password reset
// ============================================

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      15,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

// ============================================
// OTP SEND LIMITER — each hit costs SMS money
// ============================================

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      15,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "OTP request limit exceeded. Please try again later.",
  },
});

// ============================================
// SIGNUP LIMITER — registration flow
// ============================================

export const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many signup attempts. Please try again later.",
  },
});