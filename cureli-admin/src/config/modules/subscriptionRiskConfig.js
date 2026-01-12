// src/config/modules/subscriptionRiskConfig.js

// ============================================
// TIME RANGE OPTIONS
// ============================================

export const TIME_RANGE_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

export const DEFAULT_TIME_RANGE = 30;

// ============================================
// TAB DEFINITIONS
// ============================================

export const RISK_TABS = {
  EXPIRING: "expiring",
  GRACE_PERIOD: "gracePeriod",
  SUSPENDED: "suspended",
};

export const TAB_CONFIG = [
  {
    id: RISK_TABS.EXPIRING,
    label: "Expiring Soon",
    description: "Subscriptions ending within selected range",
    emptyTitle: "No expiring subscriptions",
    emptySubtitle: "No subscriptions are expiring in the selected time range",
    color: "blue",
  },
  {
    id: RISK_TABS.GRACE_PERIOD,
    label: "In Grace Period",
    description: "Subscriptions past end date, in grace period",
    emptyTitle: "No subscriptions in grace period",
    emptySubtitle: "All subscriptions are current or have been suspended",
    color: "amber",
  },
  {
    id: RISK_TABS.SUSPENDED,
    label: "Suspended",
    description: "Inactive subscriptions requiring attention",
    emptyTitle: "No suspended subscriptions",
    emptySubtitle: "All subscriptions are active",
    color: "red",
  },
];

// ============================================
// TABLE COLUMNS PER TAB
// ============================================

export const EXPIRING_COLUMNS = [
  { key: "slNo", label: "#", width: 50, sortable: false },
  { key: "shop_name", label: "Shop Name", width: 180, sortable: true },
  { key: "plan_name", label: "Plan", width: 120, sortable: true },
  { key: "end_date", label: "Expires On", width: 110, sortable: true },
  { key: "days_left", label: "Days Left", width: 90, sortable: true },
  { key: "payment_status", label: "Payment", width: 100, sortable: false },
  { key: "actions", label: "Actions", width: 120, sortable: false },
];

export const GRACE_PERIOD_COLUMNS = [
  { key: "slNo", label: "#", width: 50, sortable: false },
  { key: "shop_name", label: "Shop Name", width: 180, sortable: true },
  { key: "plan_name", label: "Plan", width: 120, sortable: true },
  { key: "grace_period_until", label: "Grace Ends", width: 110, sortable: true },
  { key: "days_left", label: "Days Left", width: 90, sortable: true },
  { key: "payment_status", label: "Payment", width: 100, sortable: false },
  { key: "actions", label: "Actions", width: 120, sortable: false },
];

export const SUSPENDED_COLUMNS = [
  { key: "slNo", label: "#", width: 50, sortable: false },
  { key: "shop_name", label: "Shop Name", width: 180, sortable: true },
  { key: "plan_name", label: "Plan", width: 120, sortable: true },
  { key: "updated_at", label: "Suspended On", width: 120, sortable: true },
  { key: "owner_name", label: "Owner", width: 140, sortable: true },
  { key: "actions", label: "Actions", width: 120, sortable: false },
];

// ============================================
// BADGE STYLES
// ============================================

export const PAYMENT_STATUS_BADGES = {
  paid: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  free_promo: {
    label: "Promo",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export const DAYS_LEFT_STYLES = {
  critical: "bg-red-100 text-red-700 font-bold", // <= 3 days
  warning: "bg-amber-100 text-amber-700 font-medium", // <= 7 days
  normal: "bg-gray-100 text-gray-700", // > 7 days
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getDaysLeftStyle(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return DAYS_LEFT_STYLES.normal;
  if (daysLeft <= 3) return DAYS_LEFT_STYLES.critical;
  if (daysLeft <= 7) return DAYS_LEFT_STYLES.warning;
  return DAYS_LEFT_STYLES.normal;
}

export function getPaymentStatusBadge(status) {
  return PAYMENT_STATUS_BADGES[status] || PAYMENT_STATUS_BADGES.pending;
}

export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDaysLeft(days) {
  if (days === null || days === undefined) return "—";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}