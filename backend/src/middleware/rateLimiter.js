import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

// ============================================
// KEY GENERATOR — per-user or per-IP fallback
// ============================================
// Uses jwt.decode() (no verification) to extract user_id from
// Bearer token. Fast and synchronous — no DB calls.
// Falls back to IP for unauthenticated requests.
//
// This does NOT replace session validation — requireAuth still
// does full jwt.verify() + validateUserSession() downstream.
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
  return `ip:${req.ip}`;
};

// ============================================
// GLOBAL API LIMITER — for /api/* (ERP users)
// ============================================
// 200 req/min per user (or per IP if unauthenticated).
// Raised from 100 because:
//   - Now keyed per-user not per-IP (pharmacy staff share IP)
//   - Normal ERP usage peaks at ~80 req/min
//   - 200 gives safe headroom without being reckless
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
// Applied to routes that fire automatically (not user-driven):
//   - /api/notifications/unread-count  (NotificationDropdown)
//   - /api/notifications/recent        (NotificationDropdown)
//   - /api/purchase/returns            (Sidebar — every 30s)
//
// 600 req/min per user gives polling room for:
//   - Sidebar: 2 polls/min × 10 staff = 20 req/min worst case
//   - Still blocks genuine abuse
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
// Also keyed per-user now. CAdmin users are internal
// staff — per-user limiting is appropriate here too.
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
// INTENTIONALLY IP-ONLY — no userOrIpKey here.
// These endpoints are hit before a valid user_id exists.
// IP-based limiting is correct for brute force protection.
// The application layer (sendLoginOtp) handles per-user
// OTP cooldowns and daily limits independently.
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
// INTENTIONALLY IP-ONLY — same reason as authLimiter.
// DO NOT apply to /login — see authLimiter comment above.
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
// INTENTIONALLY IP-ONLY — no user_id exists yet
// during signup. IP limiting is the only option here.
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