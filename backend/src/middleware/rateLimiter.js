//backend\src\middleware\rateLimiter.js
import rateLimit from "express-rate-limit";

// ============================================
// GLOBAL API LIMITER
// ============================================

export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// AUTH LIMITER — for sensitive auth endpoints
// Login, OTP verify, password reset
// ============================================

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

// ============================================
// OTP SEND LIMITER — for OTP request endpoints
// Tighter than authLimiter since each hit costs SMS money
// ============================================

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "OTP request limit exceeded. Please try again later.",
  },
});

// ============================================
// SIGNUP LIMITER — for registration flow
// More permissive than auth since signup has many steps
// ============================================

export const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many signup attempts. Please try again later.",
  },
});