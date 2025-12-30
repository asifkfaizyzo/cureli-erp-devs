// cureli-admin/src/pages/Tickets/components/TicketsHeader.jsx

import { Ticket, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

const TicketsHeader = ({ stats, onRefresh }) => {
  const statCards = [
    {
      label: "Total Tickets",
      value: stats?.total || 0,
      icon: Ticket,
      color: "bg-blue-50 text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      label: "Pending",
      value: stats?.pending || 0,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
      borderColor: "border-yellow-200",
    },
    {
      label: "In Progress",
      value: stats?.in_progress || 0,
      icon: AlertCircle,
      color: "bg-purple-50 text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      label: "Resolved",
      value: stats?.resolved || 0,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      borderColor: "border-green-200",
    },
    {
      label: "Cancelled",
      value: stats?.cancelled || 0,
      icon: XCircle,
      color: "bg-red-50 text-red-600",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all customer support tickets across shops
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                     hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl border ${stat.borderColor} p-4 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketsHeader;
