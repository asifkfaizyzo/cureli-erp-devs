// frontend/src/pages/tickets/components/TicketListTable.jsx

import {
  Eye,
  XCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Inbox,
} from "lucide-react";
import { TICKET_STATUSES, TICKET_CATEGORIES } from "../../../constant/tickets";
import { format } from "date-fns";

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
    CLOSED: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const label = TICKET_STATUSES[status] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
};

// ============================================
// CATEGORY BADGE COMPONENT
// ============================================
const CategoryBadge = ({ category }) => {
  const categoryConfig = {
    TECHNICAL_ISSUE: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
    BILLING_ISSUE: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    FEATURE_REQUEST: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
    ACCOUNT_ISSUE: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
    OTHER: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  };

  const config = categoryConfig[category] || categoryConfig.OTHER;
  const label = TICKET_CATEGORIES[category] || category;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
      {label}
    </span>
  );
};

// ============================================
// SORT ICON COMPONENT
// ============================================
const SortIcon = ({ column, sortConfig }) => {
  const isActive = sortConfig.sortBy === column;
  return (
    <div className="flex flex-col -space-y-1">
      <ChevronUp size={12} className={`transition-colors ${isActive && sortConfig.order === "asc" ? "text-white" : "text-white/40"}`} />
      <ChevronDown size={12} className={`transition-colors ${isActive && sortConfig.order === "desc" ? "text-white" : "text-white/40"}`} />
    </div>
  );
};

// ============================================
// SORTABLE HEADER COMPONENT
// ============================================
const SortableHeader = ({ column, label, sortConfig, onSort, className = "" }) => (
  <th
    onClick={() => onSort(column)}
    className={`px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none ${className}`}
  >
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <SortIcon column={column} sortConfig={sortConfig} />
    </div>
  </th>
);

// ============================================
// REGULAR HEADER COMPONENT
// ============================================
const HeaderCell = ({ children, className = "", center = false }) => (
  <th className={`px-4 py-4 text-xs font-semibold text-white uppercase tracking-wider ${center ? "text-center" : "text-left"} ${className}`}>
    {children}
  </th>
);

// ============================================
// MAIN TABLE COMPONENT
// ============================================
const TicketListTable = ({
  tickets,
  loading,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  sortConfig,
  onSortChange,
  onViewTicket,
  onCancelTicket,
}) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // ✅ REMOVED: Client-side filtering - backend handles authorization
  // Now using tickets directly

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

  const truncateText = (text, maxLength = 35) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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

  const canCancel = (status) => status === "PENDING" || status === "IN_PROGRESS";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gradient-to-r from-[#05015A] to-[#0a0280]">
            <tr>
              <HeaderCell className="w-14 rounded-tl-2xl">#</HeaderCell>
              <SortableHeader column="ticket_number" label="Ticket No." sortConfig={sortConfig} onSort={onSortChange} className="min-w-[140px]" />
              <HeaderCell className="min-w-[200px]">Subject</HeaderCell>
              <HeaderCell className="min-w-[120px]">Category</HeaderCell>
              <SortableHeader column="status" label="Status" sortConfig={sortConfig} onSort={onSortChange} className="min-w-[130px]" />
              <HeaderCell className="min-w-[150px]">Created By</HeaderCell>
              <SortableHeader column="created_at" label="Created" sortConfig={sortConfig} onSort={onSortChange} className="min-w-[140px]" />
              <HeaderCell center className="w-28 rounded-tr-2xl">Actions</HeaderCell>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan="8" className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#05015A]/10 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-[#05015A]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Loading tickets...</p>
                      <p className="text-xs text-gray-500 mt-1">Please wait while we fetch your tickets</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <Inbox size={32} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">No tickets found</p>
                      <p className="text-xs text-gray-500 mt-1">Create a new ticket to get started</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              tickets.map((ticket, index) => (
                <tr key={ticket.ticket_id} className="group hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500 font-medium">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={() => onViewTicket(ticket)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#05015A] hover:text-[#0a0280] transition-colors group/btn"
                    >
                      <FileText size={14} className="text-gray-400 group-hover/btn:text-[#05015A] transition-colors" />
                      {ticket.ticket_number}
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700 truncate max-w-[200px]" title={ticket.subject}>
                      {truncateText(ticket.subject, 35)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <CategoryBadge category={ticket.category} />
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {ticket.created_by_name || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {ticket.created_by_role?.replace("_", " ") || "-"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{formatDate(ticket.created_at)}</span>
                      <span className="text-xs text-gray-500">{formatTime(ticket.created_at)}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewTicket(ticket)}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#05015A] hover:bg-[#05015A]/10 transition-all group/action"
                        title="View Details"
                      >
                        <Eye size={18} className="group-hover/action:scale-110 transition-transform" />
                      </button>

                      {canCancel(ticket.status) ? (
                        <button
                          onClick={() => onCancelTicket(ticket)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all group/cancel"
                          title="Cancel Ticket"
                        >
                          <XCircle size={18} className="group-hover/cancel:scale-110 transition-transform" />
                        </button>
                      ) : (
                        <div className="w-[34px] h-[34px]" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && tickets.length > 0 && (
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing
                <span className="font-semibold text-gray-900 mx-1">{(currentPage - 1) * rowsPerPage + 1}</span>
                to
                <span className="font-semibold text-gray-900 mx-1">{Math.min(currentPage * rowsPerPage, totalItems)}</span>
                of
                <span className="font-semibold text-gray-900 mx-1">{totalItems}</span>
                tickets
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="hidden md:flex items-center gap-1 mx-2">
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400">
                      •••
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                        currentPage === page
                          ? "bg-[#05015A] text-white shadow-lg shadow-[#05015A]/25"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <div className="md:hidden px-4 py-2 text-sm font-medium text-gray-600">
                <span className="text-[#05015A] font-semibold">{currentPage}</span>
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketListTable;