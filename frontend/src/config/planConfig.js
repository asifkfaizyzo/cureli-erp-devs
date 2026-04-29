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
// INTRO PRICING CONSTANTS
// ============================================

export const INTRO_TRIGGER_TYPE = {
  DURATION: "duration",
  DATE: "date",
};

// ============================================
// CARD THEMES
// ============================================

export const CARD_THEMES = {
  free: {
    gradient: "from-emerald-50 to-teal-100",
    hoverGradient: "from-emerald-600 to-teal-600",
    accentColor: "text-emerald-600",
    borderAccent: "border-emerald-300",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
    badgeBg: "bg-emerald-600",
  },
  featured: {
    gradient: "from-violet-50 to-purple-100",
    hoverGradient: "from-violet-500 to-purple-500",
    accentColor: "text-violet-600",
    borderAccent: "border-violet-300",
    buttonBg: "bg-violet-600 hover:bg-violet-700 text-white",
    badgeBg: "bg-violet-600",
  },
  default: {
    gradient: "from-blue-50 to-indigo-100",
    hoverGradient: "from-[#1a1a8c] to-[#2a2a9c]",
    accentColor: "text-[#000060]",
    borderAccent: "border-blue-200",
    buttonBg: "bg-[#000060] hover:bg-[#000080] text-white",
    badgeBg: "bg-[#000060]",
  },
  custom: {
    gradient: "from-amber-50 to-orange-100",
    hoverGradient: "from-amber-500 to-orange-500",
    accentColor: "text-amber-600",
    borderAccent: "border-amber-300 border-dashed",
    buttonBg: "bg-amber-600 hover:bg-amber-700 text-white",
    badgeBg: "bg-amber-600",
  },
  intro: {
    gradient: "from-sky-50 to-indigo-100",
    hoverGradient: "from-sky-500 to-indigo-500",
    accentColor: "text-sky-600",
    borderAccent: "border-sky-300",
    buttonBg: "bg-sky-600 hover:bg-sky-700 text-white",
    badgeBg: "bg-sky-600",
  },
  current: {
    gradient: "from-sky-100 via-gray-50 to-sky-100",
    hoverGradient: "from-sky-500 to-indigo-500",
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
// DURATION FORMATTING
// ============================================

/**
 * Formats months into a human-readable duration (months/years).
 *
 * Examples:
 *   3  → "3 months"
 *   12 → "1 year"
 *   24 → "2 years"
 *   14 → "1 year 2 months"
 */
export const formatDuration = (months) => {
  if (!months) return "";
  if (months === 12) return "1 year";
  if (months % 12 === 0) return `${months / 12} years`;
  if (months > 12) {
    const yrs = Math.floor(months / 12);
    const mnts = months % 12;
    return `${yrs} year${yrs > 1 ? "s" : ""} ${mnts} month${mnts > 1 ? "s" : ""}`;
  }
  return `${months} month${months > 1 ? "s" : ""}`;
};

// ============================================
// DISCOUNT CALCULATION
// ============================================

export const calculateDiscountPercent = (compareAtPrice, price) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

// ============================================
// INTRO PRICING HELPERS
// ============================================

/**
 * Check if intro pricing is active for display.
 * - duration: always true at plan level
 * - date: true if intro_end_date is in the future
 */
export const isIntroPriceActive = (plan) => {
  if (!plan?.intro_price || !plan?.intro_trigger_type) return false;

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DATE) {
    return plan.intro_end_date
      ? new Date(plan.intro_end_date) > new Date()
      : false;
  }

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
    return true;
  }

  return false;
};

/**
 * Get the price the shop will actually pay today.
 * - Intro active → intro_price
 * - Promo active (price=0 OR promo_free_until) → 0
 * - Otherwise → regular price
 */
export const getChargeablePrice = (plan) => {
  const promoActive =
    plan.is_promo_active ||
    (plan.promo_free_until && new Date(plan.promo_free_until) > new Date());

  if (plan.price === 0 || promoActive) return 0;

  if (isIntroPriceActive(plan) && plan.intro_price !== null) {
    return plan.intro_price;
  }

  return plan.price;
};

/**
 * Get a short human-readable label for the intro phase.
 *
 * Examples:
 *   "₹999 for 3 months"
 *   "₹999 for 1 year"
 *   "₹999 for 2 years"
 *   "₹999 until 15 Mar 2025"
 */
