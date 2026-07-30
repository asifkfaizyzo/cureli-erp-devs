/**
 * =============================================================================
 * backend\src\config\cadminPermissions.js
 * =============================================================================
 *
 * WHAT THIS FILE IS:
 * The single source of truth for all CAdmin (internal platform admin) permissions.
 * This is a CODE-OWNED registry. Permissions are defined here, not in the database.
 * The database only stores which permission strings belong to which custom role.
 *
 * ARCHITECTURE OVERVIEW:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SUPER_CADMIN → is_super_cadmin = true → bypasses all checks   │
 * │  Other admins → assigned custom roles → union of permissions   │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * HOW TO ADD A NEW PERMISSION (for future developers or LLMs):
 * ─────────────────────────────────────────────────────────────────
 * Step 1: Add a new constant to CADMIN_PERMISSIONS under the correct module section
 *         Convention: MODULE_ACTION in SCREAMING_SNAKE_CASE as key
 *                     "module.action" in dot.snake_case as value
 *         Example:    REPORTS_VIEW_SALES: "reports.view_sales"
 *
 * Step 2: Add it to the correct group in CADMIN_PERMISSION_GROUPS
 *         This controls how it appears in the role creation checklist UI.
 *         Pick the right module group and add { key, label, description }
 *
 * Step 3: Add enforcement to the relevant backend route file
 *         Import requireCAdminPermission from middleware/requireCAdminPermission.js
 *         Add it as middleware on the specific route
 *         Example: router.get("/reports", requireCAdminPermission(CADMIN_PERMISSIONS.REPORTS_VIEW_SALES), handler)
 *
 * Step 4: Add UI gate in pharmacy-web if needed
 *         The pharmacy-web reads permissions from AuthContext → admin.permissions[]
 *         Use the useCAdminPermission() hook: const { hasPermission } = useCAdminPermission()
 *         Example: hasPermission("reports.view_sales")
 *
 * NAMING CONVENTION:
 * ─────────────────────────────────────────────────────────────────
 * Key format:   MODULE_ACTION         (e.g. SHOPS_TOGGLE_ACTIVE)
 * Value format: "module.action"       (e.g. "shops.toggle_active")
 * Module:       lowercase snake_case noun
 * Action:       snake_case verb or verb_noun phrase
 *
 * DO NOT:
 * - Store permission definitions in the database (only the strings assigned to roles)
 * - Use generic actions like "manage" or "admin" — be explicit about what the action does
 * - Add permissions without adding them to CADMIN_PERMISSION_GROUPS
 * =============================================================================
 */

// =============================================================================
// PERMISSION CONSTANTS
// =============================================================================

