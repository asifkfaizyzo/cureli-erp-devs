// src/pages/Dashboard/comps/SubscriptionDonut.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PieChart, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Ban,
  ArrowRight,
} from "lucide-react";

const SubscriptionDonut = ({ data }) => {
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    if (!data?.counts) {
      return [
        { label: "Active", value: 0, color: "#10B981", bgColor: "bg-emerald-500" },
        { label: "Expiring", value: 0, color: "#3B82F6", bgColor: "bg-blue-500" },
        { label: "Grace", value: 0, color: "#F59E0B", bgColor: "bg-amber-500" },
        { label: "Suspended", value: 0, color: "#EF4444", bgColor: "bg-red-500" },
      ];
    }

    // Mock active count (total - at risk)
    const activeCount = Math.max(0, 150 - data.counts.total);

    return [
      { label: "Active", value: activeCount, color: "#10B981", bgColor: "bg-emerald-500", icon: CheckCircle },
      { label: "Expiring", value: data.counts.expiring || 0, color: "#3B82F6", bgColor: "bg-blue-500", icon: Clock },
      { label: "Grace", value: data.counts.gracePeriod || 0, color: "#F59E0B", bgColor: "bg-amber-500", icon: AlertTriangle },
      { label: "Suspended", value: data.counts.suspended || 0, color: "#EF4444", bgColor: "bg-red-500", icon: Ban },
    ];
  }, [data]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  // Calculate stroke-dasharray for donut segments
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercent = 0;
  const segments = chartData.map((d) => {
    const percent = total > 0 ? (d.value / total) * 100 : 0;
    const dashArray = `${(percent / 100) * circumference} ${circumference}`;
    const rotation = cumulativePercent * 3.6 - 90;
    cumulativePercent += percent;
    return { ...d, dashArray, rotation };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <PieChart size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Subscriptions</h3>
            <p className="text-xs text-gray-500">Status distribution</p>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="20"
            />
            
            {/* Segments */}
            {segments.map((segment, i) => (
              <circle
                key={segment.label}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="20"
                strokeDasharray={segment.dashArray}
                strokeLinecap="round"
                style={{
                  transform: `rotate(${segment.rotation}deg)`,
                  transformOrigin: "90px 90px",
                  transition: "stroke-dasharray 0.5s ease-in-out",
                }}
              />
            ))}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {chartData.map((item) => {
          const Icon = item.icon || CheckCircle;
          return (
            <div
              key={item.label}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`w-3 h-3 rounded-full ${item.bgColor}`} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            </div>
          );
        })}
      </div>

      {/* Action */}
      <button
        onClick={() => navigate("/subscriptions/risk")}
        className="w-full mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-[#000060] font-medium hover:underline"
      >
        View Risk Monitor
        <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default SubscriptionDonut;