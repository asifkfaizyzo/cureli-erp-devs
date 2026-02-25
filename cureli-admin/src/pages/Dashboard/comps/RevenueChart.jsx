// src/pages/Dashboard/comps/RevenueChart.jsx

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getRevenueData } from "../../../api/cadminDashboard";

const RevenueChart = ({ period }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("[RevenueChart] Fetching data for period:", period);
        const response = await getRevenueData(period);
        console.log("[RevenueChart] Response:", response);
        
        if (response.data) {
          setData(response.data);
        } else {
          setError("No data received");
        }
      } catch (err) {
        console.error("[RevenueChart] Error:", err);
        setError(err.message || "Failed to load revenue data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const chartData = data?.data || [];
  const summary = data?.summary || { total: 0, average: 0, maxValue: 0 };
  
  // Calculate growth (mock since we don't have previous period in same call)
  const growth = 12.5; // You can calculate this from summary if available

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
            <p className="text-xs text-gray-500">Total earnings over time</p>
          </div>
        </div>

        {!loading && !error && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
            <TrendingUp size={14} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              {chartData.length > 0 ? `${chartData.length} days` : "No data"}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{(summary.total / 100).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Daily Average</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{(summary.average / 100).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative h-48">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <AlertCircle size={32} className="mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <DollarSign size={32} className="mb-2" />
            <p className="text-sm">No revenue data for this period</p>
          </div>
        ) : (
          <div className="h-full flex items-end gap-1">
            {chartData.slice(-20).map((d, i) => (
              <div
                key={i}
                className="flex-1 min-w-0 group relative"
                style={{ height: "100%" }}
              >
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t
                             transition-all duration-300 hover:from-emerald-600 hover:to-teal-500"
                  style={{ 
                    height: summary.maxValue > 0 
                      ? `${(d.value / summary.maxValue) * 100}%` 
                      : "0%" 
                  }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 
                                transition-opacity pointer-events-none z-10">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {d.label}: ₹{(d.value / 100).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      {!loading && !error && chartData.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400" />
            <span className="text-xs text-gray-500">Daily Revenue</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;