export const CADMIN_PERMISSIONS = {
  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: ADMIN MANAGEMENT
  // Covers: CAdmin accounts (the internal team managing the platform)
  // ─────────────────────────────────────────────────────────────────────────
  ADMINS_VIEW: "admins.view", // List all admins
  ADMINS_VIEW_DETAIL: "admins.view_detail", // View single admin profile
  ADMINS_VIEW_ACTIVITY: "admins.view_activity", // View admin activity logs
  ADMINS_CREATE: "admins.create", // Create new admin account
  ADMINS_EDIT: "admins.edit", // Edit admin profile / role assignments
  ADMINS_TOGGLE_ACCESS: "admins.toggle_access", // Activate or deactivate admin account

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: USER MANAGEMENT
  // Covers: ERP users (pharmacy shop staff using the ERP system)
  // ─────────────────────────────────────────────────────────────────────────
  USERS_VIEW: "users.view", // List all ERP users
  USERS_VIEW_DETAIL: "users.view_detail", // View single user profile
  USERS_EDIT: "users.edit", // Edit user profile fields
  USERS_TOGGLE_ACCESS: "users.toggle_access", // Activate or deactivate user account
  USERS_RESET_PASSWORD: "users.reset_password", // Send password reset link to user
  USERS_DELETE: "users.delete", // Soft-delete a user account — anonymises PII, frees unique fields

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: SHOP MANAGEMENT
  // Covers: Pharmacy shop accounts registered on the platform
  // ─────────────────────────────────────────────────────────────────────────
  SHOPS_VIEW: "shops.view", // List all shops
  SHOPS_VIEW_DETAIL: "shops.view_detail", // View single shop full profile
  SHOPS_VIEW_STATS: "shops.view_stats", // View shop aggregate stats
  SHOPS_EDIT: "shops.edit", // Edit shop details
  SHOPS_TOGGLE_ACTIVE: "shops.toggle_active", // Suspend or activate shop
  SHOPS_UPDATE_SUBSCRIPTION: "shops.update_subscription", // Modify shop subscription details
  SHOPS_UPLOAD_DOCUMENTS: "shops.upload_documents", // Upload documents on behalf of shop

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: PLAN MANAGEMENT
  // Covers: Subscription plans offered on the platform
  // ─────────────────────────────────────────────────────────────────────────
  PLANS_VIEW: "plans.view", // List all plans
  PLANS_VIEW_DETAIL: "plans.view_detail", // View single plan details
  PLANS_VIEW_STATS: "plans.view_stats", // View plan subscriber counts and stats
  PLANS_CREATE: "plans.create", // Create a new plan (starts as DRAFT)
  PLANS_EDIT: "plans.edit", // Edit plan fields (DRAFT only)
  PLANS_ACTIVATE: "plans.activate", // Transition plan DRAFT → ACTIVE
  PLANS_SUSPEND: "plans.suspend", // Transition plan ACTIVE → SUSPENDED/DEPRECATED
  PLANS_REACTIVATE: "plans.reactivate", // Transition plan SUSPENDED → ACTIVE
  PLANS_CLONE: "plans.clone", // Clone any plan into a new DRAFT
  PLANS_DELETE: "plans.delete", // Soft delete a DRAFT plan

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: SUBSCRIPTION MANAGEMENT
  // Covers: Active shop subscriptions — monitoring and intervention actions
  // ─────────────────────────────────────────────────────────────────────────
  SUBSCRIPTIONS_VIEW_AT_RISK: "subscriptions.view_at_risk", // View expiring/grace/suspended list
  SUBSCRIPTIONS_VIEW_DETAIL: "subscriptions.view_detail", // View single subscription details
  SUBSCRIPTIONS_SEND_REMINDER: "subscriptions.send_reminder", // Send payment reminder to shop
  SUBSCRIPTIONS_EXTEND_GRACE: "subscriptions.extend_grace", // Extend grace period for shop
  SUBSCRIPTIONS_FORCE_SUSPEND: "subscriptions.force_suspend", // Force suspend a subscription
  SUBSCRIPTIONS_REACTIVATE: "subscriptions.reactivate", // Reactivate a suspended subscription

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: TICKETS
  // Covers: Support tickets submitted by shop users
  // ─────────────────────────────────────────────────────────────────────────
  TICKETS_VIEW: "tickets.view", // List all tickets
  TICKETS_VIEW_DETAIL: "tickets.view_detail", // View single ticket
  TICKETS_VIEW_STATS: "tickets.view_stats", // View ticket stats/counts
  TICKETS_VIEW_HISTORY: "tickets.view_history", // View ticket status change history
  TICKETS_UPDATE_STATUS: "tickets.update_status", // Update ticket status (resolve, close, etc.)

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: MASTER MEDICINES
  // Covers: Platform-wide medicine catalog management and mapping
  // ─────────────────────────────────────────────────────────────────────────
  MASTER_MEDICINES_VIEW: "master_medicines.view", // View catalog, variants, linked, stats, filters, autocomplete
  MASTER_MEDICINES_CREATE: "master_medicines.create", // Create new master medicine entry
  MASTER_MEDICINES_MANAGE_MAPPING: "master_medicines.manage_mapping", // Accept/reject/match/ignore/unlink medicine mappings
  MASTER_MEDICINES_MANAGE_IMAGES: "master_medicines.manage_images", // Upload and delete medicine images

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: DASHBOARD
  // Covers: Platform overview KPIs, charts, activity feeds
  // ─────────────────────────────────────────────────────────────────────────
  DASHBOARD_VIEW: "dashboard.view", // Access dashboard and all its data endpoints

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: DOCUMENT VERIFICATION
  // Covers: KYC documents submitted by shops and users
  // ─────────────────────────────────────────────────────────────────────────
  DOCUMENTS_VIEW: "documents.view", // List shops pending verification
  DOCUMENTS_VIEW_SHOP_DETAIL: "documents.view_shop_detail", // View all documents for a specific shop
  DOCUMENTS_VIEW_FILE: "documents.view_file", // View a single document file
  DOCUMENTS_VERIFY: "documents.verify", // Mark a document as verified
  DOCUMENTS_REJECT: "documents.reject", // Reject a document with reason
  DOCUMENTS_BATCH_UPDATE: "documents.batch_update", // Batch verify or reject multiple documents

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: AUDIT
  // Covers: System-wide audit trail of all admin actions
  // ─────────────────────────────────────────────────────────────────────────
  AUDIT_VIEW: "audit.view", // List audit logs with filters
  AUDIT_VIEW_DETAIL: "audit.view_detail", // View single audit log entry
  AUDIT_VIEW_STATS: "audit.view_stats", // View audit statistics
  AUDIT_EXPORT: "audit.export", // Export audit logs as CSV

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: ENQUIRIES
  // Covers: Public contact/enquiry submissions and admin management of them
  // ─────────────────────────────────────────────────────────────────────────
  ENQUIRIES_VIEW: "enquiries.view", // List all enquiries
  ENQUIRIES_VIEW_STATS: "enquiries.view_stats", // View enquiry stats/counts
  ENQUIRIES_VIEW_DETAIL: "enquiries.view_detail", // Open a single enquiry
  ENQUIRIES_REPLY: "enquiries.reply", // Send a reply to an enquiry
  ENQUIRIES_UPDATE_STATUS: "enquiries.update_status", // Change enquiry status (open/closed/etc.)
  ENQUIRIES_DELETE: "enquiries.delete", // Permanently delete an enquiry

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: IN-APP BROADCAST
  // Covers: In-app notification broadcasts sent to platform users/admins
  // ─────────────────────────────────────────────────────────────────────────
  BROADCAST_INAPP_SEND: "broadcast_inapp.send", // Preview recipient count, send now, access filter helpers
  BROADCAST_INAPP_UPLOAD: "broadcast_inapp.upload", // Upload and delete broadcast attachments
  BROADCAST_INAPP_MANAGE_DRAFTS: "broadcast_inapp.manage_drafts", // Create, list, update, delete in-app drafts
  BROADCAST_INAPP_SCHEDULE: "broadcast_inapp.schedule", // Schedule broadcasts, view scheduled list, cancel/delete
  BROADCAST_INAPP_VIEW_HISTORY: "broadcast_inapp.view_history", // View sent broadcast history and individual broadcast detail
  BROADCAST_INAPP_MANAGE_SEGMENTS: "broadcast_inapp.manage_segments", // Create, list, and delete audience segments
  BROADCAST_INAPP_MANAGE_TEMPLATES: "broadcast_inapp.manage_templates", // Create, list, and use broadcast templates

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: BROADCAST - MOBILE
  // Covers: SMS / Mobile push notifications sent to platform users/admins
  // ─────────────────────────────────────────────────────────────────────────
  BROADCAST_MOBILE_SEND: "broadcast_mobile.send", // Preview recipient count, check quota, send now, access filter helpers

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: EMAIL BROADCAST
  // Covers: Mass email campaigns sent to platform users/admins
  // ─────────────────────────────────────────────────────────────────────────
  BROADCAST_EMAIL_SEND: "broadcast_email.send", // Preview recipient count, check quota, send now, send test email, access filter helpers
  BROADCAST_EMAIL_UPLOAD: "broadcast_email.upload", // Upload and delete inline images and attachments
  BROADCAST_EMAIL_MANAGE_DRAFTS: "broadcast_email.manage_drafts", // Create, list, update, delete email drafts
  BROADCAST_EMAIL_SCHEDULE: "broadcast_email.schedule", // Schedule campaigns, view scheduled list, cancel campaigns
  BROADCAST_EMAIL_VIEW_HISTORY: "broadcast_email.view_history", // View sent campaign history and individual campaign detail
  BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES: "broadcast_email.manage_unsubscribes", // View, export, add, bulk-add, and remove suppression list entries

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: SETTINGS
  // Covers: Personal-Cadmin Settings of their profile
  // ─────────────────────────────────────────────────────────────────────────
  SETTINGS_VIEW: "settings.view", // List settings
  SETTINGS_EDIT_IDENTITY: "settings.edit_identity", // Update name and username
  SETTINGS_EDIT_CONTACT: "settings.edit_contact", // Update email and phone
  SETTINGS_EDIT_PASSWORD: "settings.edit_password", // Update account password

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE: APP CONFIG
  // Covers: Mobile app display configuration — category images, visibility
  // ─────────────────────────────────────────────────────────────────────────
  APP_CONFIG_VIEW: "app_config.view",
  APP_CONFIG_MANAGE_CATEGORY_IMAGES: "app_config.manage_category_images",
};

// =============================================================================
// PERMISSION GROUPS
// Used by the role creation UI to render the permission checklist
// Each module is a group with labelled permissions
// =============================================================================

export const CADMIN_PERMISSION_GROUPS = [
  {
    module: "Admin Management",
    key: "admins",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.ADMINS_VIEW,
        label: "View Admins",
        description: "List all admin accounts",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_VIEW_DETAIL,
        label: "View Admin Detail",
        description: "Open individual admin profiles",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_VIEW_ACTIVITY,
        label: "View Admin Activity",
        description: "See per-admin activity logs",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_CREATE,
        label: "Create Admin",
        description: "Add new admin accounts",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_EDIT,
        label: "Edit Admin",
        description: "Update admin profile and role assignments",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_TOGGLE_ACCESS,
        label: "Disable / Enable Admin",
        description: "Activate or deactivate admin accounts",
      },
    ],
  },
  {
    module: "User Management",
    key: "users",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.USERS_VIEW,
        label: "View Users",
        description: "List all ERP users",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_VIEW_DETAIL,
        label: "View User Detail",
        description: "Open individual user profiles",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_EDIT,
        label: "Edit User",
        description: "Update user profile fields",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_TOGGLE_ACCESS,
        label: "Disable / Enable User",
        description: "Activate or deactivate user accounts",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_RESET_PASSWORD,
        label: "Reset Password",
        description: "Send password reset link to user",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_DELETE,
        label: "Delete User",
        description:
          "Permanently anonymise a user account. Frees email/username for reuse. Cannot be undone.",
      },
    ],
  },
  {
    module: "Shop Management",
    key: "shops",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.SHOPS_VIEW,
        label: "View Shops",
        description: "List all registered shops",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_VIEW_DETAIL,
        label: "View Shop Detail",
        description: "Open full shop profile",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_VIEW_STATS,
        label: "View Shop Stats",
        description: "View aggregate shop statistics",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_EDIT,
        label: "Edit Shop",
        description: "Modify shop details",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_TOGGLE_ACTIVE,
        label: "Suspend / Activate Shop",
        description: "Control shop access to the platform",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_UPDATE_SUBSCRIPTION,
        label: "Update Subscription",
        description: "Modify a shop's subscription details",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_UPLOAD_DOCUMENTS,
        label: "Upload Documents",
        description: "Upload documents on behalf of a shop",
      },
    ],
  },
  {
    module: "Plan Management",
    key: "plans",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.PLANS_VIEW,
        label: "View Plans",
        description: "List all subscription plans",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_VIEW_DETAIL,
        label: "View Plan Detail",
        description: "Open individual plan details",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_VIEW_STATS,
        label: "View Plan Stats",
        description: "See subscriber counts and plan metrics",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_CREATE,
        label: "Create Plan",
        description: "Create a new plan (starts as Draft)",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_EDIT,
        label: "Edit Plan",
        description: "Edit Draft plan fields",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_ACTIVATE,
        label: "Activate Plan",
        description: "Make a Draft plan live",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_SUSPEND,
        label: "Suspend Plan",
        description: "Stop new subscriptions to a plan",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_REACTIVATE,
        label: "Reactivate Plan",
        description: "Re-enable a suspended plan",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_CLONE,
        label: "Clone Plan",
        description: "Duplicate any plan into a new Draft",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_DELETE,
        label: "Delete Plan",
        description: "Permanently remove a Draft plan",
      },
    ],
  },
  {
    module: "Subscription Management",
    key: "subscriptions",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK,
        label: "View At-Risk Subscriptions",
        description: "See expiring, grace period, and suspended subscriptions",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_DETAIL,
        label: "View Subscription Detail",
        description: "Open individual subscription details",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_SEND_REMINDER,
        label: "Send Payment Reminder",
        description: "Trigger reminder email/SMS to shop",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_EXTEND_GRACE,
        label: "Extend Grace Period",
        description: "Give a shop more time before suspension",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_FORCE_SUSPEND,
        label: "Force Suspend",
        description: "Immediately suspend a subscription",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_REACTIVATE,
        label: "Reactivate Subscription",
        description: "Restore a suspended subscription",
      },
    ],
  },
  {
    module: "Tickets",
    key: "tickets",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.TICKETS_VIEW,
        label: "View Tickets",
        description: "List all support tickets",
      },
      {
        key: CADMIN_PERMISSIONS.TICKETS_VIEW_DETAIL,
        label: "View Ticket Detail",
        description: "Open individual ticket",
      },
      {
        key: CADMIN_PERMISSIONS.TICKETS_VIEW_STATS,
        label: "View Ticket Stats",
        description: "See ticket counts and status breakdown",
      },
      {
        key: CADMIN_PERMISSIONS.TICKETS_VIEW_HISTORY,
        label: "View Ticket History",
        description: "See status change history for a ticket",
      },
      {
        key: CADMIN_PERMISSIONS.TICKETS_UPDATE_STATUS,
        label: "Update Ticket Status",
        description: "Resolve, close, or reopen tickets",
      },
    ],
  },
  {
    module: "Master Medicines",
    key: "master_medicines",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW,
        label: "View Catalog",
        description:
          "Browse master medicine catalog, variants, and linked medicines",
      },
      {
        key: CADMIN_PERMISSIONS.MASTER_MEDICINES_CREATE,
        label: "Create Medicine",
        description: "Add new entries to the master catalog",
      },
      {
        key: CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING,
        label: "Manage Mapping",
        description:
          "Accept, reject, match, ignore, and unlink medicine mappings",
      },
      {
        key: CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_IMAGES,
        label: "Manage Images",
        description: "Upload and delete medicine images",
      },
    ],
  },
  {
    module: "Dashboard",
    key: "dashboard",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.DASHBOARD_VIEW,
        label: "View Dashboard",
        description:
          "Access platform overview, KPIs, charts, and activity feed",
      },
    ],
  },
  {
    module: "Document Verification",
    key: "documents",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_VIEW,
        label: "View Verification Queue",
        description: "List shops pending document verification",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_VIEW_SHOP_DETAIL,
        label: "View Shop Documents",
        description: "See all documents for a specific shop",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_VIEW_FILE,
        label: "View File",
        description: "Open and preview individual document files",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_VERIFY,
        label: "Verify Document",
        description: "Mark a document as verified",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_REJECT,
        label: "Reject Document",
        description: "Reject a document with a reason",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_BATCH_UPDATE,
        label: "Batch Update",
        description: "Verify or reject multiple documents at once",
      },
    ],
  },
  {
    module: "Audit Logs",
    key: "audit",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.AUDIT_VIEW,
        label: "View Audit Logs",
        description: "Browse the system audit trail",
      },
      {
        key: CADMIN_PERMISSIONS.AUDIT_VIEW_DETAIL,
        label: "View Log Detail",
        description: "Open individual audit log entries",
      },
      {
        key: CADMIN_PERMISSIONS.AUDIT_VIEW_STATS,
        label: "View Audit Stats",
        description: "See audit activity statistics",
      },
      {
        key: CADMIN_PERMISSIONS.AUDIT_EXPORT,
        label: "Export Audit Logs",
        description: "Download audit logs as CSV",
      },
    ],
  },
  {
    module: "Enquiries",
    key: "enquiries",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
        label: "View Enquiries",
        description: "List all contact/enquiry submissions",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_VIEW_STATS,
        label: "View Enquiry Stats",
        description: "See enquiry counts and status breakdown",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_VIEW_DETAIL,
        label: "View Enquiry Detail",
        description: "Open an individual enquiry submission",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_REPLY,
        label: "Reply to Enquiry",
        description: "Send a reply to a submitted enquiry",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_UPDATE_STATUS,
        label: "Update Enquiry Status",
        description: "Change the status of an enquiry (open, closed, etc.)",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_DELETE,
        label: "Delete Enquiry",
        description: "Permanently delete an enquiry record",
      },
    ],
  },
  {
    module: "Broadcast — Email",
    key: "broadcast_email",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
        label: "Send Email Broadcast",
        description:
          "Preview recipient count, check sending quota, send immediately, and send test emails",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_UPLOAD,
        label: "Upload Email Attachments",
        description:
          "Upload and delete inline images and file attachments for email campaigns",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
        label: "Manage Email Drafts",
        description: "Create, view, update, and delete email campaign drafts",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
        label: "Schedule Email Campaigns",
        description:
          "Schedule campaigns for future delivery, view scheduled list, and cancel pending campaigns",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
        label: "View Email History",
        description:
          "Browse sent campaign history and open individual campaign details",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES,
        label: "Manage Unsubscribe List",
        description:
          "View, export, add, bulk-add, and remove entries from the email suppression list",
      },
    ],
  },
  {
    module: "Broadcast — In-App",
    key: "broadcast_inapp",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        label: "Send In-App Broadcast",
        description:
          "Preview recipient count and send in-app notifications immediately",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_UPLOAD,
        label: "Upload Broadcast Attachments",
        description:
          "Upload and delete attachments for in-app broadcast messages",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
        label: "Manage In-App Drafts",
        description: "Create, view, update, and delete in-app broadcast drafts",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
        label: "Schedule In-App Broadcasts",
        description:
          "Schedule broadcasts for future delivery, view scheduled list, and cancel pending broadcasts",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
        label: "View In-App Broadcast History",
        description:
          "Browse sent broadcast history and open individual broadcast details",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_SEGMENTS,
        label: "Manage Audience Segments",
        description:
          "Create, view, and delete saved audience segments for targeting",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_TEMPLATES,
        label: "Manage Broadcast Templates",
        description:
          "Create, view, and apply reusable in-app broadcast message templates",
      },
    ],
  },
  {
    module: "Broadcast — Mobile",
    key: "broadcast_mobile",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND,
        label: "Send Mobile Broadcast",
        description:
          "Preview recipient count, check sending limits, and dispatch mobile/SMS broadcasts immediately",
      },
    ],
  },
  {
    module: "App Config",
    key: "app_config",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.APP_CONFIG_VIEW,
        label: "View App Config",
        description:
          "Access the App Config section and view category display settings",
      },
      {
        key: CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES,
        label: "Manage Category Images",
        description:
          "Upload, replace, and remove category images shown in the mobile app. Control category visibility.",
      },
    ],
  },
  {
    module: "Settings",
    key: "settings",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.SETTINGS_VIEW,
        label: "View Settings",
        description: "Access and view personal account settings",
      },
      {
        key: CADMIN_PERMISSIONS.SETTINGS_EDIT_IDENTITY,
        label: "Edit Identity",
        description: "Update name and username",
      },
      {
        key: CADMIN_PERMISSIONS.SETTINGS_EDIT_CONTACT,
        label: "Edit Contact Details",
        description: "Update email address and phone number",
      },
      {
        key: CADMIN_PERMISSIONS.SETTINGS_EDIT_PASSWORD,
        label: "Change Password",
        description: "Update account password",
      },
    ],
  },
];

// =============================================================================
// HELPER — Get all valid permission strings as a flat array
// Used for validation when creating/editing roles
// =============================================================================

export const ALL_CADMIN_PERMISSION_KEYS = Object.values(CADMIN_PERMISSIONS);
