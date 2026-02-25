// src/pages/Dashboard/comps/QuickActionsPanel.jsx

import { useNavigate } from "react-router-dom";
import {
  Plus,
  UserPlus,
  ShieldCheck,
  Radio,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";

const QUICK_ACTIONS = [
  {
    id: "create-plan",
    label: "Create Plan",
    description: "Add new subscription plan",
    icon: Plus,
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    path: "/subscriptions/manage",
  },
  {
    id: "add-admin",
    label: "Add Admin",
    description: "Create new admin account",
    icon: UserPlus,
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    path: "/admins",
  },
  {
    id: "verify-shops",
    label: "Verify Shops",
    description: "Review pending verifications",
    icon: ShieldCheck,
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    path: "/verification",
  },
  {
    id: "broadcast",
    label: "Send Broadcast",
    description: "Create announcement",
    icon: Radio,
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    path: "/communications/broadcast",
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    description: "View system activity",
    icon: FileText,
    iconBg: "bg-gradient-to-br from-slate-500 to-gray-600",
    path: "/audit",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Configure system",
    icon: Settings,
    iconBg: "bg-gradient-to-br from-gray-500 to-slate-600",
    path: "/settings",
  },
];

const QuickActionsPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.path)}
            className="group flex flex-col items-center p-4 rounded-xl border border-gray-100 
                       hover:border-[#000060]/20 hover:bg-gradient-to-br hover:from-[#000060]/5 hover:to-violet-50
                       transition-all duration-200 hover:shadow-md"
          >
            <div className={`w-12 h-12 rounded-xl ${action.iconBg} flex items-center justify-center 
                            shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon size={22} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-800 text-center">
              {action.label}
            </span>
            <span className="text-[10px] text-gray-400 text-center mt-0.5 line-clamp-1">
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsPanel;