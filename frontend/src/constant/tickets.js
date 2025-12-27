// frontend/src/constant/tickets.js (or constants/tickets.js)

/**
 * ============================================
 * TICKET CATEGORIES
 * ============================================
 */
export const TICKET_CATEGORIES = {
  TECHNICAL_ISSUE: "Technical Issue",
  BILLING_ISSUE: "Billing Issue",
  FEATURE_REQUEST: "Feature Request",
  ACCOUNT_ISSUE: "Account Issue",
  OTHER: "Other",
};

export const TICKET_CATEGORY_OPTIONS = [
  { value: "TECHNICAL_ISSUE", label: "Technical Issue" },
  { value: "BILLING_ISSUE", label: "Billing Issue" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "ACCOUNT_ISSUE", label: "Account Issue" },
  { value: "OTHER", label: "Other" },
];

/**
 * ============================================
 * TICKET STATUSES
 * ============================================
 */
export const TICKET_STATUSES = {
  PENDING: "Pending",        // ✅ Changed from OPEN
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
};

export const TICKET_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },        // ✅ Changed from OPEN
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "CLOSED", label: "Closed" },
];

/**
 * ============================================
 * TIME SLOTS
 * ============================================
 */
export const TIME_SLOTS = [
  { value: "09:00-10:00", label: "09:00 AM - 10:00 AM" },
  { value: "10:00-11:00", label: "10:00 AM - 11:00 AM" },
  { value: "11:00-12:00", label: "11:00 AM - 12:00 PM" },
  { value: "12:00-13:00", label: "12:00 PM - 01:00 PM" },
  { value: "13:00-14:00", label: "01:00 PM - 02:00 PM" },
  { value: "14:00-15:00", label: "02:00 PM - 03:00 PM" },
  { value: "15:00-16:00", label: "03:00 PM - 04:00 PM" },
  { value: "16:00-17:00", label: "04:00 PM - 05:00 PM" },
];

/**
 * ============================================
 * STATUS BADGE COLORS
 * ============================================
 */
export const STATUS_COLORS = {
  PENDING: {                                    // ✅ Changed from OPEN
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  IN_PROGRESS: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  RESOLVED: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  CANCELLED: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  CLOSED: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

/**
 * ============================================
 * CATEGORY BADGE COLORS
 * ============================================
 */
export const CATEGORY_COLORS = {
  TECHNICAL_ISSUE: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
  },
  BILLING_ISSUE: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  FEATURE_REQUEST: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  ACCOUNT_ISSUE: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  OTHER: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};

/**
 * ============================================
 * FILE UPLOAD LIMITS
 * ============================================
 */
export const ATTACHMENT_CONFIG = {
  MAX_FILES: 3,
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"],
};
