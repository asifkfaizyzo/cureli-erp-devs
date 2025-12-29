// cureli-admin/src/pages/Tickets/components/TicketsTable.jsx

import { Eye, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { format } from "date-fns";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusColors = {
    PENDING: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    IN_PROGRESS: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    RESOLVED: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    CANCELLED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    CLOSED: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };

  const statusLabels = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CANCELLED: "Cancelled",
    CLOSED: "Closed",
  };

  const colors = statusColors[status] || statusColors.PENDING;
  const label = statusLabels[status] || status;

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border
                  ${colors.bg} ${colors.text} ${colors.border} whitespace-nowrap`}
    >
      {label}
    </span>
  );
};

// Category Badge Component
const CategoryBadge = ({ category }) => {
  const categoryColors = {
    TECHNICAL_ISSUE: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    BILLING_ISSUE: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    FEATURE_REQUEST: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    ACCOUNT_ISSUE: {
      bg: "bg-pink-50",
      text: "text-pink-700",
      border: "border-pink-200",
    },
    OTHER: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };

  const categoryLabels = {
    TECHNICAL_ISSUE: "Technical",
    BILLING_ISSUE: "Billing",
    FEATURE_REQUEST: "Feature",
    ACCOUNT_ISSUE: "Account",
    OTHER: "Other",
  };

  const colors = categoryColors[category] || categoryColors.OTHER;
  const label = categoryLabels[category] || category;

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border
                  ${colors.bg} ${colors.text} ${colors.border} whitespace-nowrap`}
    >
      {label}
    </span>
  );
};

// Sort Icon Component
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (err) {
      return "-";
    }
  };

  // Truncate text
  const truncateText = (text, maxLength = 40) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full">
      {/* Table Container */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          {/* Header with Dark Blue Background #000060 */}
          <thead className="sticky top-0 z-10" style={{ backgroundColor: "#000060" }}>
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

              {/* Shop Name */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[150px]">
                Shop Name
              </th>

              {/* Subject */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[180px]">
                Subject
              </th>

              {/* Category */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[100px]">
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

              {/* Actions */}
              <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="animate-spin text-indigo-600" />
                    <p className="text-sm text-gray-500">Loading tickets...</p>
                  </div>
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center">
                  <p className="text-sm text-gray-500">No tickets found</p>
                </td>
              </tr>
            ) : (
              tickets.map((ticket, index) => (
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

                  {/* Shop Name */}
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                      {ticket.shop_name || "-"}
                    </p>
                  </td>

                  {/* Subject */}
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
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onViewTicket(ticket)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 
                                   hover:bg-indigo-50 transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && tickets.length > 0 && (
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
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

export default TicketsTable;
