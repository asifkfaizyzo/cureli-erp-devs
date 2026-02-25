// src/pages/Dashboard/comps/PendingActionsPanel.jsx

import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Ticket,
  Mail,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

const PendingActionsPanel = ({ data, pendingCounts, role }) => {
  const navigate = useNavigate();

  const isAccounting = role?.toUpperCase() === "ACCOUNTING";

  // For ACCOUNTING: Focus on subscription-related pending items
  const accountingItems = [
    {
      id: "expiring",
      label: "Expiring Subscriptions",
      count: data.atRiskSubscriptions?.counts?.expiring || 0,
      icon: Clock,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      path: "/subscriptions/risk",
      urgent: false,
    },
    {
      id: "grace",
      label: "In Grace Period",
      count: data.atRiskSubscriptions?.counts?.gracePeriod || 0,
      icon: AlertTriangle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      path: "/subscriptions/risk",
      urgent: true,
    },
    {
      id: "suspended",
      label: "Suspended Accounts",
      count: data.atRiskSubscriptions?.counts?.suspended || 0,
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      path: "/subscriptions/risk",
      urgent: true,
    },
  ];

  // For SUPER_ADMIN: All pending actions
  const adminItems = [
    {
      id: "verification",
      label: "Pending Verifications",
      count: pendingCounts?.pendingVerifications || data.shopStats?.pendingReview || 0,
      icon: ShieldCheck,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      path: "/verification",
      urgent: false,
    },
    {
      id: "tickets",
      label: "Pending Tickets",
      count: pendingCounts?.pendingTickets || data.ticketStats?.pending || 0,
      icon: Ticket,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      path: "/communications/tickets",
      urgent: true,
    },
    {
      id: "enquiries",
      label: "Pending Enquiries",
      count: pendingCounts?.pendingEnquiries || data.enquiryStats?.pending || 0,
      icon: Mail,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      path: "/communications/enquiries",
      urgent: false,
    },
    {
      id: "at-risk",
      label: "At-Risk Subscriptions",
      count: data.atRiskSubscriptions?.counts?.total || 0,
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      path: "/subscriptions/risk",
      urgent: true,
    },
  ];

  const items = isAccounting ? accountingItems : adminItems;
  const totalPending = items.reduce((sum, item) => sum + item.count, 0);

  if (totalPending === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={32} className="text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-800">All Caught Up!</h3>
        <p className="text-sm text-emerald-600 mt-1">
          No pending actions require your attention.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Pending Actions
          </h3>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            {totalPending}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`
              group relative flex items-center gap-3 p-4 rounded-xl border 
              transition-all duration-200 hover:shadow-md
              ${item.count > 0 && item.urgent
                ? "border-red-200 bg-red-50/50 hover:border-red-300"
                : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              }
            `}
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
              <item.icon className={`w-5 h-5 ${item.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500 truncate">{item.label}</p>
            </div>

            {/* Arrow */}
            <ArrowRight 
              size={16} 
              className="text-gray-300 group-hover:text-[#000060] group-hover:translate-x-1 transition-all" 
            />

            {/* Urgent Badge */}
            {item.count > 0 && item.urgent && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PendingActionsPanel;