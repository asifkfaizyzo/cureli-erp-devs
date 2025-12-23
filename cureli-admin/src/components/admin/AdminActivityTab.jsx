//Q:\YourZeroesAndOnes\cureli\curely_erp\cureli-admin\src\components\admin\AdminActivityTab.jsx
import {
  LogIn,
  KeyRound,
  UserCog,
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
} from "lucide-react";

// helpers (same pattern as User ActivityTab)
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

const getActivityIcon = (action) => {
  switch (action) {
    case "login":
      return { icon: LogIn, color: "text-blue-500", bg: "bg-blue-50" };
    case "password_change":
      return { icon: KeyRound, color: "text-amber-500", bg: "bg-amber-50" };
    case "profile_update":
      return { icon: UserCog, color: "text-indigo-500", bg: "bg-indigo-50" };
    case "status_change":
      return { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" };
    case "role_change":
      return { icon: Shield, color: "text-purple-500", bg: "bg-purple-50" };
    default:
      return { icon: Calendar, color: "text-gray-500", bg: "bg-gray-50" };
  }
};

const getActionLabel = (action) => {
  switch (action) {
    case "login":
      return "Login";
    case "password_change":
      return "Password Changed";
    case "profile_update":
      return "Profile Updated";
    case "status_change":
      return "Status Changed";
    case "role_change":
      return "Role Changed";
    default:
      return action || "Activity";
  }
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
                <div
                  className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon size={20} className={color} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {getActionLabel(activity.action)}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {activity.description}
                      </p>
                    </div>

                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {formatDateTime(activity.created_at)}
                    </span>
                  </div>

                  {(activity.ipAddress || activity.userAgent) && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {activity.ipAddress && (
                        <span>IP: {activity.ipAddress}</span>
                      )}
                      {activity.ipAddress && activity.userAgent && <span>•</span>}
                      {activity.userAgent && (
                        <span className="truncate max-w-[300px]">
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
