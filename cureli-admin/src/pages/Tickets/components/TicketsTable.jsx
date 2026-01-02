// cureli-admin/src/pages/Tickets/components/TicketsTable.jsx

import {
  Eye,
  ChevronUp,
  ChevronDown,
  Loader2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Inbox,
} from "lucide-react";
import { format } from "date-fns";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
      label: "Pending",
    },
    IN_PROGRESS: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
      label: "In Progress",
    },
    RESOLVED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      label: "Resolved",
    },
    CANCELLED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      dot: "bg-red-500",
      label: "Cancelled",
    },
    CLOSED: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-500",
      label: "Closed",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold 
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
      <span className="truncate">{config.label}</span>
    </span>
  );
};

// Category Badge Component
const CategoryBadge = ({ category }) => {
  const categoryConfig = {
    TECHNICAL_ISSUE: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
      label: "Technical",
    },
    BILLING_ISSUE: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      label: "Billing",
    },
    FEATURE_REQUEST: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
      label: "Feature",
    },
    ACCOUNT_ISSUE: {
      bg: "bg-pink-50",
      text: "text-pink-700",
      border: "border-pink-200",
      label: "Account",
    },
    OTHER: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
      label: "Other",
    },
  };

  const config = categoryConfig[category] || categoryConfig.OTHER;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium 
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};

// Reopen Count Badge
const ReopenBadge = ({ count }) => {
  if (!count || count === 0) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-400">
        <span className="text-xs font-medium">0</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold 
                    bg-orange-100 text-orange-700 border border-orange-200"
    >
      <RotateCcw size={10} />
      {count}
    </span>
  );
};

// Sort Icon Component
const SortIcon = ({ column, sortConfig }) => {
  const isActive = sortConfig.sortBy === column;

  return (
    <div className="flex flex-col -space-y-1">
      <ChevronUp
        size={10}
        className={`transition-colors ${
          isActive && sortConfig.order === "asc"
            ? "text-white"
            : "text-white/40"
        }`}
      />
      <ChevronDown
        size={10}
        className={`transition-colors ${
          isActive && sortConfig.order === "desc"
            ? "text-white"
            : "text-white/40"
        }`}
      />
    </div>
  );
};

// Sortable Header Cell
const SortableHeader = ({ column, label, sortConfig, onSort, className = "" }) => (
  <th
    onClick={() => onSort(column)}
    className={`px-2 sm:px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider 
                cursor-pointer hover:bg-white/10 transition-colors select-none ${className}`}
  >
    <div className="flex items-center gap-1">
      <span className="truncate">{label}</span>
      <SortIcon column={column} sortConfig={sortConfig} />
    </div>
  </th>
);

// Regular Header Cell
const HeaderCell = ({ children, className = "", center = false }) => (
  <th
    className={`px-2 sm:px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider 
                ${center ? "text-center" : "text-left"} ${className}`}
  >
    {children}
  </th>
);

// Main Table Component
const TicketsTable = ({
  tickets,
  loading,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  sortConfig,
  onSortChange,
  onViewTicket,
}) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "-";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "";
    }
  };

  const truncateText = (text, maxLength = 25) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (showEllipsisStart) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (showEllipsisEnd) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  return (
    // ✅ FIXED: Match UserTable structure
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* ✅ FIXED: Scrollable table container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "900px" }}>
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <HeaderCell className="w-10">#</HeaderCell>

              <SortableHeader
                column="ticket_number"
                label="Ticket"
                sortConfig={sortConfig}
                onSort={onSortChange}
              />

              <HeaderCell>Shop</HeaderCell>

              <HeaderCell>Subject</HeaderCell>

              <HeaderCell>Category</HeaderCell>

              <SortableHeader
                column="status"
                label="Status"
                sortConfig={sortConfig}
                onSort={onSortChange}
              />

              <HeaderCell center className="w-16">
                <RotateCcw size={12} className="mx-auto" />
              </HeaderCell>

              <HeaderCell>Created By</HeaderCell>

              <SortableHeader
                column="created_at"
                label="Created"
                sortConfig={sortConfig}
                onSort={onSortChange}
              />

              <HeaderCell center className="w-16">
                Actions
              </HeaderCell>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {/* Loading State */}
            {loading && (
              <tr>
                <td colSpan="10" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#05015A]/10 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-[#05015A]" />
                    </div>
                    <p className="text-sm text-gray-500">Loading tickets...</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan="10" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <Inbox size={28} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">No tickets found</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Try adjusting your filters
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!loading &&
              tickets.map((ticket, index) => (
                <tr
                  key={ticket.ticket_id}
                  className={`
                    border-b border-gray-100 transition-all duration-150
                    ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                    hover:bg-indigo-50/50
                  `}
                >
                  <td className="px-2 sm:px-3 py-3 text-gray-500 font-medium text-xs">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <button
                      onClick={() => onViewTicket(ticket)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#05015A] 
                                 hover:text-[#0a0280] transition-colors"
                    >
                      <FileText size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[100px]">{ticket.ticket_number}</span>
                    </button>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#05015A]/10 to-[#0a0280]/10 
                                      flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[#05015A]">
                          {ticket.shop_name?.substring(0, 2).toUpperCase() || "SH"}
                        </span>
                      </div>
                      <span
                        className="text-xs font-medium text-gray-900 truncate max-w-[80px]"
                        title={ticket.shop_name}
                      >
                        {ticket.shop_name || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <p
                      className="text-xs text-gray-700 truncate max-w-[120px]"
                      title={ticket.subject}
                    >
                      {truncateText(ticket.subject, 25)}
                    </p>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <CategoryBadge category={ticket.category} />
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex items-center justify-center">
                      <ReopenBadge count={ticket.reopen_count} />
                    </div>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-900 truncate max-w-[80px]">
                        {ticket.created_by_name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-gray-500 capitalize">
                        {ticket.created_by_role?.replace("_", " ") || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-900">
                        {formatDate(ticket.created_at)}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {formatTime(ticket.created_at)}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onViewTicket(ticket)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#05015A] 
                                   hover:bg-[#05015A]/10 transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ✅ FIXED: Pagination footer matches UserTable */}
      {!loading && tickets.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Results Info */}
            <div className="text-xs text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * rowsPerPage + 1}
              </span>
              {" - "}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * rowsPerPage, totalItems)}
              </span>
              {" of "}
              <span className="font-semibold text-gray-900">{totalItems}</span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-700
                           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="hidden sm:flex items-center gap-1 mx-1">
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-400 text-xs">
                      •••
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
                                  ${
                                    currentPage === page
                                      ? "bg-[#05015A] text-white shadow-sm"
                                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                  }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <div className="sm:hidden px-2 text-xs text-gray-600">
                <span className="font-semibold text-[#05015A]">{currentPage}</span>
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-700
                           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsTable;