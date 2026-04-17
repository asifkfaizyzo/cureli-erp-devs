// frontend/src/pages/Cadmin-management/comps/AdminActivityTab.jsx

import {
  LogIn,
  KeyRound,
  UserCog,
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
  UserPlus,
  ShieldCheck,    // ← NEW: for role assignment events
  ShieldOff,      // ← NEW: for role removal events
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
};

const getActivityIcon = (action) => {
  switch (action) {
    case "login":
    case "CADMIN_LOGIN_SUCCESS":
      return { icon: LogIn,          color: "text-blue-500",    bg: "bg-blue-50" };

    case "password_change":
    case "password_reset_triggered":
      return { icon: KeyRound,       color: "text-amber-500",   bg: "bg-amber-50" };

    case "profile_updated":
    case "profile_update":
    case "CADMIN_PROFILE_UPDATED":
      return { icon: UserCog,        color: "text-indigo-500",  bg: "bg-indigo-50" };

    case "status_changed":
    case "status_change":
    case "CADMIN_ACTIVATED":
    case "CADMIN_SUSPENDED":
      return { icon: AlertTriangle,  color: "text-red-500",     bg: "bg-red-50" };

    case "role_updated":
    case "role_change":
    case "CADMIN_ROLE_CHANGED":
      return { icon: Shield,         color: "text-purple-500",  bg: "bg-purple-50" };

    // ── NEW: role assignment / removal events ─────────────────────────────
    case "roles_assigned":
      return { icon: ShieldCheck,    color: "text-emerald-500", bg: "bg-emerald-50" };

    case "all_roles_removed":
      return { icon: ShieldOff,      color: "text-rose-500",    bg: "bg-rose-50" };

    case "admin_created":
    case "CADMIN_CREATED":
      return { icon: UserPlus,       color: "text-green-500",   bg: "bg-green-50" };

    default:
      return { icon: Calendar,       color: "text-gray-500",    bg: "bg-gray-50" };
  }
};

const getActionLabel = (action) => {
  const labels = {
    // Legacy keys
    login:                       "Login",
    password_change:             "Password Changed",
    password_reset_triggered:    "Password Reset Triggered",
    profile_updated:             "Profile Updated",
    profile_update:              "Profile Updated",
    status_changed:              "Status Changed",
    status_change:               "Status Changed",
    role_updated:                "Role Updated",
    role_change:                 "Role Changed",
    admin_created:               "Account Created",

    // New audit action keys (from audit.AuditAction constants)
    CADMIN_LOGIN_SUCCESS:        "Login",
    CADMIN_LOGOUT:               "Logged Out",
    CADMIN_CREATED:              "Account Created",
    CADMIN_PROFILE_UPDATED:      "Profile Updated",
    CADMIN_ROLE_CHANGED:         "Role Updated",
    CADMIN_ACTIVATED:            "Account Activated",
    CADMIN_SUSPENDED:            "Account Suspended",

    // Role assignment events (from metadata.event in audit log)
    roles_assigned:              "Roles Assigned",
    all_roles_removed:           "All Roles Removed",
    role_created:                "Role Created",
    role_updated:                "Role Updated",
    role_deleted:                "Role Deleted",
  };
  return labels[action] || action || "Activity";
};

/**
 * Render a before → after diff of changed fields.
 * Handles both flat changes objects and nested metadata.
 */
const formatChanges = (changes) => {
  if (!changes || typeof changes !== "object") return null;

  return Object.entries(changes).map(([field, value]) => {
    const from       = value?.from ?? "N/A";
    const to         = value?.to   ?? "N/A";
    const fieldLabel = field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <div key={field} className="text-xs text-gray-500 mt-1">
        <span className="font-medium">{fieldLabel}:</span>{" "}
        <span className="text-gray-400 line-through">{String(from)}</span>
        <span className="mx-1.5 text-gray-300">→</span>
        <span className="text-gray-700 font-medium">{String(to)}</span>
      </div>
    );
  });
};

/**
 * Render metadata for role assignment events specifically.
 * Shows which roles were added/removed.
 */
const formatRoleMetadata = (metadata) => {
  if (!metadata) return null;

  // roles_assigned event
  if (metadata.event === "roles_assigned" && metadata.role_names) {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {metadata.role_names.map((name) => (
          <span
            key={name}
            className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[11px] font-medium"
          >
            {name}
          </span>
        ))}
      </div>
    );
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AdminActivityTab = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
        <Clock size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Recent Activity ({activities.length})
      </h3>

      <div className="space-y-2.5">
        {activities.map((activity) => {
          const { icon: Icon, color, bg } = getActivityIcon(activity.action);

          return (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-gray-100 p-4
                         hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center
                                 justify-center flex-shrink-0`}>
                  <Icon size={18} className={color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">
                        {getActionLabel(activity.action)}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {activity.description}
                        </p>
                      )}

                      {/* Changes diff */}
                      {activity.changes && Object.keys(activity.changes).length > 0 && (
                        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                          {formatChanges(activity.changes)}
                        </div>
                      )}

                      {/* Role assignment metadata */}
                      {activity.meta && formatRoleMetadata(activity.meta)}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatDateTime(activity.createdAt || activity.created_at)}
                    </span>
                  </div>

                  {/* IP + User Agent */}
                  {(activity.ipAddress || activity.userAgent) && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {activity.ipAddress && (
                        <span className="font-mono">IP: {activity.ipAddress}</span>
                      )}
                      {activity.ipAddress && activity.userAgent && (
                        <span className="text-gray-200">•</span>
                      )}
                      {activity.userAgent && (
                        <span
                          className="truncate max-w-[260px]"
                          title={activity.userAgent}
                        >
                          {activity.userAgent}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminActivityTab;