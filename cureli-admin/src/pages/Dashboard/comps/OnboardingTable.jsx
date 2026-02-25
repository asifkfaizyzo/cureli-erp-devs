// src/pages/Dashboard/comps/OnboardingTable.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  ArrowRight,
  Store,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getRecentOnboarding } from "../../../api/cadminDashboard";

const OnboardingTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("[OnboardingTable] Fetching data");
        const response = await getRecentOnboarding(5);
        console.log("[OnboardingTable] Response:", response);
        
        if (response.data) {
          setData(response.data);
        }
      } catch (err) {
        console.error("[OnboardingTable] Error:", err);
        setError(err.message || "Failed to load onboarding data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const getStatusBadge = (status, step, maxSteps) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle size={12} />
          Completed
        </span>
      );
    }
    if (status === "stuck") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle size={12} />
          Stuck
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Clock size={12} />
        Step {step}/{maxSteps}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <UserPlus size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Recent Onboarding</h3>
            <p className="text-xs text-gray-500">New shop registrations</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/users")}
          className="flex items-center gap-1 text-sm text-[#000060] font-medium hover:underline"
        >
          View All
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
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <UserPlus size={32} className="mb-2" />
          <p className="text-sm">No recent onboarding</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Shop</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/users?search=${encodeURIComponent(item.owner_name)}`)}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Store size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                        {item.shop_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-gray-600">{item.owner_name}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {getStatusBadge(item.status, item.step, item.max_steps)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-xs text-gray-400">{formatTimeAgo(item.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OnboardingTable;