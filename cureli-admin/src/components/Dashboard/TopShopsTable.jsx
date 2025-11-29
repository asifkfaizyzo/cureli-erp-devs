import React from "react";
import { TrendingUp } from "lucide-react";

const shops = [
  { name: "MediCare Plus", revenue: "₹45,200", orders: 124, growth: "+18%" },
  { name: "HealthFirst", revenue: "₹38,400", orders: 98, growth: "+12%" },
  { name: "QuickMeds", revenue: "₹32,100", orders: 87, growth: "+8%" },
  { name: "CityPharma", revenue: "₹28,900", orders: 76, growth: "+5%" },
];

const TopShopsTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-55 flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Top Shops</h3>
        <button className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
          View All
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 sticky top-0 bg-white">
            <tr>
              <th className="text-left font-medium pb-2">Shop</th>
              <th className="text-right font-medium pb-2">Revenue</th>
              <th className="text-right font-medium pb-2">Growth</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td className="py-2 text-gray-800 font-medium">{shop.name}</td>
                <td className="py-2 text-gray-600 text-right">{shop.revenue}</td>
                <td className="py-2 text-right">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <TrendingUp size={10} />
                    {shop.growth}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopShopsTable;