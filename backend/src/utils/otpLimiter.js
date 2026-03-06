//backend\src\utils\otpLimiter.js
import prisma from "../config/prisma.js";

// ============================================
// OTP DAILY RATE LIMITER
//
// Tracks OTP sends per identifier (phone/email)
// per calendar day. Uses PostgreSQL — no Redis needed.
//
// Limits are configurable via environment variables:
//   DAILY_SMS_OTP_LIMIT   (default: 20)
//   DAILY_EMAIL_OTP_LIMIT (default: 20)
// ============================================

const SMS_DAILY_LIMIT = Number(process.env.DAILY_SMS_OTP_LIMIT) || 20;
const EMAIL_DAILY_LIMIT = Number(process.env.DAILY_EMAIL_OTP_LIMIT) || 20;

/**
 * Check if an SMS OTP can be sent to this phone number today.
 * If allowed, increments the counter.
 *
 * @param {string} phone - Phone number (without country code prefix)
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number }>}
 */
export async function checkSmsOtpLimit(phone) {
  return checkOtpLimit(`sms:${phone}`, SMS_DAILY_LIMIT);
}

/**
 * Check if an email OTP can be sent to this email today.
 * If allowed, increments the counter.
 *
 * @param {string} email
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number }>}
 */
export async function checkEmailOtpLimit(email) {
  return checkOtpLimit(`email:${email.toLowerCase()}`, EMAIL_DAILY_LIMIT);
}

/**
 * Core limiter logic.
 * Uses upsert to atomically check-and-increment.
 */
async function checkOtpLimit(identifier, limit) {
  const today = getToday();

  // Upsert: create today's record or fetch existing
  const record = await prisma.otpDailyLimit.upsert({
    where: {
      identifier_date: {
        identifier,
        date: today,
      },
    },
    create: {
      identifier,
      date: today,
      count: 0,
    },
    update: {},
  });

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
    };
  }

  // Increment count
  await prisma.otpDailyLimit.update({
    where: {
      identifier_date: {
        identifier,
        date: today,
      },
    },
    data: {
      count: { increment: 1 },
    },
  });

  return {
    allowed: true,
    remaining: limit - record.count - 1,
    limit,
  };
}

/**
 * Get today's date at midnight UTC (for consistent daily bucketing)
 */
function getToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}