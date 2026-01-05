// cureli-admin/src/pages/Tickets/components/TicketsTable.jsx

import {
  Eye,
  ChevronUp,
  ChevronDown,
  Loader2,
  RotateCcw,
  FileText,
  Inbox,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import {
  getStatusConfig,
  getCategoryConfig,
  getPriorityConfig,
} from "../../../../../config/ticketConfigs";
import Pagination from "../../../../../components/common/Pagination";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold 
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`}
      />
      <span className="truncate">{config.label}</span>
    </span>
  );
};

// Category Badge Component
const CategoryBadge = ({ category }) => {
  const config = getCategoryConfig(category);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium 
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const config = getPriorityConfig(priority);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold 
                  ${config.bg} ${config.text} border ${
        config.border
      } whitespace-nowrap
                  ${config.pulse ? "animate-pulse" : ""}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`}
      />
      <span>{config.label}</span>
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

  const isHigh = count >= 3;
  const isCritical = count >= 5;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold 
                  ${
                    isCritical
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : isHigh
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}
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
const SortableHeader = ({
  column,
  label,
  sortConfig,
  onSort,
  className = "",
}) => (
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
  hasActiveFilters = false,
}) => {
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

  // Empty state content based on context
  const renderEmptyState = () => {
    if (hasActiveFilters) {
      return (
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <Search size={28} className="text-amber-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              No tickets match your filters
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting or clearing your filters
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <Inbox size={28} className="text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">No tickets yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Tickets will appear here when created
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Scrollable table container */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "1000px" }}
        >
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

              <HeaderCell>Priority</HeaderCell>

              <SortableHeader
                column="status"
                label="Status"
                sortConfig={sortConfig}
                onSort={onSortChange}
              />

              <SortableHeader
                column="reopen_count"
                label={<RotateCcw size={12} className="mx-auto" />}
                sortConfig={sortConfig}
                onSort={onSortChange}
                className="w-16 text-center"
              />

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
                <td colSpan="11" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#05015A]/10 flex items-center justify-center">
                      <Loader2
                        size={20}
                        className="animate-spin text-[#05015A]"
                      />
                    </div>
                    <p className="text-sm text-gray-500">Loading tickets...</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan="11" className="px-4 py-12 text-center">
                  {renderEmptyState()}
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
                      <FileText
                        size={12}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <span className="truncate max-w-[100px]">
                        {ticket.ticket_number}
                      </span>
                    </button>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-md bg-gradient-to-br from-[#05015A]/10 to-[#0a0280]/10 
                                      flex items-center justify-center flex-shrink-0"
                      >
                        <span className="text-[10px] font-bold text-[#05015A]">
                          {ticket.shop_name?.substring(0, 2).toUpperCase() ||
                            "SH"}
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
                    <PriorityBadge priority={ticket.priority} />
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

      {/* Pagination Component - Acts as 10th row */}
      {!loading && tickets.length > 0 && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}
    </div>
  );
};

export default TicketsTable;