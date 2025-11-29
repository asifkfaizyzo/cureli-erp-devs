import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", revenue: 32000 },
  { month: "Feb", revenue: 38000 },
  { month: "Mar", revenue: 35000 },
  { month: "Apr", revenue: 42000 },
  { month: "May", revenue: 48000 },
  { month: "Jun", revenue: 52000 },
];

const RevenueChart = () => {
  const [period, setPeriod] = useState("6m");

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Revenue Overview</h3>
          <p className="text-xs text-gray-500">Monthly revenue trend</p>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {["1m", "3m", "6m", "1y"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart - Fixed Height */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickFormatter={(v) => `₹${v / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4F46E5"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;