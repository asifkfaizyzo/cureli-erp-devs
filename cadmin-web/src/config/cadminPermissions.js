// pharmacy-web/src/config/cadminPermissions.js

/**
 * =============================================================================
 * CADMIN PERMISSION REGISTRY — FRONTEND
 * =============================================================================
 *
 * This file is a mirror of backend/src/config/cadminPermissions.js
 * The permission STRING VALUES must stay identical to the backend.
 * The backend is the source of truth — if you add a permission there,
 * add it here too and update CADMIN_PERMISSION_GROUPS.
 *
 * HOW PERMISSIONS WORK IN THE FRONTEND:
 * ─────────────────────────────────────
 * 1. On login, the frontend calls GET /cadmin/me
 * 2. The response includes admin.permissions[] (flat string array)
 *    and admin.is_super_cadmin (boolean)
 * 3. These are stored in AuthContext
 * 4. useCAdminPermission() reads from AuthContext
 * 5. hasPermission("shops.view") checks admin.permissions.includes(...)
 * 6. If is_super_cadmin === true, ALL permission checks return true
 *
 * HOW TO ADD A NEW PERMISSION:
 * ─────────────────────────────
 * Step 1: Add to CADMIN_PERMISSIONS object (match backend value exactly)
 * Step 2: Add to correct group in CADMIN_PERMISSION_GROUPS (for role UI checklist)
 * Step 3: Use in components via useCAdminPermission().hasPermission(CADMIN_PERMISSIONS.YOUR_NEW_KEY)
 * Step 4: Add to sidebar visibility in useCAdminMenuPermissions() if it gates a menu item
 * =============================================================================
 */

// =============================================================================
// PERMISSION CONSTANTS
// Values MUST match backend/src/config/cadminPermissions.js exactly
// =============================================================================

export const CADMIN_PERMISSIONS = {
  // ── ADMIN MANAGEMENT ──────────────────────────────────────────────────────
  ADMINS_VIEW: "admins.view",
  ADMINS_VIEW_DETAIL: "admins.view_detail",
  ADMINS_VIEW_ACTIVITY: "admins.view_activity",
  ADMINS_CREATE: "admins.create",
  ADMINS_EDIT: "admins.edit",
  ADMINS_TOGGLE_ACCESS: "admins.toggle_access",

  // ── USER MANAGEMENT ───────────────────────────────────────────────────────
  USERS_VIEW: "users.view",
  USERS_VIEW_DETAIL: "users.view_detail",
  USERS_EDIT: "users.edit",
  USERS_TOGGLE_ACCESS: "users.toggle_access",
  USERS_RESET_PASSWORD: "users.reset_password",

  // ── SHOP MANAGEMENT ───────────────────────────────────────────────────────
  SHOPS_VIEW: "shops.view",
  SHOPS_VIEW_DETAIL: "shops.view_detail",
  SHOPS_VIEW_STATS: "shops.view_stats",
  SHOPS_EDIT: "shops.edit",
  SHOPS_TOGGLE_ACTIVE: "shops.toggle_active",
  SHOPS_UPDATE_SUBSCRIPTION: "shops.update_subscription",
  SHOPS_UPLOAD_DOCUMENTS: "shops.upload_documents",

  // ── PLAN MANAGEMENT ───────────────────────────────────────────────────────
  PLANS_VIEW: "plans.view",
  PLANS_VIEW_DETAIL: "plans.view_detail",
  PLANS_VIEW_STATS: "plans.view_stats",
  PLANS_CREATE: "plans.create",
  PLANS_EDIT: "plans.edit",
  PLANS_ACTIVATE: "plans.activate",
  PLANS_SUSPEND: "plans.suspend",
  PLANS_REACTIVATE: "plans.reactivate",
  PLANS_CLONE: "plans.clone",
  PLANS_DELETE: "plans.delete",

  // ── SUBSCRIPTION MANAGEMENT ───────────────────────────────────────────────
  SUBSCRIPTIONS_VIEW_AT_RISK: "subscriptions.view_at_risk",
  SUBSCRIPTIONS_VIEW_DETAIL: "subscriptions.view_detail",
  SUBSCRIPTIONS_SEND_REMINDER: "subscriptions.send_reminder",
  SUBSCRIPTIONS_EXTEND_GRACE: "subscriptions.extend_grace",
  SUBSCRIPTIONS_FORCE_SUSPEND: "subscriptions.force_suspend",
  SUBSCRIPTIONS_REACTIVATE: "subscriptions.reactivate",

  // ── TICKETS ───────────────────────────────────────────────────────────────
  TICKETS_VIEW: "tickets.view",
  TICKETS_VIEW_DETAIL: "tickets.view_detail",
  TICKETS_VIEW_STATS: "tickets.view_stats",
  TICKETS_VIEW_HISTORY: "tickets.view_history",
  TICKETS_UPDATE_STATUS: "tickets.update_status",

  // ── MASTER MEDICINES ──────────────────────────────────────────────────────
  MASTER_MEDICINES_VIEW: "master_medicines.view",
  MASTER_MEDICINES_CREATE: "master_medicines.create",
  MASTER_MEDICINES_MANAGE_MAPPING: "master_medicines.manage_mapping",
  MASTER_MEDICINES_MANAGE_IMAGES: "master_medicines.manage_images",

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  DASHBOARD_VIEW: "dashboard.view",

  // ── DOCUMENT VERIFICATION ─────────────────────────────────────────────────
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_VIEW_SHOP_DETAIL: "documents.view_shop_detail",
  DOCUMENTS_VIEW_FILE: "documents.view_file",
  DOCUMENTS_VERIFY: "documents.verify",
  DOCUMENTS_REJECT: "documents.reject",
  DOCUMENTS_BATCH_UPDATE: "documents.batch_update",

  // ── AUDIT ─────────────────────────────────────────────────────────────────
  AUDIT_VIEW: "audit.view",
  AUDIT_VIEW_DETAIL: "audit.view_detail",
  AUDIT_VIEW_STATS: "audit.view_stats",
  AUDIT_EXPORT: "audit.export",

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
  // MODULE: EMAIL BROADCAST
  // Covers: Mass email campaigns sent to platform users/admins
  // ─────────────────────────────────────────────────────────────────────────
  BROADCAST_EMAIL_SEND: "broadcast_email.send", // Preview recipient count, check quota, send now, send test email, access filter helpers
  BROADCAST_EMAIL_UPLOAD: "broadcast_email.upload", // Upload and delete inline images and attachments
  BROADCAST_EMAIL_MANAGE_DRAFTS: "broadcast_email.manage_drafts", // Create, list, update, delete email drafts
  BROADCAST_EMAIL_SCHEDULE: "broadcast_email.schedule", // Schedule campaigns, view scheduled list, cancel campaigns
  BROADCAST_EMAIL_VIEW_HISTORY: "broadcast_email.view_history", // View sent campaign history and individual campaign detail
  BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES: "broadcast_email.manage_unsubscribes", // View, export, add, bulk-add, and remove suppression list entries

  // ── SETTINGS ─────────────────────────────────────────────────────────────────
  SETTINGS_VIEW: "settings.view", // List settigns
  SETTINGS_EDIT_IDENTITY: "settings.edit_identity", // edit settings
  SETTINGS_EDIT_CONTACT: "settings.edit_contact", // edit settings
  SETTINGS_EDIT_PASSWORD: "settings.edit_password", // edit settings
};

// =============================================================================
// PERMISSION GROUPS
// Used by the role creation/edit UI to render the permission checklist.
// Each module is one collapsible section. Each permission is one checkbox.
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
        label: "Edit Admin & Roles",
        description: "Update admin profile and manage role assignments",
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
        label: "Reset User Password",
        description: "Send password reset link to user",
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
        description: "Trigger reminder to shop",
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
// ROUTE → PERMISSION MAPPING
// Used for sidebar visibility. Maps frontend routes to required permissions.
// If a route requires ANY of the listed permissions, it is visible.
// Empty array = accessible to all authenticated admins.
// =============================================================================

export const CADMIN_ROUTE_PERMISSIONS = {
  "/dashboard": [CADMIN_PERMISSIONS.DASHBOARD_VIEW],
  "/shops": [CADMIN_PERMISSIONS.SHOPS_VIEW],
  "/users": [CADMIN_PERMISSIONS.USERS_VIEW],
  "/subscriptions": [
    CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK,
    CADMIN_PERMISSIONS.PLANS_VIEW,
  ],
  "/subscriptions/list": [CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK],
  "/subscriptions/plans": [CADMIN_PERMISSIONS.PLANS_VIEW],
  "/subscriptions/risk": [CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK],
  "/verifications": [CADMIN_PERMISSIONS.DOCUMENTS_VIEW],

  // Communications parent — visible if any child is visible
  "/communications": [
    CADMIN_PERMISSIONS.TICKETS_VIEW,
    CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
  ],

  // Communications children
  "/communications/tickets": [CADMIN_PERMISSIONS.TICKETS_VIEW],
  "/communications/enquiries": [CADMIN_PERMISSIONS.ENQUIRIES_VIEW],
  "/communications/broadcast": [
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
  ],
  "/communications/broadcast/email": [
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
  ],
  "/communications/broadcast/in-app": [
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
  ],

  "/admins": [CADMIN_PERMISSIONS.ADMINS_VIEW],
  "/audit": [CADMIN_PERMISSIONS.AUDIT_VIEW],
  "/master-medicines": [CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW],
  "/settings": [CADMIN_PERMISSIONS.SETTINGS_VIEW],
};
