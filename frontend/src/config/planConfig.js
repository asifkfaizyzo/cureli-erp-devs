// frontend/src/config/planConfig.js

// ============================================
// BILLING CONFIGURATION
// ============================================

export const BILLING = {
  cycle: "year",
  displayText: "/year",
  currency: "₹",
  currencyCode: "INR",
};

// ============================================
// CARD THEMES
// ============================================

export const CARD_THEMES = {
  // Free plans (price = 0) - Green theme
  // ⚠️ FIXED: Added hoverGradientRaw for overlay approach
  free: {
    gradient: "from-emerald-50 to-teal-100",
    hoverGradient: "from-emerald-600 to-teal-600", // Raw colors for overlay
    accentColor: "text-emerald-600",
    borderAccent: "border-emerald-300",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
    badgeBg: "bg-emerald-600",
  },

  // Featured plans - Purple theme
  // ⚠️ FIXED: Lightened hover gradient from 600 to 500
  featured: {
    gradient: "from-violet-50 to-purple-100",
    hoverGradient: "from-violet-500 to-purple-500", // Lighter than before
    accentColor: "text-violet-600",
    borderAccent: "border-violet-300",
    buttonBg: "bg-violet-600 hover:bg-violet-700 text-white",
    badgeBg: "bg-violet-600",
  },

  // Default paid plans - Navy Blue theme
  default: {
    gradient: "from-blue-50 to-indigo-100",
    hoverGradient: "from-[#1a1a8c] to-[#2a2a9c]",
    accentColor: "text-[#000060]",
    borderAccent: "border-blue-200",
    buttonBg: "bg-[#000060] hover:bg-[#000080] text-white",
    badgeBg: "bg-[#000060]",
  },

  // Custom plan - Orange theme
  custom: {
    gradient: "from-amber-50 to-orange-100",
    hoverGradient: "from-amber-500 to-orange-500",
    accentColor: "text-amber-600",
    borderAccent: "border-amber-300 border-dashed",
    buttonBg: "bg-amber-600 hover:bg-amber-700 text-white",
    badgeBg: "bg-amber-600",
  },

  // ⚠️ NEW: Current/Active plan special theme
  current: {
  gradient: "from-slate-100 via-gray-50 to-slate-100",
  borderAccent: "border-slate-400",
  glowColor: "ring-slate-300",
  accentColor: "text-slate-700",
  badgeBg: "bg-gradient-to-r from-slate-600 to-slate-700",
},
};

// ============================================
// PRICE FORMATTING
// ============================================

export const formatPrice = (price) => {
  if (price === 0) return "FREE";
  return `${BILLING.currency}${Number(price).toLocaleString("en-IN")}`;
};

export const formatLimit = (value) => {
  if (value === -1) return "Unlimited";
  return value.toString();
};

// ============================================
// DISCOUNT CALCULATION
// ============================================

export const calculateDiscountPercent = (compareAtPrice, price) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

// ============================================
// THEME DETERMINATION
// ============================================

/**
 * Determines card theme based on plan properties
 * 
 * RULES (in order of priority):
 * 1. is_featured = true → Purple (ALWAYS, even with bonus/promo/discount)
 * 2. price = 0 → Green (free)
 * 3. Everything else → Navy Blue (default)
 * 
 * Note: Promo active plans with price > 0 still use their base theme (featured or default)
 */
export const getCardTheme = (plan) => {
  // Featured plans ALWAYS get purple theme
  if (plan.is_featured) {
    return CARD_THEMES.featured;
  }

  // Free plans (price = 0)
  if (plan.price === 0) {
    return CARD_THEMES.free;
  }

  // All other paid plans get navy blue
  return CARD_THEMES.default;
};

// ============================================
// BADGE DETERMINATION
// ============================================

/**
 * Get the header badge for a plan
 * 
 * PRIORITY (highest first):
 * 1. Free Until (promo active with date)
 * 2. Bonus Months
 * 3. Price Reduced (discount)
 * 4. Popular (only if is_featured AND no other badges)
 * 
 * Badge color MATCHES the card theme color
 */
