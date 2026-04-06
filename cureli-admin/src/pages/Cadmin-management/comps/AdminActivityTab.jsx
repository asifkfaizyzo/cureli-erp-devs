//cureli-admin\src\pages\Cadmin-management\comps\AdminActivityTab.jsx
import {
  LogIn,
  KeyRound,
  UserCog,
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
  UserPlus,
} from "lucide-react";

// Format datetime for display
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Get icon and colors for activity type
const getActivityIcon = (action) => {
  switch (action) {
    case "login":
      return { icon: LogIn, color: "text-blue-500", bg: "bg-blue-50" };
    case "password_change":
    case "password_reset_triggered":
      return { icon: KeyRound, color: "text-amber-500", bg: "bg-amber-50" };
    case "profile_updated":
    case "profile_update":
      return { icon: UserCog, color: "text-indigo-500", bg: "bg-indigo-50" };
    case "status_changed":
    case "status_change":
      return { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" };
    case "role_updated":
    case "role_change":
      return { icon: Shield, color: "text-purple-500", bg: "bg-purple-50" };
    case "admin_created":
      return { icon: UserPlus, color: "text-green-500", bg: "bg-green-50" };
    default:
      return { icon: Calendar, color: "text-gray-500", bg: "bg-gray-50" };
  }
};

// Get human-readable label for action
const getActionLabel = (action) => {
  const labels = {
    login: "Login",
    password_change: "Password Changed",
    password_reset_triggered: "Password Reset Triggered",
    profile_updated: "Profile Updated",
    profile_update: "Profile Updated",
    status_changed: "Status Changed",
    status_change: "Status Changed",
    role_updated: "Role Updated",
    role_change: "Role Changed",
    admin_created: "Account Created",
  };
  return labels[action] || action || "Activity";
};

// Format changes object for display
const formatChanges = (changes) => {
  if (!changes || typeof changes !== "object") return null;

  return Object.entries(changes).map(([field, value]) => {
    const from = value?.from ?? "N/A";
    const to = value?.to ?? "N/A";
    const fieldLabel = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <div key={field} className="text-xs text-gray-500 mt-1">
        <span className="font-medium">{fieldLabel}:</span>{" "}
        <span className="text-gray-400">{String(from)}</span>
        <span className="mx-1">→</span>
        <span className="text-gray-700">{String(to)}</span>
      </div>
    );
  });
};

const AdminActivityTab = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
        <Clock size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No activity recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Recent Activity ({activities.length})
      </h3>

      <div className="space-y-3">
        {activities.map((activity) => {
          const { icon: Icon, color, bg } = getActivityIcon(activity.action);

          return (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* ICON */}
                <div
                  className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon size={20} className={color} />
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {getActionLabel(activity.action)}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {activity.description}
                        </p>
                      )}
                      {/* CHANGES DIFF */}
                      {activity.changes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          {formatChanges(activity.changes)}
                        </div>
                      )}
                    </div>

                    {/* TIMESTAMP */}
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatDateTime(activity.createdAt || activity.created_at)}
                    </span>
                  </div>

                  {/* METADATA */}
                  {(activity.ipAddress || activity.userAgent) && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {activity.ipAddress && <span>IP: {activity.ipAddress}</span>}
                      {activity.ipAddress && activity.userAgent && <span>•</span>}
                      {activity.userAgent && (
                        <span className="truncate max-w-[300px]" title={activity.userAgent}>
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