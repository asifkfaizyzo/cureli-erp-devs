// cureli-admin/src/pages/Tickets/components/TicketsHeader.jsx

import { Ticket, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

const TicketsHeader = ({ stats, onRefresh }) => {
  // ✅ Debug log to see what stats we're receiving
  console.log("📊 Stats received:", stats);

  // ✅ Safely access nested stats
  const totalTickets = stats?.total || 0;
  const pendingCount = stats?.pending || stats?.by_status?.PENDING || 0;
  const inProgressCount = stats?.in_progress || stats?.by_status?.IN_PROGRESS || 0;
  const resolvedCount = stats?.resolved || stats?.by_status?.RESOLVED || 0;
  const cancelledCount = stats?.cancelled || stats?.by_status?.CANCELLED || 0;
  const closedCount = stats?.closed || stats?.by_status?.CLOSED || 0;

  const statCards = [
    {
      label: "Total Tickets",
      value: totalTickets,
      icon: Ticket,
      color: "bg-blue-50 text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
      borderColor: "border-yellow-200",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: AlertCircle,
      color: "bg-purple-50 text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      borderColor: "border-green-200",
    },
    {
      label: "Closed",
      value: closedCount,
      icon: CheckCircle,
      color: "bg-gray-50 text-gray-600",
      borderColor: "border-gray-200",
    },
    {
      label: "Cancelled",
      value: cancelledCount,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl border ${stat.borderColor} p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
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
