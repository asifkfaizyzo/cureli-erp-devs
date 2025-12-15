// Subscription Plan Configuration
// Defines statuses, themes, actions, and display settings

import { 
  FileEdit, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Sparkles,
  LayoutGrid 
} from "lucide-react";

// ============================================
// PLAN STATUSES
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
  [PLAN_STATUS.DRAFT]: ["edit", "activate", "clone"],
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
  highlighted: {
    gradient: "from-violet-100 to-purple-100",
    hoverGradient: "hover:from-violet-600 hover:to-purple-600",
    accentColor: "text-violet-600",
    borderAccent: "border-violet-300",
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
// HELPERS
// ============================================

/**
 * Determines card theme based on plan properties
 */
export const getCardTheme = (plan) => {
  if (plan.price === 0) return CARD_THEMES.free;
  if (plan.isHighlighted) return CARD_THEMES.highlighted;
  return CARD_THEMES.default;
};

/**
 * Generates feature list from plan limits
 */
export const generateFeatures = (plan) => {
  const features = [];
  
  if (plan.usersLimit !== undefined) {
    if (plan.usersLimit === -1) {
      features.push("Unlimited users");
    } else {
      features.push(`Up to ${plan.usersLimit} users`);
    }
  }
  
  if (plan.branchesLimit !== undefined) {
    if (plan.branchesLimit === -1) {
      features.push("Unlimited branches");
    } else if (plan.branchesLimit === 1) {
      features.push("Single branch");
    } else {
      features.push(`Up to ${plan.branchesLimit} branches`);
    }
  }
  
  return features;
};

/**
 * Formats price for display
 */
export const formatPrice = (price) => {
  if (price === 0) return "FREE";
  return `${BILLING.currency}${price.toLocaleString("en-IN")}`;
};

/**
 * Checks if plan name is available for activation
 */
export const isNameAvailable = (name, plans, excludeId = null) => {
  return !plans.some(
    (p) => 
      p.name.toLowerCase() === name.toLowerCase() && 
      p.status === PLAN_STATUS.ACTIVE &&
      p.id !== excludeId
  );
};

/**
 * Generates cloned plan name
 */
export const generateCloneName = (originalName, existingPlans) => {
  let baseName = originalName.replace(/\s*\(Copy(?:\s*\d+)?\)\s*$/, "");
  let copyName = `${baseName} (Copy)`;
  let counter = 1;
  
  while (existingPlans.some(p => p.name === copyName)) {
    counter++;
    copyName = `${baseName} (Copy ${counter})`;
  }
  
  return copyName;
};