export const getIntroPhaseBadgeText = (plan) => {
  if (!isIntroPriceActive(plan)) return null;

  const formattedPrice = formatPrice(plan.intro_price);

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
    if (!plan.intro_duration_years) return null;
    const durationText = formatDuration(plan.intro_duration_years);
    return `${formattedPrice} for first ${durationText}`;
  }

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DATE) {
    if (!plan.intro_end_date) return null;
    const dateStr = new Date(plan.intro_end_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${formattedPrice} until ${dateStr}`;
  }

  return null;
};

/**
 * Get full two-phase description.
 *
 * Examples:
 *   "₹999/year for first 3 months, then ₹2999/year"
 *   "₹999/year for first 1 year, then ₹2999/year"
 *   "₹999/year for first 2 years, then ₹2999/year"
 *   "₹999/year until 15 Mar 2025, then ₹2999/year"
 */
export const getIntroPhaseDescription = (plan) => {
  if (!isIntroPriceActive(plan)) return null;

  const introFormatted = formatPrice(plan.intro_price);
  const regularFormatted = formatPrice(plan.price);

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
    if (!plan.intro_duration_years) return null;
    const durationText = formatDuration(plan.intro_duration_years);
    return `${introFormatted}${BILLING.displayText} for first ${durationText}, then ${regularFormatted}${BILLING.displayText}`;
  }

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DATE) {
    if (!plan.intro_end_date) return null;
    const dateStr = new Date(plan.intro_end_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${introFormatted}${BILLING.displayText} until ${dateStr}, then ${regularFormatted}${BILLING.displayText}`;
  }

  return null;
};

// ============================================
// THEME DETERMINATION
// ============================================

/**
 * Priority:
 * 1. is_featured → Purple (always, even with intro/promo)
 * 2. price = 0   → Green (free)
 * 3. intro active → Sky/Indigo
 * 4. Everything else → Navy Blue (default)
 */
export const getCardTheme = (plan) => {
  if (plan.is_featured) return CARD_THEMES.featured;
  if (plan.price === 0) return CARD_THEMES.free;
  if (isIntroPriceActive(plan)) return CARD_THEMES.intro;
  return CARD_THEMES.default;
};

// ============================================
// BADGE DETERMINATION
// ============================================

/**
 * Priority (highest first):
 * 1. Intro pricing active
 * 2. Free Until (promo active with date)
 * 3. Bonus Months
 * 4. Price Reduced (discount)
 * 5. Popular (is_featured, no other badges)
 */
export const getPlanBadge = (plan) => {
  const theme = getCardTheme(plan);

  // 1. Intro pricing - highest priority for paid plans
  if (isIntroPriceActive(plan) && plan.price > 0) {
    const badgeText = getIntroPhaseBadgeText(plan);
    if (badgeText) {
      return {
        text: badgeText.toUpperCase(),
        type: "intro",
        bgColor: CARD_THEMES.intro.badgeBg,
      };
    }
  }

  // 2. Free Until promo
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

  // 3. Bonus months
  if (plan.bonus_months > 0) {
    return {
      text: `+${plan.bonus_months} MONTHS FREE`,
      type: "bonus",
      bgColor: theme.badgeBg,
    };
  }

  // 4. Price reduced
  const discountPercent = calculateDiscountPercent(
    plan.compare_at_price,
    plan.price
  );
  if (discountPercent && plan.price > 0 && !plan.is_promo_active) {
    return {
      text: `SAVE ${discountPercent}%`,
      type: "discount",
      bgColor: theme.badgeBg,
    };
  }

  // 5. Popular
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
 * Generates EXACTLY 4 features for consistent card height.
 * Intro pricing adds a feature line when active.
 */
export const generateFeatures = (plan) => {
  const features = [];

  const isTrulyFree = plan.price === 0 && !plan.is_promo_active;
  const hasBonus = plan.bonus_months > 0;
  const hasIntro = isIntroPriceActive(plan);

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

  // 3 & 4
  if (isTrulyFree) {
    features.push({ text: "Basic Support", highlight: false });
    features.push({ text: "Email Assistance", highlight: false });
  } else if (hasIntro) {
    features.push({
      text: `Intro: ${formatPrice(plan.intro_price)}${BILLING.displayText}`,
      highlight: true,
      type: "intro",
    });
    features.push({
      text: `Then ${formatPrice(plan.price)}${BILLING.displayText}`,
      highlight: false,
    });
  } else if (hasBonus) {
    features.push({
      text: `+${plan.bonus_months} Month${plan.bonus_months > 1 ? "s" : ""} Free`,
      highlight: true,
    });
    features.push({ text: "Priority Support", highlight: false });
  } else {
    features.push({ text: "Priority Support", highlight: false });
    features.push({ text: "All Core Features", highlight: false });
  }

  return features;
};

// ============================================
// DATE CALCULATION
// ============================================

/**
 * Calculate subscription dates for display.
 * Mirrors backend logic for consistency.
 */
export const calculateDisplayDates = (plan) => {
  const now = new Date();
  const startDate = new Date(now);

  let referenceDate = new Date(now);

  if (plan.is_promo_active && plan.promo_free_until) {
    const promoDate = new Date(plan.promo_free_until);
    if (promoDate > now) {
      referenceDate = promoDate;
    }
  }

  const billingCycleMonths = plan.billing_cycle_months || 12;
  const bonusMonths = plan.bonus_months || 0;
  const totalMonths = billingCycleMonths + bonusMonths;

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
    promoEndDate: plan.promo_free_until
      ? new Date(plan.promo_free_until)
      : null,
  };
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};