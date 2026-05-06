import rateLimit from "express-rate-limit";

// ============================================
// GLOBAL API LIMITER — for /api/* (ERP users)
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
// CADMIN API LIMITER — for /cadmin/* (internal admins)
// ============================================

export const cadminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// AUTH LIMITER — login, OTP verify, password reset
// Protects all sensitive auth endpoints by IP.
// This is the only IP-level limiter needed on /login.
// The application layer (sendLoginOtp) handles
// per-user OTP cooldowns and daily limits.
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
// OTP SEND LIMITER — ONLY for explicit resend endpoints
// DO NOT apply this to /login — the login route already
// triggers an OTP send, but it is gated by authLimiter
// and the application-level per-user cooldown in
// sendLoginOtp(). Stacking otpLimiter on /login causes
// new users to hit "OTP limit reached" without ever
// having explicitly requested an OTP.
// ============================================

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "OTP request limit exceeded. Please try again later.",
  },
});

// ============================================
// SIGNUP LIMITER — registration flow
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