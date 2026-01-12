// Subscription Plan Configuration
// Defines statuses, themes, actions, and display settings

import { 
  FileEdit, 
  CheckCircle2, 
  Clock, 
  XCircle,
  LayoutGrid 
} from "lucide-react";

// ============================================
// PLAN STATUSES (must match backend enum)
// ============================================
export const PLAN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  DEPRECATED: "DEPRECATED",
  SUSPENDED: "SUSPENDED",
};

export const STATUS_CONFIG = {
  [PLAN_STATUS.DRAFT]: {
    label: "Draft",
    icon: FileEdit,
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    description: "Plan is in draft mode and can be edited",
  },
  [PLAN_STATUS.ACTIVE]: {
    label: "Active",
    icon: CheckCircle2,
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    description: "Plan is live and accepting subscriptions",
  },
  [PLAN_STATUS.DEPRECATED]: {
    label: "Deprecated",
    icon: Clock,
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    dotColor: "bg-orange-500",
    description: "Plan is phasing out, existing subscribers continue",
  },
  [PLAN_STATUS.SUSPENDED]: {
    label: "Suspended",
    icon: XCircle,
    badgeColor: "bg-red-100 text-red-700 border-red-200",
    dotColor: "bg-red-500",
    description: "Plan is inactive and not accepting subscriptions",
  },
};

// ============================================
// ACTIONS PER STATUS
// ============================================
export const ALLOWED_ACTIONS = {
  [PLAN_STATUS.DRAFT]: ["edit", "activate", "clone", "delete"],
  [PLAN_STATUS.ACTIVE]: ["view", "suspend", "clone"],
  [PLAN_STATUS.DEPRECATED]: ["view", "clone"],
  [PLAN_STATUS.SUSPENDED]: ["view", "reactivate", "clone"],
};

// ============================================
// CARD THEMES
// ============================================
export const CARD_THEMES = {
  free: {
    gradient: "from-emerald-50 to-teal-100",
    hoverGradient: "hover:from-emerald-600 hover:to-teal-600",
    accentColor: "text-emerald-600",
    borderAccent: "border-emerald-200",
  },
  default: {
    gradient: "from-[#afccf4] to-[#e7e9ec]",
    hoverGradient: "hover:from-[#05015A] hover:to-[#05015A]",
    accentColor: "text-[#05015A]",
    borderAccent: "border-blue-200",
  },
  featured: {
    gradient: "from-violet-100 to-purple-100",
    hoverGradient: "hover:from-violet-600 hover:to-purple-600",
    accentColor: "text-violet-600",
    borderAccent: "border-violet-300",
  },
  promo: {
    gradient: "from-amber-50 to-orange-100",
    hoverGradient: "hover:from-amber-500 hover:to-orange-500",
    accentColor: "text-amber-600",
    borderAccent: "border-amber-300",
  },
};

// ============================================
// FILTER OPTIONS
// ============================================
export const FILTER_OPTIONS = [
  { 
    key: "all", 
    label: "All Plans", 
    icon: LayoutGrid,
    activeColor: "bg-[#05015A]",
  },
  { 
    key: PLAN_STATUS.DRAFT, 
    label: "Draft", 
    icon: FileEdit,
    activeColor: "bg-amber-600",
  },
  { 
    key: PLAN_STATUS.ACTIVE, 
    label: "Active", 
    icon: CheckCircle2,
    activeColor: "bg-emerald-600",
  },
  { 
    key: PLAN_STATUS.DEPRECATED, 
    label: "Deprecated", 
    icon: Clock,
    activeColor: "bg-orange-600",
  },
  { 
    key: PLAN_STATUS.SUSPENDED, 
    label: "Suspended", 
    icon: XCircle,
    activeColor: "bg-red-600",
  },
];

// ============================================
// BILLING
// ============================================
export const BILLING = {
  duration: "year",
  displayText: "/year",
  currency: "₹",
  currencyCode: "INR",
};

// ============================================
// PROMO HELPERS
// ============================================

/**
 * Check if promo_free_until is currently active
 * @param {Object} plan - Plan object
 * @returns {boolean}
 */
export const isPromoActive = (plan) => {
  if (!plan?.promo_free_until) return false;
  return new Date(plan.promo_free_until) > new Date();
};

/**
 * Check if plan has any active promotional features
 * @param {Object} plan - Plan object
 * @returns {boolean}
 */
export const hasActivePromo = (plan) => {
  if (!plan) return false;
  
  const hasComparePrice = plan.compare_at_price && plan.compare_at_price > plan.price;
  const hasBonusMonths = plan.bonus_months && plan.bonus_months > 0;
  const hasFreeUntil = isPromoActive(plan);
  
  return hasComparePrice || hasBonusMonths || hasFreeUntil;
};

/**
 * Get total subscription duration in months
 * @param {Object} plan - Plan object
 * @returns {number}
 */
export const getTotalDurationMonths = (plan) => {
  if (!plan) return 12;
  return (plan.billing_cycle_months || 12) + (plan.bonus_months || 0);
};

