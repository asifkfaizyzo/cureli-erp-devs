// ============================================
// AUDIT ACTIONS — IMMUTABLE BUSINESS FACTS
// ============================================
//
// ⚠️  LOCKED — DO NOT RENAME OR REMOVE
// ⚠️  Adding new actions is allowed
// ⚠️  Each action represents an irreversible business event
//
// Metadata examples are GUIDELINES, not enforced schemas.
// ============================================

export const AuditAction = Object.freeze({
  // ============================================
  // SHOP / ACCOUNT LIFECYCLE
  // ============================================
  // metadata: { owner_user_id, business_name, email }
  SHOP_ACCOUNT_CREATED: "SHOP_ACCOUNT_CREATED",

  // metadata: { onboarding_step, verification_status }
  SHOP_SETUP_COMPLETED: "SHOP_SETUP_COMPLETED",

  // metadata: { previous_status, activated_by }
  SHOP_ACTIVATED: "SHOP_ACTIVATED",

  // metadata: { reason, suspended_by }
  SHOP_SUSPENDED: "SHOP_SUSPENDED",

  // metadata: { overdue_amount, days_overdue, subscription_id }
  SHOP_SUSPENDED_DUE_TO_NON_PAYMENT: "SHOP_SUSPENDED_DUE_TO_NON_PAYMENT",

  // metadata: { changed_fields: [...], before: {...}, after: {...} }
  SHOP_DETAILS_UPDATED: "SHOP_DETAILS_UPDATED",

  // metadata: { plan_id, plan_name, assigned_by_cadmin_id }
  SHOP_PLAN_ASSIGNED_BY_ADMIN: "SHOP_PLAN_ASSIGNED_BY_ADMIN",

  // ============================================
  // USERS (ERP + ADMIN ACTIONS)
  // ============================================
  // metadata: { email, role, invited_by, branch_id }
  USER_CREATED: "USER_CREATED",

  // metadata: { changed_fields: [...], before: {...}, after: {...} }
  USER_PROFILE_UPDATED: "USER_PROFILE_UPDATED",

  // metadata: { changed_fields: [...], before: {...}, after: {...}, updated_by_cadmin_id }
  USER_PROFILE_UPDATED_BY_ADMIN: "USER_PROFILE_UPDATED_BY_ADMIN",

  // metadata: { previous_role, new_role }
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",

  // metadata: { previous_role, new_role, changed_by_cadmin_id }
  USER_ROLE_CHANGED_BY_ADMIN: "USER_ROLE_CHANGED_BY_ADMIN",

  // metadata: { previous_branch_id, new_branch_id }
  USER_BRANCH_CHANGED: "USER_BRANCH_CHANGED",

  // metadata: { reason, deactivated_by }
  USER_DEACTIVATED: "USER_DEACTIVATED",

  // metadata: { reactivated_by }
  USER_REACTIVATED: "USER_REACTIVATED",

  // metadata: { activated_by_cadmin_id }
  USER_ACTIVATED_BY_ADMIN: "USER_ACTIVATED_BY_ADMIN",

  // metadata: { reason, suspended_by_cadmin_id }
  USER_SUSPENDED_BY_ADMIN: "USER_SUSPENDED_BY_ADMIN",

  // metadata: { method: 'self' | 'reset_token' }
  USER_PASSWORD_CHANGED: "USER_PASSWORD_CHANGED",

  // metadata: { reset_method: 'email' | 'phone' }
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",

  // metadata: { reset_by_cadmin_id, method }
  USER_PASSWORD_RESET_BY_ADMIN: "USER_PASSWORD_RESET_BY_ADMIN",

  // metadata: { previous_email, new_email }
  USER_EMAIL_CHANGED: "USER_EMAIL_CHANGED",

  // metadata: { previous_phone, new_phone }
  USER_PHONE_CHANGED: "USER_PHONE_CHANGED",

  // ============================================
  // BRANCHES
  // ============================================
  // metadata: { branch_name, branch_type, created_by }
  BRANCH_CREATED: "BRANCH_CREATED",

  // metadata: { previous_name, new_name }
  BRANCH_RENAMED: "BRANCH_RENAMED",

  // metadata: { reason, deactivated_by }
  BRANCH_DEACTIVATED: "BRANCH_DEACTIVATED",

  // metadata: { reactivated_by }
  BRANCH_REACTIVATED: "BRANCH_REACTIVATED",

  // ============================================
  // SUBSCRIPTIONS / BILLING
  // ============================================
  // metadata: { plan_id, plan_name, billing_cycle, amount }
  SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED",

  // metadata: { plan_id, plan_name, payment_order_id }
  SUBSCRIPTION_CREATED_PENDING_PAYMENT: "SUBSCRIPTION_CREATED_PENDING_PAYMENT",

  // metadata: { subscription_id, payment_id, amount }
  SUBSCRIPTION_ACTIVATED: "SUBSCRIPTION_ACTIVATED",

  // metadata: { subscription_id, previous_end_date, new_end_date, payment_id }
  SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",

  // metadata: { reason, cancelled_by, effective_date }
  SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",

  // metadata: { previous_plan_id, new_plan_id, price_difference }
  PLAN_UPGRADED: "PLAN_UPGRADED",

  // metadata: { previous_plan_id, new_plan_id, affected_users_count, affected_branches_count }
  PLAN_DOWNGRADED: "PLAN_DOWNGRADED",

  // metadata: { grace_period_until, reason }
  SUBSCRIPTION_ENTERED_GRACE: "SUBSCRIPTION_ENTERED_GRACE",

  // metadata: { days_overdue, amount_due }
  PAYMENT_MARKED_OVERDUE: "PAYMENT_MARKED_OVERDUE",

  // metadata: { user_ids: [...], reason, new_plan_user_limit }
  USERS_DISABLED_DUE_TO_PLAN_DOWNGRADE: "USERS_DISABLED_DUE_TO_PLAN_DOWNGRADE",

  // metadata: { branch_ids: [...], reason, new_plan_branch_limit }
  BRANCHES_DEACTIVATED_DUE_TO_PLAN_DOWNGRADE:
    "BRANCHES_DEACTIVATED_DUE_TO_PLAN_DOWNGRADE",

  // ============================================
  // PLANS (CADMIN)
  // ============================================
  // metadata: { name, price, max_users, max_branches, type }
  PLAN_CREATED: "PLAN_CREATED",

  // metadata: { changed_fields: [...], before: {...}, after: {...} }
  PLAN_UPDATED: "PLAN_UPDATED",

  // metadata: { activated_by_cadmin_id }
  PLAN_ACTIVATED: "PLAN_ACTIVATED",

  // metadata: { reason, suspended_by_cadmin_id }
  PLAN_SUSPENDED: "PLAN_SUSPENDED",

  // metadata: { reactivated_by_cadmin_id }
  PLAN_REACTIVATED: "PLAN_REACTIVATED",

  // metadata: { source_plan_id, source_plan_name }
  PLAN_CLONED: "PLAN_CLONED",

  // metadata: { deleted_by_cadmin_id, reason }
  PLAN_DELETED: "PLAN_DELETED",

  // metadata: { reason, active_subscriptions_count }
  PLAN_AUTO_SUSPENDED_BY_CRON: "PLAN_AUTO_SUSPENDED_BY_CRON",

  // ============================================
  // DOCUMENTS / VERIFICATION
  // ============================================
  // metadata: { file_type, file_id, original_name }
  SHOP_DOCUMENT_UPLOADED: "SHOP_DOCUMENT_UPLOADED",

  // metadata: { file_id, file_type, resubmission_count }
  SHOP_DOCUMENT_RESUBMITTED: "SHOP_DOCUMENT_RESUBMITTED",

  // metadata: { file_type, file_id, uploaded_by_cadmin_id }
  SHOP_DOCUMENT_UPLOADED_BY_ADMIN: "SHOP_DOCUMENT_UPLOADED_BY_ADMIN",

  // metadata: { file_id, previous_file_id, replaced_by_cadmin_id }
  SHOP_DOCUMENT_REPLACED_BY_ADMIN: "SHOP_DOCUMENT_REPLACED_BY_ADMIN",

  // metadata: { file_id, file_type, verified_by_cadmin_id }
  SHOP_VERIFICATION_FILE_VERIFIED: "SHOP_VERIFICATION_FILE_VERIFIED",

  // metadata: { file_id, file_type, reason, rejected_by_cadmin_id }
  SHOP_VERIFICATION_FILE_REJECTED: "SHOP_VERIFICATION_FILE_REJECTED",

  // metadata: { file_ids: [...], verified_by_cadmin_id }
  SHOP_VERIFICATION_FILE_BATCH_VERIFIED:
    "SHOP_VERIFICATION_FILE_BATCH_VERIFIED",

  // metadata: { file_ids: [...], reason, rejected_by_cadmin_id }
  SHOP_VERIFICATION_FILE_BATCH_REJECTED:
    "SHOP_VERIFICATION_FILE_BATCH_REJECTED",

  // metadata: { verified_by_cadmin_id, total_files }
  SHOP_VERIFICATION_COMPLETED: "SHOP_VERIFICATION_COMPLETED",

  // metadata: { rejected_files: [...], reason }
  SHOP_VERIFICATION_PARTIALLY_REJECTED: "SHOP_VERIFICATION_PARTIALLY_REJECTED",

  // metadata: { reason, rejected_by_cadmin_id, all_files_rejected: boolean }
  SHOP_VERIFICATION_REJECTED: "SHOP_VERIFICATION_REJECTED",

  // ============================================
  // TICKETS / SUPPORT
  // ============================================
  // metadata: { ticket_number, category, subject, has_attachments, attachment_count }
  TICKET_CREATED: "TICKET_CREATED",
  // metadata: { reason, cancelled_by_user_id }
  TICKET_CANCELLED: "TICKET_CANCELLED",

  // metadata: { reason, reopened_by_user_id, reopen_count }
  TICKET_REOPENED: "TICKET_REOPENED",

  // metadata: { previous_status, new_status, updated_by_cadmin_id, note }
  TICKET_STATUS_UPDATED_BY_ADMIN: "TICKET_STATUS_UPDATED_BY_ADMIN",

  // metadata: { resolution_note, resolved_by_cadmin_id }
  TICKET_RESOLVED_BY_ADMIN: "TICKET_RESOLVED_BY_ADMIN",

  // metadata: { closed_by_cadmin_id, note }
  TICKET_CLOSED_BY_ADMIN: "TICKET_CLOSED_BY_ADMIN",

  // metadata: { reply_id, replied_by_cadmin_id, email_sent }
  ENQUIRY_REPLIED: "ENQUIRY_REPLIED",

  // metadata: { previous_status, new_status }
  ENQUIRY_STATUS_CHANGED: "ENQUIRY_STATUS_CHANGED",

  // ============================================
  // CADMIN (INTERNAL ADMINS)
  // ============================================
  // metadata: { username, role, created_by_cadmin_id }
  CADMIN_CREATED: "CADMIN_CREATED",

  // metadata: { changed_fields: [...], before: {...}, after: {...} }
  CADMIN_PROFILE_UPDATED: "CADMIN_PROFILE_UPDATED",

  // metadata: { previous_role, new_role, changed_by_cadmin_id }
  CADMIN_ROLE_CHANGED: "CADMIN_ROLE_CHANGED",

  // metadata: { activated_by_cadmin_id }
  CADMIN_ACTIVATED: "CADMIN_ACTIVATED",

  // metadata: { reason, suspended_by_cadmin_id }
  CADMIN_SUSPENDED: "CADMIN_SUSPENDED",

  // metadata: { reset_method }
  CADMIN_PASSWORD_RESET_COMPLETED: "CADMIN_PASSWORD_RESET_COMPLETED",

  // metadata: { login_method, session_id }
  CADMIN_LOGIN_SUCCESS: "CADMIN_LOGIN_SUCCESS",

  // metadata: { session_id, logout_type: 'manual' | 'expired' | 'forced' }
  CADMIN_LOGOUT: "CADMIN_LOGOUT",

  // ============================================
  // SYSTEM / AUTOMATION
  // ============================================
  // metadata: { title, target_audience, channels: [...] }
  SYSTEM_BROADCAST_CREATED: "SYSTEM_BROADCAST_CREATED",

    // metadata: { title, target_filters, recipient_count }
  BROADCAST_CREATED: "BROADCAST_CREATED",

  // metadata: { campaign_id, title, recipients, delivered }
  BROADCAST_SENT: "BROADCAST_SENT",

  // metadata: { campaign_id, scheduled_for }
  BROADCAST_SCHEDULED: "BROADCAST_SCHEDULED",

  // metadata: { campaign_id }
  BROADCAST_CANCELLED: "BROADCAST_CANCELLED",

  // metadata: { broadcast_id, recipients_count, channels: [...] }
  SYSTEM_BROADCAST_SENT: "SYSTEM_BROADCAST_SENT",

  // metadata: { broadcast_id, error, failed_recipients_count }
  SYSTEM_BROADCAST_FAILED: "SYSTEM_BROADCAST_FAILED",

  // metadata: { reason, enabled_by_cadmin_id, estimated_duration }
  SYSTEM_MAINTENANCE_ENABLED: "SYSTEM_MAINTENANCE_ENABLED",

  // metadata: { disabled_by_cadmin_id, actual_duration }
  SYSTEM_MAINTENANCE_DISABLED: "SYSTEM_MAINTENANCE_DISABLED",

  
   // ============================================
  // PURCHASE MODULE ACTIONS ✅
  // ============================================
  // metadata: { invoice_number, supplier_id, supplier_name, item_count, total_amount, paid_amount, payment_status }
  PURCHASE_INVOICE_CREATED: "PURCHASE_INVOICE_CREATED",
  
  // metadata: { invoice_number, invoice_status, updated_fields, old_item_count, new_item_count, old_net_amount, new_net_amount }
  PURCHASE_INVOICE_UPDATED: "PURCHASE_INVOICE_UPDATED",
  
  // metadata: { invoice_number, supplier_name, item_count, total_amount }
  PURCHASE_INVOICE_CONFIRMED: "PURCHASE_INVOICE_CONFIRMED",
  
  // metadata: { invoice_number, invoice_status, was_confirmed, updated_fields, old_item_count, new_item_count, old_net_amount, new_net_amount }
  PURCHASE_INVOICE_CONFIRMED_EDITED: "PURCHASE_INVOICE_CONFIRMED_EDITED",
  
  // metadata: { invoice_number, supplier_name, cancellation_reason }
  PURCHASE_INVOICE_CANCELLED: "PURCHASE_INVOICE_CANCELLED",
  
  // metadata: { invoice_number, payment_id, amount, payment_mode }
  PURCHASE_PAYMENT_CREATED: "PURCHASE_PAYMENT_CREATED",
  
  // metadata: { invoice_number, item_count, total_amount }
  PURCHASE_RETURN_CREATED: "PURCHASE_RETURN_CREATED",

  // ✅ NEW: Payment Status Actions
  // metadata: { invoice_number, supplier_name, old_payment_status, new_payment_status, old_paid_amount, new_paid_amount, net_amount }
  PURCHASE_PAYMENT_STATUS_UPDATED: "PURCHASE_PAYMENT_STATUS_UPDATED",
  
  // metadata: { invoice_number, payment_id, payment_amount, payment_mode, old_payment_status, new_payment_status, total_paid, balance_remaining }
  PURCHASE_PAYMENT_RECORDED: "PURCHASE_PAYMENT_RECORDED",


  PURCHASE_RETURN_CREATED: "PURCHASE_RETURN_CREATED",
  PURCHASE_RETURN_APPROVED: "PURCHASE_RETURN_APPROVED",
  PURCHASE_RETURN_REJECTED: "PURCHASE_RETURN_REJECTED",
  
  // Credit Notes
  CREDIT_NOTE_CREATED: "CREDIT_NOTE_CREATED",
  CREDIT_NOTE_APPLIED: "CREDIT_NOTE_APPLIED",
  CREDIT_NOTE_EXPIRED: "CREDIT_NOTE_EXPIRED",

   PURCHASE_RETURN_CANCELLED: "PURCHASE_RETURN_CANCELLED",
  PURCHASE_RETURN_REVERTED: "PURCHASE_RETURN_REVERTED",
});


/** a
 * Set for O(1) validation lookup
 */
export const VALID_ACTIONS = new Set(Object.values(AuditAction));

/**
 * Validate if an action string is valid
 * @param {string} action
 * @returns {boolean}
 */
export function isValidAction(action) {
  return VALID_ACTIONS.has(action);
}