export const getPlanBadge = (plan) => {
  const theme = getCardTheme(plan);

  // 1. Free Until promo - highest priority
  if (plan.is_promo_active && plan.promo_free_until) {
    const date = new Date(plan.promo_free_until).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    return {
      text: `FREE UNTIL ${date.toUpperCase()}`,
      type: "promo",
      bgColor: theme.badgeBg,
    };
  }

  // 2. Bonus months
  if (plan.bonus_months > 0) {
    return {
      text: `+${plan.bonus_months} MONTHS FREE`,
      type: "bonus",
      bgColor: theme.badgeBg,
    };
  }

  // 3. Price reduced (discount) - only for paid, non-promo plans
  const discountPercent = calculateDiscountPercent(plan.compare_at_price, plan.price);
  if (discountPercent && plan.price > 0 && !plan.is_promo_active) {
    return {
      text: `SAVE ${discountPercent}%`,
      type: "discount",
      bgColor: theme.badgeBg,
    };
  }

  // 4. Popular - only shows if is_featured AND no other badges apply
  if (plan.is_featured) {
    return {
      text: "POPULAR",
      type: "featured",
      bgColor: theme.badgeBg,
    };
  }

  return null;
};

// ============================================
// FEATURE GENERATION
// ============================================

/**
 * Generates EXACTLY 4 features for consistent card height
 * 
 * LOGIC:
 * - Free plans (price = 0, no promo): Users, Branches, Basic Support, Email Assistance
 * - Paid plans without bonus: Users, Branches, Priority Support, All Core Features
 * - Paid plans with bonus: Users, Branches, +X Months Free (highlighted), Priority Support
 * 
 * This ensures exactly 4 items always
 */
export const generateFeatures = (plan) => {
  const features = [];
  
  // Check if truly free (price = 0 and not a promo plan)
  const isTrulyFree = plan.price === 0 && !plan.is_promo_active;
  const hasBonus = plan.bonus_months > 0;

  // 1. Users limit (always first)
  const usersText =
    plan.max_users === -1
      ? "Unlimited Users"
      : `Up to ${plan.max_users} User${plan.max_users > 1 ? "s" : ""}`;
  features.push({ text: usersText, highlight: false });

  // 2. Branches limit (always second)
  const branchesText =
    plan.max_branches === -1
      ? "Unlimited Branches"
      : plan.max_branches === 1
        ? "Single Branch"
        : `Up to ${plan.max_branches} Branches`;
  features.push({ text: branchesText, highlight: false });

  // 3 & 4 depend on plan type
  if (isTrulyFree) {
    // Free plan: Basic Support, Email Assistance
    features.push({ text: "Basic Support", highlight: false });
    features.push({ text: "Email Assistance", highlight: false });
  } else if (hasBonus) {
    // Paid with bonus: Bonus Months (highlighted), Priority Support
    features.push({
      text: `+${plan.bonus_months} Month${plan.bonus_months > 1 ? "s" : ""} Free`,
      highlight: true,
    });
    features.push({ text: "Priority Support", highlight: false });
  } else {
    // Paid without bonus: Priority Support, All Core Features
    features.push({ text: "Priority Support", highlight: false });
    features.push({ text: "All Core Features", highlight: false });
  }

  return features;
};

// ============================================
// DATE CALCULATION (Mirrors Backend)
// ============================================

/**
 * Calculate subscription dates for display
 * Mirrors backend logic for consistency
 */
export const calculateDisplayDates = (plan) => {
  const now = new Date();
  const startDate = new Date(now);

  // Determine reference date for end calculation
  let referenceDate = new Date(now);

  if (plan.is_promo_active && plan.promo_free_until) {
    const promoDate = new Date(plan.promo_free_until);
    if (promoDate > now) {
      referenceDate = promoDate;
    }
  }

  // Calculate total months
  const billingCycleMonths = plan.billing_cycle_months || 12;
  const bonusMonths = plan.bonus_months || 0;
  const totalMonths = billingCycleMonths + bonusMonths;

  // Calculate end date
  const endDate = new Date(referenceDate);
  endDate.setMonth(endDate.getMonth() + totalMonths);

  return {
    startDate,
    endDate,
    referenceDate,
    totalMonths,
    billingCycleMonths,
    bonusMonths,
    isPromoActive: plan.is_promo_active,
    promoEndDate: plan.promo_free_until ? new Date(plan.promo_free_until) : null,
  };
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format short date (for badges)
 */
export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};