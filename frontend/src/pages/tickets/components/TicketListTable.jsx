// frontend/src/pages/tickets/components/TicketListTable.jsx

import { 
  Eye, 
  XCircle, 
  ChevronUp, 
  ChevronDown,
  Ticket,
  Paperclip 
} from "lucide-react";
import { 
  STATUS_COLORS, 
  CATEGORY_COLORS,
  TICKET_STATUSES,
  TICKET_CATEGORIES 
} from "../../../constant/tickets";
import { format } from "date-fns";

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
  const SortableHeader = ({ column, label }) => {
    const isActive = sortConfig?.sortBy === column;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th
        onClick={() => onSortChange(column)}
        className="px-4 py-3 text-left text-xs font-semibold text-white cursor-pointer 
                   hover:bg-white/10 transition-colors select-none"
      >
        <div className="flex items-center justify-between gap-2">
          <span>{label}</span>
          <div className="flex flex-col gap-0.5">
            <ChevronUp
              size={12}
              className={`transition-colors ${
                isAsc ? "text-yellow-300" : "text-white/50"
              }`}
            />
            <ChevronDown
              size={12}
              className={`-mt-1 transition-colors ${
                isDesc ? "text-yellow-300" : "text-white/50"
              }`}
            />
          </div>
        </div>
      </th>
    );
  };

  const StatusBadge = ({ status }) => {
  const colors = STATUS_COLORS[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  }; // ✅ Fallback if status not found

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border
                  ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {TICKET_STATUSES[status] || status}
    </span>
  );
};

  const CategoryBadge = ({ category, otherText }) => {
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER;
    const label = category === "OTHER" && otherText 
      ? otherText 
      : TICKET_CATEGORIES[category] || category;

    return (
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium 
                    ${colors.bg} ${colors.text} border ${colors.border}`}
      >
        {label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return "-";
    }
  };

  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-200">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#05015A] to-[#0a0280]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white w-12">
                #
              </th>
              <SortableHeader column="ticket_number" label="Ticket No." />
              <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                Branch
              </th>
              <SortableHeader column="created_at" label="Created" />
              <th className="px-4 py-3 text-center text-xs font-semibold text-white w-24">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {tickets.length > 0 ? (
              tickets.map((ticket, i) => (
                <tr
                  key={ticket.ticket_id}
                  className={`border-b border-gray-100 transition-all hover:bg-indigo-50 
                              ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                >
                  <td className="px-4 py-3 text-gray-500 font-medium">
                    {startIndex + i + 1}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-indigo-600">
                        {ticket.ticket_number}
                      </span>
                      {ticket.attachment_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Paperclip size={12} />
                          <span>{ticket.attachment_count}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {ticket.subject}
                    </p>
                    {ticket.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {ticket.description}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <CategoryBadge 
                      category={ticket.category} 
                      otherText={ticket.other_category_text}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {ticket.branch_name || "-"}
                  </td>

                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {formatDate(ticket.created_at)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewTicket(ticket)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 
                                   hover:bg-indigo-50 transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      {(ticket.status === "PENDING" || ticket.status === "IN_PROGRESS") && ( // ✅ Changed OPEN to PENDING
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
            ) : (
              <tr>
                <td colSpan="8" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Ticket size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500 mb-1">
                      No tickets found
                    </p>
                    <p className="text-sm text-gray-400">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">
            {totalItems > 0 ? startIndex + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium text-gray-700">
            {Math.min(startIndex + rowsPerPage, totalItems)}
          </span>{" "}
          of <span className="font-medium text-gray-700">{totalItems}</span> tickets
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg 
                       hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg 
                       hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketListTable;
