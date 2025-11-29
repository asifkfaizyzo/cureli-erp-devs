import React from "react";
import { CheckCircle2, XCircle, Clock, FileText, UserPlus } from "lucide-react";

const activities = [
  { id: 1, text: "Shop 'MediCare Plus' verified", time: "2m ago", icon: CheckCircle2, color: "text-emerald-500" },
  { id: 2, text: "New user registered: Rahul S.", time: "15m ago", icon: UserPlus, color: "text-blue-500" },
  { id: 3, text: "License pending: QuickMeds", time: "32m ago", icon: Clock, color: "text-amber-500" },
  { id: 4, text: "Document rejected: HealthFirst", time: "1h ago", icon: XCircle, color: "text-red-500" },
  { id: 5, text: "New submission: CityPharma", time: "2h ago", icon: FileText, color: "text-violet-500" },
  { id: 6, text: "Shop 'WellnessHub' approved", time: "3h ago", icon: CheckCircle2, color: "text-emerald-500" },
];

const ActivityFeed = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-80 flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {activities.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className={`mt-0.5 ${item.color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{item.text}</p>
                <p className="text-xs text-gray-400">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-100 mt-auto">
        <button className="w-full text-center text-xs text-indigo-600 font-medium hover:text-indigo-700">
          View All Activity →
        </button>
      </div>
    </div>
  );
};

export default ActivityFeed;