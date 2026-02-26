// src/pages/Dashboard/comps/ActivityFeed.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, ArrowRight, UserPlus, Store, CreditCard, ShieldCheck,
  Ticket, Settings, Bell, Loader2, AlertCircle,
} from "lucide-react";
import { getRecentActivity } from "../../../api/cadminDashboard";

const ICONS = {
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

const ActivityFeed = ({ limit = 8 }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getRecentActivity(limit);
        setData(res.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [limit]);

  const formatTime = (d) => {
    if (!d) return "";
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 1) return "now";
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur rounded-xl border border-gray-100/80 p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Activity</h3>
            <p className="text-[9px] text-gray-400">System events</p>
          </div>
        </div>
        <button onClick={() => navigate("/audit")} className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline">
          Audit Logs <ArrowRight size={10} />
        </button>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      ) : error ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
          <AlertCircle size={24} className="mb-1" />
          <p className="text-[10px]">{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-gray-300">
          <Activity size={28} className="mb-1 opacity-50" />
          <p className="text-[10px]">No recent activity</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-100" />
          <div className="space-y-2">
            {data.map((a, i) => {
              const cfg = ICONS[a.type] || ICONS.settings_updated;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative flex items-start gap-2 pl-1"
                >
                  <div className={`relative z-10 w-6 h-6 rounded ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={10} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[10px] text-gray-800 truncate">{a.message}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-gray-400">{a.actor}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                      <span className="text-[9px] text-gray-400">{formatTime(a.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ActivityFeed;