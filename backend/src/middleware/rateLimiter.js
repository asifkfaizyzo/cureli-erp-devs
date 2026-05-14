//backend\src\middleware\rateLimiter.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";

// ============================================
// KEY GENERATOR — per-user or per-IP fallback
// ============================================
const userOrIpKey = (req) => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.split(" ")[1];
      const payload = jwt.decode(token);
      if (payload?.user_id) {
        return `user:${payload.user_id}`;
      }
    }
  } catch {
    // decode failed — fall through to IP
  }
  return `ip:${ipKeyGenerator(req)}`; // ← only change, wraps req.ip with IPv6 normalization
};

// ============================================
// GLOBAL API LIMITER — for /api/* (ERP users)
// ============================================
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// RELAXED LIMITER — for system-driven polling endpoints
// ============================================
export const relaxedLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 600,
  keyGenerator: userOrIpKey,
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
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// AUTH LIMITER — login, OTP verify, password reset
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
// OTP SEND LIMITER — explicit resend endpoints only
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
// ============================================
// MOBILE API LIMITER — for /mobile/* (customer app)
// ============================================
export const mobileLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// MOBILE AUTH LIMITER — OTP send + verify only
// Tighter window, IP-keyed using the same safe helper
// ============================================
export const mobileAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `ip:${ipKeyGenerator(req)}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});