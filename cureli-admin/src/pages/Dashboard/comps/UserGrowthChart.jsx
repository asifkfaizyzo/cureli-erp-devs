// src/pages/Dashboard/comps/UserGrowthChart.jsx

import { useState, useEffect } from "react";
import { Users, TrendingUp, Loader2 } from "lucide-react";

// Mock data
const generateGrowthData = (period) => {
  const points = period === "7d" ? 7 : period === "30d" ? 30 : 12;
  const data = [];
  let shopCount = 100;
  let userCount = 450;

  for (let i = 0; i < points; i++) {
    shopCount += Math.floor(Math.random() * 5);
    userCount += Math.floor(Math.random() * 15);
    data.push({
      shops: shopCount,
      users: userCount,
    });
  }

  return data;
};

const UserGrowthChart = ({ period }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(generateGrowthData(period));
      setLoading(false);
    }, 500);
  }, [period]);

  const latestData = data[data.length - 1] || { shops: 0, users: 0 };
  const firstData = data[0] || { shops: 0, users: 0 };
  
  const shopGrowth = firstData.shops > 0 
    ? Math.round(((latestData.shops - firstData.shops) / firstData.shops) * 100) 
    : 0;
  const userGrowth = firstData.users > 0 
    ? Math.round(((latestData.users - firstData.users) / firstData.users) * 100) 
    : 0;

  const maxUsers = Math.max(...data.map(d => d.users), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">User Growth</h3>
            <p className="text-xs text-gray-500">Shops and users over time</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-blue-600 font-medium">Total Shops</p>
            <div className="flex items-center gap-1 text-emerald-600">
              <TrendingUp size={12} />
              <span className="text-xs font-medium">+{shopGrowth}%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900">{latestData.shops}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-violet-600 font-medium">Total Users</p>
            <div className="flex items-center gap-1 text-emerald-600">
              <TrendingUp size={12} />
              <span className="text-xs font-medium">+{userGrowth}%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-violet-900">{latestData.users}</p>
        </div>
      </div>

      {/* Area Chart */}
      <div className="relative h-32">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : (
          <svg className="w-full h-full" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="0"
                y1={`${(i / 3) * 100}%`}
                x2="100%"
                y2={`${(i / 3) * 100}%`}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* Area */}
            <path
              d={`
                M 0,${100 - (data[0]?.users / maxUsers) * 100}
                ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100}%,${100 - (d.users / maxUsers) * 100}`).join(" ")}
                L 100%,100
                L 0,100
                Z
              `}
              fill="url(#gradient)"
              opacity="0.3"
            />

            {/* Line */}
            <path
              d={`
                M 0,${100 - (data[0]?.users / maxUsers) * 100}
                ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100}%,${100 - (d.users / maxUsers) * 100}`).join(" ")}
              `}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
            />

            {/* Gradient Definition */}
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-xs text-gray-500">Users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-500">Shops</span>
        </div>
      </div>
    </div>
  );
};

export default UserGrowthChart;