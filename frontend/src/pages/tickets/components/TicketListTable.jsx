// frontend/src/pages/tickets/components/TicketListTable.jsx

import { useState } from "react";
import { Eye, XCircle, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  STATUS_COLORS,
  CATEGORY_COLORS,
} from "../../../constant/tickets";
import { format } from "date-fns";
import { useAuthStore } from "../../../store/useAuthStore";

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
  const colors = STATUS_COLORS[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  const label = TICKET_STATUSES[status] || status;

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border
                  ${colors.bg} ${colors.text} ${colors.border} whitespace-nowrap`}
    >
      {label}
    </span>
  );
};

// ============================================
// CATEGORY BADGE COMPONENT
// ============================================
const CategoryBadge = ({ category }) => {
  const colors = CATEGORY_COLORS[category] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  const label = TICKET_CATEGORIES[category] || category;

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border
                  ${colors.bg} ${colors.text} ${colors.border} whitespace-nowrap`}
    >
      {label}
    </span>
  );
};

// ============================================
// SORT ICON COMPONENT
// ============================================
const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.sortBy !== column) {
    return <ChevronUp size={14} className="text-gray-300" />;
  }
  return sortConfig.order === "asc" ? (
    <ChevronUp size={14} className="text-white" />
  ) : (
    <ChevronDown size={14} className="text-white" />
  );
};

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
  const { user } = useAuthStore();
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // ✅ Filter tickets based on user role
  const filteredTickets = tickets.filter((ticket) => {
    // Super admin sees all tickets
    if (user?.role === "super_admin") {
      return true;
    }
    
    // Branch admin only sees tickets they created
    if (user?.role === "branch_admin") {
      return ticket.created_by_user_id === user?.user_id;
    }
    
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (err) {
      return "-";
    }
  };

  // Truncate subject text
  const truncateText = (text, maxLength = 40) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full">
      {/* Table Container - Responsive with horizontal scroll on mobile */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          {/* ✅ Header with Dark Blue Background #000060 */}
          <thead className="sticky top-0 z-10" style={{ backgroundColor: '#000060' }}>
            <tr className="border-b border-gray-700">
              <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-12">
                #
              </th>

              {/* Ticket Number - Sortable */}
              <th
                onClick={() => onSortChange("ticket_number")}
                className="px-3 py-3 text-left text-xs font-semibold text-white 
                           uppercase tracking-wider cursor-pointer hover:bg-[#000050] 
                           transition-colors min-w-[130px]"
              >
                <div className="flex items-center gap-1">
                  <span>Ticket No.</span>
                  <SortIcon column="ticket_number" sortConfig={sortConfig} />
                </div>
              </th>

              {/* ✅ Subject - Shrunk but visible */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[180px]">
                Subject
              </th>

              <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[120px]">
                Category
              </th>

              {/* Status - Sortable */}
              <th
                onClick={() => onSortChange("status")}
                className="px-3 py-3 text-left text-xs font-semibold text-white 
                           uppercase tracking-wider cursor-pointer hover:bg-[#000050] 
                           transition-colors min-w-[110px]"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <SortIcon column="status" sortConfig={sortConfig} />
                </div>
              </th>

              {/* Created By */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[130px]">
                Created By
              </th>

              {/* Created - Sortable */}
              <th
                onClick={() => onSortChange("created_at")}
                className="px-3 py-3 text-left text-xs font-semibold text-white 
                           uppercase tracking-wider cursor-pointer hover:bg-[#000050] 
                           transition-colors min-w-[150px]"
              >
                <div className="flex items-center gap-1">
                  <span>Created</span>
                  <SortIcon column="created_at" sortConfig={sortConfig} />
                </div>
              </th>

              <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="animate-spin text-indigo-600" />
                    <p className="text-sm text-gray-500">Loading tickets...</p>
                  </div>
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center">
                  <p className="text-sm text-gray-500">No tickets found</p>
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket, index) => (
                <tr
                  key={ticket.ticket_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Serial Number */}
                  <td className="px-3 py-3 text-sm text-gray-500">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>

                  {/* Ticket Number */}
                  <td className="px-3 py-3">
                    <button
                      onClick={() => onViewTicket(ticket)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 
                                 hover:underline transition-colors"
                    >
                      {ticket.ticket_number}
                    </button>
                  </td>

                  {/* ✅ Subject - Truncated */}
                  <td className="px-3 py-3">
                    <p 
                      className="text-sm text-gray-900 truncate max-w-[180px]"
                      title={ticket.subject}
                    >
                      {truncateText(ticket.subject, 40)}
                    </p>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3">
                    <CategoryBadge category={ticket.category} />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>

                  {/* Created By */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[130px]">
                        {ticket.created_by_name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {ticket.created_by_role?.replace("_", " ") || "-"}
                      </p>
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-3 py-3">
                    <p className="text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(ticket.created_at)}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => onViewTicket(ticket)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 
                                   hover:bg-indigo-50 transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Cancel Button - Only for PENDING and IN_PROGRESS */}
                      {(ticket.status === "PENDING" ||
                        ticket.status === "IN_PROGRESS") && (
                        <button
                          onClick={() => onCancelTicket(ticket)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 
                                     hover:bg-red-50 transition-all"
                          title="Cancel Ticket"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filteredTickets.length > 0 && (
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Results Info */}
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * rowsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> results
          </p>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg 
                         hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
                                   ${
                                     currentPage === page
                                       ? "bg-indigo-600 text-white"
                                       : "border border-gray-300 hover:bg-gray-50"
                                   }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
              )}
            </div>

            {/* Mobile Page Indicator */}
            <div className="sm:hidden px-3 py-1.5 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg 
                         hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketListTable;
