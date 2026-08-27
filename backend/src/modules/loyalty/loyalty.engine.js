// backend/src/modules/loyalty/loyalty.engine.js
//
// Pure functions — no DB calls, no side effects.
// Receives config object + order inputs, returns point calculations.
//
// Follows the same pattern as pricing.engine.js and coupon.engine.js:
//   - All money values are plain numbers
//   - Points are always integers (floor-rounded)
//   - Money math uses parseFloat((x).toFixed(2))

/**
 * @typedef {Object} LoyaltyConfigInput
 * @property {boolean}     is_enabled
 * @property {number}      earn_rate_amount     - ₹X per 1 point
 * @property {string}      earn_basis           - "SUBTOTAL"
 * @property {number}      redemption_value     - 1 point = ₹Y
 * @property {number}      min_redeem_points
 * @property {number}      min_order_amount
 * @property {number|null} max_redeem_points
 * @property {number|null} max_redeem_percent   - e.g. 20.00 = 20%
 * @property {number|null} points_expiry_days
 */

/**
 * @typedef {Object} RedemptionValidationResult
 * @property {boolean} valid
 * @property {number}  allowedPoints   - actual points that can be redeemed (may be less than requested)
 * @property {number}  discount        - rupee discount for allowedPoints
 * @property {string|null} reason      - human-readable reason when invalid
 */

/**
 * Calculate how many loyalty points an order earns.
 *
 * @param {number} effectiveSubtotal - subtotal AFTER coupon discount, BEFORE loyalty discount
 * @param {number} earnRateAmount    - ₹X per 1 point (from config)
 * @returns {number} integer points earned (floor-rounded)
 */
export function calculatePointsEarned(effectiveSubtotal, earnRateAmount) {
  if (earnRateAmount <= 0) return 0;
  if (effectiveSubtotal <= 0) return 0;

  return Math.floor(effectiveSubtotal / earnRateAmount);
}

/**
 * Calculate the rupee discount for a given number of points.
 *
 * @param {number} pointsToRedeem    - number of points
 * @param {number} redemptionValue   - ₹Y per point (from config)
 * @returns {number} discount in rupees
 */
export function calculateRedemptionDiscount(pointsToRedeem, redemptionValue) {
  return parseFloat((pointsToRedeem * redemptionValue).toFixed(2));
}

/**
 * Validate a loyalty point redemption request.
 * Applies all business rules and caps, returns the actual allowed redemption.
 *
 * @param {Object} params
 * @param {LoyaltyConfigInput} params.config
 * @param {number}             params.userBalance        - customer's current point balance
 * @param {number}             params.pointsRequested    - how many points the customer wants to redeem
 * @param {number}             params.effectiveSubtotal  - subtotal after coupon, before loyalty
 * @returns {RedemptionValidationResult}
 */
export function validateRedemption({
  config,
  userBalance,
  pointsRequested,
  effectiveSubtotal,
}) {
  // ── 1. Feature enabled ─────────────────────────────────────
  if (!config.is_enabled) {
    return { valid: false, allowedPoints: 0, discount: 0, reason: "Loyalty program is not active" };
  }

  // ── 2. Minimum order amount ────────────────────────────────
  if (effectiveSubtotal < config.min_order_amount) {
    return {
      valid: false,
      allowedPoints: 0,
      discount: 0,
      reason: `Minimum order amount ₹${config.min_order_amount} required to redeem points`,
    };
  }

  // ── 3. Minimum redeem points ───────────────────────────────
  if (pointsRequested < config.min_redeem_points) {
    return {
      valid: false,
      allowedPoints: 0,
      discount: 0,
      reason: `Minimum ${config.min_redeem_points} points required to redeem`,
    };
  }

  // ── 4. Balance check ───────────────────────────────────────
  if (userBalance <= 0) {
    return { valid: false, allowedPoints: 0, discount: 0, reason: "No loyalty points available" };
  }

  if (pointsRequested > userBalance) {
    return {
      valid: false,
      allowedPoints: 0,
      discount: 0,
      reason: `Insufficient points. You have ${userBalance} points`,
    };
  }

  // ── 5. Apply caps ──────────────────────────────────────────
  let allowedPoints = pointsRequested;

  // Cap: max_redeem_points (absolute cap)
  if (config.max_redeem_points !== null && config.max_redeem_points !== undefined) {
    allowedPoints = Math.min(allowedPoints, config.max_redeem_points);
  }

  // Cap: max_redeem_percent (percentage of effective subtotal)
  if (config.max_redeem_percent !== null && config.max_redeem_percent !== undefined) {
    const maxDiscountByPercent = (effectiveSubtotal * config.max_redeem_percent) / 100;
    const maxPointsByPercent = Math.floor(maxDiscountByPercent / config.redemption_value);
    allowedPoints = Math.min(allowedPoints, maxPointsByPercent);
  }

  // Cap: discount cannot exceed effective subtotal (order can't go below ₹1)
  const maxPointsBySubtotal = Math.floor(
    (effectiveSubtotal - 1) / config.redemption_value,
  );
  allowedPoints = Math.min(allowedPoints, Math.max(0, maxPointsBySubtotal));

  // ── 6. Final validation ────────────────────────────────────
  if (allowedPoints < config.min_redeem_points) {
    return {
      valid: false,
      allowedPoints: 0,
      discount: 0,
      reason: `After applying limits, redemption falls below minimum ${config.min_redeem_points} points`,
    };
  }

  const discount = calculateRedemptionDiscount(allowedPoints, config.redemption_value);

  return {
    valid: true,
    allowedPoints,
    discount,
    reason: null,
  };
}

/**
 * Normalise a DB LoyaltyConfig row to plain numbers.
 * Prisma returns Decimal objects — this converts them for the engine.
 *
 * @param {Object} dbRow - Raw Prisma LoyaltyConfig row
 * @returns {LoyaltyConfigInput}
 */
export function normaliseLoyaltyConfig(dbRow) {
  return {
    is_enabled: dbRow.is_enabled,
    earn_rate_amount: Number(dbRow.earn_rate_amount),
    earn_basis: dbRow.earn_basis,
    redemption_value: Number(dbRow.redemption_value),
    min_redeem_points: dbRow.min_redeem_points,
    min_order_amount: Number(dbRow.min_order_amount),
    max_redeem_points: dbRow.max_redeem_points ?? null,
    max_redeem_percent:
      dbRow.max_redeem_percent !== null ? Number(dbRow.max_redeem_percent) : null,
    points_expiry_days: dbRow.points_expiry_days ?? null,
  };
}