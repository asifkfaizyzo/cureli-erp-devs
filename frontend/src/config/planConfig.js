// frontend/src/config/planConfig.js

// ============================================
// BILLING
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
  free: {
    gradient: "from-emerald-50 to-teal-100",
    hoverGradient: "hover:from-emerald-600 hover:to-teal-600",
    accentColor: "text-emerald-600",
    borderAccent: "border-emerald-300",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  default: {
    gradient: "from-blue-50 to-indigo-100",
    hoverGradient: "hover:from-[#000060] hover:to-[#000080]",
    accentColor: "text-[#000060]",
    borderAccent: "border-blue-200",
    buttonBg: "bg-[#000060] hover:bg-[#000080] text-white",
  },
  highlighted: {
    gradient: "from-violet-100 to-purple-100",
    hoverGradient: "hover:from-violet-600 hover:to-purple-600",
    accentColor: "text-violet-600",
    borderAccent: "border-violet-300",
    buttonBg: "bg-violet-600 hover:bg-violet-700 text-white",
  },
  custom: {
    gradient: "from-amber-50 to-orange-100",
    hoverGradient: "hover:from-amber-600 hover:to-orange-600",
    accentColor: "text-amber-600",
    borderAccent: "border-amber-300 border-dashed",
    buttonBg: "bg-amber-600 hover:bg-amber-700",
  },
};

// ============================================
// HELPERS
// ============================================

/**
 * Convert paisa to rupees (if needed)
 */
export const toRupees = (paisa) => {
  if (paisa === null || paisa === undefined) return 0;
  return Number(paisa);
};

/**
 * Format price for display
 * @param {number} price - Price value from backend
 */
export const formatPrice = (price) => {
  if (price === 0) return "FREE";
  const amount = toRupees(price);
  return `${BILLING.currency}${amount.toLocaleString("en-IN")}`;
};

/**
 * Format limit for display
 * @param {number} value - Limit value (-1 means unlimited)
 */
export const formatLimit = (value) => {
  if (value === -1) return "Unlimited";
  return value.toString();
};

/**
 * Determines card theme based on plan properties
 */
export const getCardTheme = (plan) => {
  if (plan.price === 0) return CARD_THEMES.free;
  if (plan.is_highlighted) return CARD_THEMES.highlighted;
  return CARD_THEMES.default;
};

/**
 * Generates feature list from plan limits
 */
export const generateFeatures = (plan) => {
  const features = [];

  const users = plan.max_users;
  const branches = plan.max_branches;

  if (users !== undefined) {
    if (users === -1) {
      features.push("Unlimited users");
    } else {
      features.push(`Up to ${users} user${users > 1 ? "s" : ""}`);
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

  // Add some default features based on plan type
  if (plan.price === 0) {
    features.push("Basic support");
    features.push("Email assistance");
  } else {
    features.push("Priority support");
    features.push("All core features");
  }

  return features;
};