// ============================================
// NOTIFICATION EVENTS - Single Source of Truth
// ============================================

export const NOTIFICATION_EVENTS = {
  // ─────────────────────────────────────────
  // SHOP & VERIFICATION
  // ─────────────────────────────────────────
  SHOP_VERIFIED: "SHOP_VERIFIED",
  DOCUMENT_REJECTED: "DOCUMENT_REJECTED",
  DOCUMENT_PARTIALLY_REJECTED: "DOCUMENT_PARTIALLY_REJECTED",

  // ─────────────────────────────────────────
  // TICKETS
  // ─────────────────────────────────────────
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_STATUS_CHANGED: "TICKET_STATUS_CHANGED",

  // ─────────────────────────────────────────
  // PASSWORD RESET
  // ─────────────────────────────────────────
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  CADMIN_PASSWORD_RESET_REQUESTED: "CADMIN_PASSWORD_RESET_REQUESTED",

  // ─────────────────────────────────────────
  // SUBSCRIPTION LIFECYCLE
  // ─────────────────────────────────────────
  SUBSCRIPTION_ACTIVATED: "SUBSCRIPTION_ACTIVATED",
  SUBSCRIPTION_EXPIRING_7_DAYS: "SUBSCRIPTION_EXPIRING_7_DAYS",
  SUBSCRIPTION_EXPIRING_3_DAYS: "SUBSCRIPTION_EXPIRING_3_DAYS",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  SUBSCRIPTION_GRACE_STARTED: "SUBSCRIPTION_GRACE_STARTED",
  SUBSCRIPTION_GRACE_ENDING: "SUBSCRIPTION_GRACE_ENDING",
  SUBSCRIPTION_SUSPENDED: "SUBSCRIPTION_SUSPENDED",
  SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",

  // ─────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",

  // ─────────────────────────────────────────
  // SYSTEM / BROADCAST
  // ─────────────────────────────────────────
  SYSTEM_BROADCAST: "SYSTEM_BROADCAST",

  // ─────────────────────────────────────────
  // USER MANAGEMENT (Future)
  // ─────────────────────────────────────────
  USER_INVITED: "USER_INVITED",
  USER_DEACTIVATED: "USER_DEACTIVATED",

  ENQUIRY_RECEIVED: "ENQUIRY_RECEIVED",
  ENQUIRY_REPLIED: "ENQUIRY_REPLIED",
  EMAIL_VERIFICATION_OTP: "EMAIL_VERIFICATION_OTP",
  EMAIL_CHANGE_OTP: "EMAIL_CHANGE_OTP",
  EMAIL_CHANGED: "EMAIL_CHANGED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PHONE_CHANGED: "PHONE_CHANGED",
};

// ============================================
// EVENT METADATA - Defines behavior per event
// ============================================

export const EVENT_CONFIG = {
  [NOTIFICATION_EVENTS.ENQUIRY_RECEIVED]: {
    description: "Enquiry confirmation sent to user",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.ENQUIRY_REPLIED]: {
    description: "CAdmin replied to enquiry",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.EMAIL_VERIFICATION_OTP]: {
    description: "Email OTP for signup verification",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.EMAIL_CHANGE_OTP]: {
    description: "OTP for email change verification",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.EMAIL_CHANGED]: {
    description: "Email address changed notification",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.PASSWORD_CHANGED]: {
    description: "Password changed notification",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.PHONE_CHANGED]: {
    description: "Phone number changed notification",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SHOP_VERIFIED]: {
    description: "Shop verification completed successfully",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.DOCUMENT_REJECTED]: {
    description: "One or more documents were rejected",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.DOCUMENT_PARTIALLY_REJECTED]: {
    description: "Some documents approved, some rejected",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.TICKET_CREATED]: {
    description: "Support ticket created",
    defaultChannels: ["email"],
    audienceType: "ticket_creator",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED]: {
    description: "Ticket status updated by admin",
    defaultChannels: ["email"],
    audienceType: "ticket_creator",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.PASSWORD_RESET_REQUESTED]: {
    description: "User requested password reset",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.CADMIN_PASSWORD_RESET_REQUESTED]: {
    description: "CAdmin requested password reset",
    defaultChannels: ["email"],
    audienceType: "direct_cadmin",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED]: {
    description: "Subscription activated successfully",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS]: {
    description: "Subscription expires in 7 days",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS]: {
    description: "Subscription expires in 3 days",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRED]: {
    description: "Subscription has expired",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED]: {
    description: "Grace period has started",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING]: {
    description: "Grace period ending tomorrow",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED]: {
    description: "Subscription suspended due to non-payment",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "critical",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_RENEWED]: {
    description: "Subscription renewed successfully",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.PAYMENT_SUCCESS]: {
    description: "Payment completed successfully",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.PAYMENT_FAILED]: {
    description: "Payment attempt failed",
    defaultChannels: ["email"],
    audienceType: "shop_owner",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.SYSTEM_BROADCAST]: {
    description: "System-wide announcement from CAdmin",
    defaultChannels: ["email"],
    audienceType: "broadcast_filter",
    priority: "normal",
  },
  [NOTIFICATION_EVENTS.USER_INVITED]: {
    description: "User invited to shop",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "high",
  },
  [NOTIFICATION_EVENTS.USER_DEACTIVATED]: {
    description: "User account deactivated",
    defaultChannels: ["email"],
    audienceType: "direct_user",
    priority: "normal",
  },
};

export default NOTIFICATION_EVENTS;
