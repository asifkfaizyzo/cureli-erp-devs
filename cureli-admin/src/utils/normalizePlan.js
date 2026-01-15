// cureli-admin/src/utils/normalizePlan.js

/**
 * Normalizes a plan object to handle expired promos on the frontend.
 * This is a defensive layer to prevent stale backend promo flags from
 * causing incorrect UI states.
 * 
 * @param {Object} plan - Raw plan object from backend
 * @param {Object} options - Optional configuration
 * @param {boolean} options.flagForReview - If true, adds _needs_review flag for expired promos (C-Admin only)
 * @returns {Object} - Normalized plan object
 */
export function normalizePlan(plan, options = {}) {
  if (!plan) return plan;

  const { flagForReview = false } = options;

  // Clone to avoid mutating original
  const normalized = { ...plan };

  // Check if promo is expired
  const isPromoExpired = checkPromoExpired(plan);

  if (isPromoExpired) {
    // Disable promo behavior
    normalized.is_promo_active = false;
    normalized.promo_free_until = null;

    // Flag for C-Admin review if requested
    if (flagForReview) {
      normalized._needs_review = true;
      normalized._review_reason = 'expired_promo';
      normalized._original_promo_date = plan.promo_free_until;
    }
  } else {
    // Ensure flag is false if not expired
    if (flagForReview) {
      normalized._needs_review = false;
    }
  }

  return normalized;
}

/**
 * Normalizes an array of plans.
 * 
 * @param {Array} plans - Array of raw plan objects from backend
 * @param {Object} options - Optional configuration
 * @param {boolean} options.flagForReview - If true, adds _needs_review flag for expired promos
 * @returns {Array} - Array of normalized plan objects
 */
export function normalizePlans(plans, options = {}) {
  if (!Array.isArray(plans)) return [];
  return plans.map(plan => normalizePlan(plan, options));
}

/**
 * Checks if a plan's promo has expired.
 * 
 * @param {Object} plan - Plan object to check
 * @returns {boolean} - True if promo is expired
 */
function checkPromoExpired(plan) {
  // If no promo is active according to backend, nothing to check
  if (!plan.is_promo_active) return false;

  // If no promo date set, nothing to expire
  if (!plan.promo_free_until) return false;

  // Parse the promo end date
  const promoEndDate = new Date(plan.promo_free_until);

  // Handle invalid date
  if (isNaN(promoEndDate.getTime())) return false;

  // Get current date (start of day for fair comparison)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Promo end date should be end of that day
  promoEndDate.setHours(23, 59, 59, 999);

  // Check if expired
  return promoEndDate < today;
}

/**
 * Utility to count plans needing review.
 * 
 * @param {Array} plans - Array of normalized plans
 * @returns {number} - Count of plans with _needs_review = true
 */
export function countPlansNeedingReview(plans) {
  if (!Array.isArray(plans)) return 0;
  return plans.filter(plan => plan._needs_review === true).length;
}