// src/pages/Dashboard/comps/TopShopsTable.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  ArrowRight,
  TrendingUp,
  Users,
  Loader2,
  Crown,
} from "lucide-react";

// Mock data
const mockTopShops = [
  { id: "1", name: "MedPlus Central", revenue: 125000, users: 12, growth: 15 },
  { id: "2", name: "Apollo Pharmacy Hub", revenue: 98000, users: 8, growth: 12 },
  { id: "3", name: "Netmeds Express Store", revenue: 87000, users: 6, growth: 8 },
  { id: "4", name: "PharmEasy Outlet", revenue: 76000, users: 5, growth: -2 },
  { id: "5", name: "1mg Health Store", revenue: 65000, users: 4, growth: 5 },
];

const TopShopsTable = ({ period }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(mockTopShops);
      setLoading(false);
    }, 500);
  }, [period]);

  const getRankBadge = (index) => {
    if (index === 0) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow">
          <Crown size={12} className="text-white" />
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">2</span>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">3</span>
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-gray-500">{index + 1}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Top Shops</h3>
            <p className="text-xs text-gray-500">By revenue this period</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/shops")}
          className="flex items-center gap-1 text-sm text-[#000060] font-medium hover:underline"
        >
          View All
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((shop, index) => (
            <div
              key={shop.id}
              onClick={() => navigate(`/shops?search=${shop.name}`)}
              className={`
                flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                ${index === 0 
                  ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100" 
                  : "hover:bg-gray-50"
                }
              `}
            >
              {/* Rank */}
              {getRankBadge(index)}

              {/* Shop Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{shop.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users size={10} />
                    {shop.users} users
                  </span>
                </div>
              </div>

              {/* Revenue & Growth */}
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  ₹{(shop.revenue / 1000).toFixed(0)}K
                </p>
                <div className={`flex items-center justify-end gap-1 text-xs ${
                  shop.growth >= 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  <TrendingUp size={10} className={shop.growth < 0 ? "rotate-180" : ""} />
                  {shop.growth >= 0 ? "+" : ""}{shop.growth}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopShopsTable;