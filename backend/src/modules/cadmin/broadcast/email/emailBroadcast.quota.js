// backend/src/modules/cadmin/broadcast/email/emailBroadcast.quota.js

import prisma from '../../../../config/prisma.js';

/**
 * Daily Email Send Quota Manager
 * 
 * Features:
 * - IST timezone handling
 * - Configurable daily limit via env
 * - Atomic counter updates
 * - Remaining capacity checks
 */

// ============================================
// CONFIGURATION
// ============================================

const DAILY_LIMIT = parseInt(process.env.DAILY_EMAIL_LIMIT || '10000', 10);

// IST is UTC+5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// ============================================
// IST DATE HELPERS
// ============================================

/**
 * Get current date in IST as YYYY-MM-DD string
 */
export function getCurrentISTDate() {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  return istTime.toISOString().split('T')[0];
}

/**
 * Get IST date from any date
 */
export function toISTDate(date) {
  const d = new Date(date);
  const istTime = new Date(d.getTime() + IST_OFFSET_MS);
  return istTime.toISOString().split('T')[0];
}

/**
 * Get milliseconds until next IST midnight (for scheduling)
 */
export function getMsUntilISTMidnight() {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  
  // Get next midnight in IST
  const nextMidnight = new Date(istNow);
  nextMidnight.setUTCHours(24, 0, 0, 0);
  
  return nextMidnight.getTime() - IST_OFFSET_MS - now.getTime();
}

// ============================================
// QUOTA OPERATIONS
// ============================================

/**
 * Get or create today's quota record
 */
export async function getTodayQuota() {
  const today = getCurrentISTDate();
  
  let quota = await prisma.dailySendQuota.findUnique({
    where: { date: today },
  });
  
  if (!quota) {
    quota = await prisma.dailySendQuota.create({
      data: {
        date: today,
        sent_count: 0,
      },
    });
  }
  
  return quota;
}

/**
 * Get remaining capacity for today
 * 
 * @returns {Object} - { remaining, used, limit, canSend }
 */
export async function getRemainingCapacity() {
  const quota = await getTodayQuota();
  const remaining = DAILY_LIMIT - quota.sent_count;
  
  return {
    remaining: Math.max(0, remaining),
    used: quota.sent_count,
    limit: DAILY_LIMIT,
    canSend: remaining > 0,
    date: quota.date,
  };
}

/**
 * Check if we can send N emails today
 * 
 * @param {number} count - Number of emails to send
 * @returns {Object} - { canSend, available, needed, shortfall }
 */
export async function canSendEmails(count) {
  const { remaining, used, limit } = await getRemainingCapacity();
  
  return {
    canSend: remaining >= count,
    available: remaining,
    needed: count,
    shortfall: Math.max(0, count - remaining),
    used,
    limit,
  };
}

/**
 * Reserve capacity for sending (returns how many can actually be sent)
 * Does NOT increment counter - use incrementSentCount after actual sending
 * 
 * @param {number} requested - Number of emails requested to send
 * @returns {number} - Number of emails that can actually be sent
 */
export async function reserveCapacity(requested) {
  const { remaining } = await getRemainingCapacity();
  return Math.min(requested, remaining);
}

/**
 * Increment sent count after successful/attempted sends
 * 
 * @param {number} count - Number of emails sent/attempted
 * @returns {Object} - Updated quota
 */
export async function incrementSentCount(count) {
  if (count <= 0) return getTodayQuota();
  
  const today = getCurrentISTDate();
  
  // Upsert to handle race conditions
  const quota = await prisma.dailySendQuota.upsert({
    where: { date: today },
    create: {
      date: today,
      sent_count: count,
    },
    update: {
      sent_count: {
        increment: count,
      },
    },
  });
  
  console.log(`[Quota] Incremented by ${count}. Today's total: ${quota.sent_count}/${DAILY_LIMIT}`);
  
  return quota;
}

/**
 * Get quota history (last N days)
 * 
 * @param {number} days - Number of days to fetch
 * @returns {Array} - Quota records
 */
export async function getQuotaHistory(days = 7) {
  const history = await prisma.dailySendQuota.findMany({
    orderBy: { date: 'desc' },
    take: days,
  });
  
  return history.map((q) => ({
    ...q,
    limit: DAILY_LIMIT,
    usage_percent: Math.round((q.sent_count / DAILY_LIMIT) * 100),
  }));
}

/**
 * Check if sending should be paused due to quota
 * Used by cron worker
 */
export async function shouldPauseSending() {
  const { remaining } = await getRemainingCapacity();
  return remaining <= 0;
}

/**
 * Get next available send time (if quota exceeded)
 * Returns IST midnight
 */
export function getNextAvailableTime() {
  const msUntilMidnight = getMsUntilISTMidnight();
  const nextAvailable = new Date(Date.now() + msUntilMidnight);
  return nextAvailable;
}

// ============================================
// ADMIN/DEBUG FUNCTIONS
// ============================================

/**
 * Reset today's quota (admin only)
 */
export async function resetTodayQuota() {
  const today = getCurrentISTDate();
  
  await prisma.dailySendQuota.upsert({
    where: { date: today },
    create: {
      date: today,
      sent_count: 0,
    },
    update: {
      sent_count: 0,
    },
  });
  
  console.log(`[Quota] Reset quota for ${today}`);
}

/**
 * Get current limit setting
 */
export function getDailyLimit() {
  return DAILY_LIMIT;
}

export default {
  getCurrentISTDate,
  toISTDate,
  getMsUntilISTMidnight,
  getTodayQuota,
  getRemainingCapacity,
  canSendEmails,
  reserveCapacity,
  incrementSentCount,
  getQuotaHistory,
  shouldPauseSending,
  getNextAvailableTime,
  resetTodayQuota,
  getDailyLimit,
};