/**
 * Calculate discount percentage
 * @param {Object} plan - Plan object
 * @returns {number|null}
 */
export const getDiscountPercentage = (plan) => {
  if (!plan?.compare_at_price || !plan?.price) return null;
  if (plan.compare_at_price <= plan.price) return null;
  
  const discount = ((plan.compare_at_price - plan.price) / plan.compare_at_price) * 100;
  return Math.round(discount);
};

/**
 * Format promo free until date for display
 * @param {Object} plan - Plan object
 * @returns {string|null}
 */
export const formatPromoDate = (plan) => {
  if (!plan?.promo_free_until) return null;
  
  const date = new Date(plan.promo_free_until);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Get promo badge text for bonus months
 * @param {Object} plan - Plan object
 * @returns {string|null}
 */
export const getBonusMonthsBadge = (plan) => {
  if (!plan?.bonus_months || plan.bonus_months <= 0) return null;
  return `+${plan.bonus_months} months free`;
};

/**
 * Get promo badge text for free until
 * @param {Object} plan - Plan object
 * @returns {string|null}
 */
export const getFreeUntilBadge = (plan) => {
  if (!isPromoActive(plan)) return null;
  return `Free until ${formatPromoDate(plan)}`;
};

// ============================================
// CARD THEME HELPERS
// ============================================

/**
 * Determines card theme based on plan properties
 * Priority: promo active > free > featured > default
 * @param {Object} plan - Plan object
 * @returns {Object} Theme configuration
 */
export const getCardTheme = (plan) => {
  // Active promo gets special treatment
  if (isPromoActive(plan)) return CARD_THEMES.promo;
  
  // Free plans
  if (plan.price === 0) return CARD_THEMES.free;
  
  // Featured plans
  if (plan.is_featured) return CARD_THEMES.featured;
  
  return CARD_THEMES.default;
};

// ============================================
// FEATURE GENERATION
// ============================================

/**
 * Generates feature list from plan limits
 * @param {Object} plan - Plan object
 * @returns {string[]}
 */
export const generateFeatures = (plan) => {
  const features = [];
  
  const users = plan.max_users;
  const branches = plan.max_branches;
  
  if (users !== undefined) {
    if (users === -1) {
      features.push("Unlimited users");
    } else {
      features.push(`Up to ${users} users`);
    }
  }
  
  if (branches !== undefined) {
    if (branches === -1) {
      features.push("Unlimited branches");
    } else if (branches === 1) {
      features.push("Single branch");
    } else {
      features.push(`Up to ${branches} branches`);
    }
  }
  
  // Add duration feature if bonus months exist
  const totalMonths = getTotalDurationMonths(plan);
  if (plan.bonus_months && plan.bonus_months > 0) {
    features.push(`${totalMonths} months access`);
  }
  
  return features;
};

// ============================================
// PRICE FORMATTING
// ============================================

/**
 * Formats price for display
 * @param {number} price - Price in Rupees
 * @returns {string}
 */
export const formatPrice = (price) => {
  if (price === 0) return "FREE";
  return `${BILLING.currency}${Number(price).toLocaleString("en-IN")}`;
};

/**
 * Format compare-at price with strike-through styling info
 * @param {Object} plan - Plan object
 * @returns {Object|null} { original, current, savings, percentage }
 */
export const formatPriceComparison = (plan) => {
  if (!plan?.compare_at_price || plan.compare_at_price <= plan.price) {
    return null;
  }
  
  const original = plan.compare_at_price;
  const current = plan.price;
  const savings = original - current;
  const percentage = getDiscountPercentage(plan);
  
  return {
    original: formatPrice(original),
    current: formatPrice(current),
    savings: formatPrice(savings),
    percentage,
  };
};

// ============================================
// PLAN NAME VALIDATION
// ============================================

/**
 * Checks if plan name is available for activation
 * @param {string} name - Plan name to check
 * @param {Array} plans - Array of existing plans
 * @param {string|null} excludeId - Plan ID to exclude from check
 * @returns {boolean}
 */
export const isNameAvailable = (name, plans, excludeId = null) => {
  return !plans.some(
    (p) => 
      p.name.toLowerCase() === name.toLowerCase() && 
      p.status === PLAN_STATUS.ACTIVE &&
      p.plan_id !== excludeId
  );
};

/**
 * Generates cloned plan name (frontend helper)
 * @param {string} originalName - Original plan name
 * @param {Array} existingPlans - Array of existing plans
 * @returns {string}
 */
export const generateCloneName = (originalName, existingPlans) => {
  let baseName = originalName.replace(/\s*\(Copy(?:\s*\d+)?\)\s*$/, "");
  let copyName = `${baseName} (Copy)`;
  let counter = 1;
  
  const existingNames = existingPlans.map(p => p.name.toLowerCase());
  
  while (existingNames.includes(copyName.toLowerCase())) {
    counter++;
    copyName = `${baseName} (Copy ${counter})`;
  }
  
  return copyName;
};