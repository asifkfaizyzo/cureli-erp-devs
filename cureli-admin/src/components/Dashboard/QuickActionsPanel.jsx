import React from "react";
import { UserCheck, FileSearch, Download, Settings } from "lucide-react";

const actions = [
  { id: 1, label: "Approve", count: 5, icon: UserCheck, color: "bg-emerald-500" },
  { id: 2, label: "Review", count: 8, icon: FileSearch, color: "bg-amber-500" },
  { id: 3, label: "Export", icon: Download, color: "bg-blue-500" },
  { id: 4, label: "Settings", icon: Settings, color: "bg-gray-500" },
];

const QuickActionsPanel = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-55">
      
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className="relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
            >
              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-xs text-gray-600">{action.label}</span>
              
              {action.count && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {action.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsPanel;