import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Monthly", value: 45, color: "#4F46E5" },
  { name: "Yearly", value: 35, color: "#10B981" },
  { name: "Trial", value: 20, color: "#F59E0B" },
];

const SubscriptionDonut = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-55 flex flex-col">
      
      {/* Header */}
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Subscriptions
      </h3>

      {/* Content - fills remaining space */}
      <div className="flex-1 flex items-center gap-6">
        
        {/* Chart - takes remaining height */}
        <div className="h-full aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="85%"
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
              <span className="text-sm font-semibold text-gray-900 ml-2">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDonut;