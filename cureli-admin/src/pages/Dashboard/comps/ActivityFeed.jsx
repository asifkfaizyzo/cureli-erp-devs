// src/pages/Dashboard/comps/ActivityFeed.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  UserPlus,
  Store,
  CreditCard,
  ShieldCheck,
  Ticket,
  Settings,
  Bell,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getRecentActivity } from "../../../api/cadminDashboard";

const ACTIVITY_ICONS = {
  user_created: { icon: UserPlus, bg: "bg-blue-100", color: "text-blue-600" },
  user_suspended: { icon: UserPlus, bg: "bg-red-100", color: "text-red-600" },
  user_activated: { icon: UserPlus, bg: "bg-emerald-100", color: "text-emerald-600" },
  shop_created: { icon: Store, bg: "bg-indigo-100", color: "text-indigo-600" },
  shop_verified: { icon: ShieldCheck, bg: "bg-emerald-100", color: "text-emerald-600" },
  shop_suspended: { icon: Store, bg: "bg-red-100", color: "text-red-600" },
  subscription_created: { icon: CreditCard, bg: "bg-violet-100", color: "text-violet-600" },
  ticket_resolved: { icon: Ticket, bg: "bg-orange-100", color: "text-orange-600" },
  broadcast_sent: { icon: Bell, bg: "bg-amber-100", color: "text-amber-600" },
  plan_updated: { icon: CreditCard, bg: "bg-indigo-100", color: "text-indigo-600" },
  settings_updated: { icon: Settings, bg: "bg-gray-100", color: "text-gray-600" },
};

const ActivityFeed = ({ limit = 10 }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("[ActivityFeed] Fetching data, limit:", limit);
        const response = await getRecentActivity(limit);
        console.log("[ActivityFeed] Response:", response);
        
        if (response.data) {
          setActivities(response.data);
        }
      } catch (err) {
        console.error("[ActivityFeed] Error:", err);
        setError(err.message || "Failed to load activity data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg shadow-slate-500/25">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-xs text-gray-500">System-wide actions</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/audit")}
          className="flex items-center gap-1 text-sm text-[#000060] font-medium hover:underline"
        >
          View Audit Logs
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <AlertCircle size={32} className="mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Activity size={32} className="mb-2" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100" />

          {/* Activities */}
          <div className="space-y-4">
            {activities.map((activity) => {
              const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.settings_updated;
              const Icon = config.icon;

              return (
                <div key={activity.id} className="relative flex items-start gap-4 pl-2">
                  {/* Icon */}
                  <div className={`relative z-10 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.actor}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-xs text-gray-400">{formatTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;