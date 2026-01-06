// cureli-admin/src/pages/Tickets/components/TicketsTable.jsx

import { useEffect, useState } from "react";
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

// Compact Status Badge
const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium 
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap min-w-[80px] justify-center`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
      {config.label}
    </span>
  );
};

// Compact Category Badge
const CategoryBadge = ({ category }) => {
  const config = getCategoryConfig(category);
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium text-center
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap min-w-[70px]`}
    >
      {config.label}
    </span>
  );
};

// Priority with Reopen indicator
const PriorityCell = ({ priority, reopenCount = 0 }) => {
  const config = getPriorityConfig(priority);
  const hasReopens = reopenCount > 0;
  const isCritical = reopenCount >= 5;
  const isHigh = reopenCount >= 3;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold 
                    ${config.bg} ${config.text} border ${config.border}
                    ${config.pulse ? "animate-pulse" : ""}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
      {hasReopens && (
        <span
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold
                      ${
                        isCritical
                          ? "bg-red-100 text-red-700"
                          : isHigh
                          ? "bg-orange-100 text-orange-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
          title={`Reopened ${reopenCount}x`}
        >
          <RotateCcw size={9} />
          {reopenCount}
        </span>
      )}
    </div>
  );
};

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
  // Column widths - 8 columns like UserTable
  const [columnWidths, setColumnWidths] = useState({
    slNo: 50,
    ticket: 120,
    shop: 140,
    subject: 180,
    category: 100,
    priority: 130,
    status: 110,
    actions: 70,
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    e.preventDefault();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = (e) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const newWidth = Math.max(50, resizing.startWidth + diff);
    setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
  };

  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM, HH:mm");
    } catch {
      return "-";
    }
  };

  // Sortable Header matching UserTable style
  const SortableHeader = ({ column, label, width }) => {
    const isActive = sortConfig?.sortBy === column;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th style={{ width, minWidth: width }} className="relative group">
        <div
          className="flex items-center justify-between p-3 cursor-pointer select-none"
          onClick={() => onSortChange && onSortChange(column)}
        >
          <span className="font-semibold">{label}</span>
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
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30 transition-colors"
        />
      </th>
    );
  };

  const startIndex = (currentPage - 1) * rowsPerPage;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#05015A]" />
          <p className="text-sm text-gray-500">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "800px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <th
                style={{ width: columnWidths.slNo }}
                className="p-3 font-semibold"
              >
                #
              </th>

              <SortableHeader
                column="ticket_number"
                label="Ticket"
                width={columnWidths.ticket}
              />

              <th
                style={{ width: columnWidths.shop }}
                className="p-3 font-semibold relative group"
              >
                Shop / Created
                <div
                  onMouseDown={(e) => handleMouseDown("shop", e)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30"
                />
              </th>

              <th
                style={{ width: columnWidths.subject }}
                className="p-3 font-semibold relative group"
              >
                Subject
                <div
                  onMouseDown={(e) => handleMouseDown("subject", e)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30"
                />
              </th>

              <th
                style={{ width: columnWidths.category }}
                className="p-3 font-semibold text-center"
              >
                Category
              </th>

              <SortableHeader
                column="priority"
                label="Priority"
                width={columnWidths.priority}
              />

              <SortableHeader
                column="status"
                label="Status"
                width={columnWidths.status}
              />

              <th
                style={{ width: columnWidths.actions, minWidth: 60 }}
                className="p-2 font-semibold text-center"
              >
                View
              </th>
            </tr>
          </thead>

          <tbody>
            {tickets.length > 0 ? (
              tickets.map((ticket, i) => (
                <tr
                  key={ticket.ticket_id}
                  className={`
                    border-b border-gray-100 transition-all duration-150
                    ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    hover:bg-indigo-50
                  `}
                >
                  {/* # */}
                  <td className="p-3 text-gray-500 font-medium">
                    {startIndex + i + 1}
                  </td>

                  {/* Ticket Number */}
                  <td className="p-3">
                    <button
                      onClick={() => onViewTicket(ticket)}
                      className="flex items-center gap-1.5 font-semibold text-[#05015A] hover:text-[#0a0280] hover:underline"
                    >
                      <FileText size={14} className="text-gray-400" />
                      <span className="truncate max-w-[100px]">
                        {ticket.ticket_number}
                      </span>
                    </button>
                  </td>

                  {/* Shop + Created Date (combined) */}
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-6 h-6 rounded-md bg-gradient-to-br from-[#05015A]/10 to-[#0a0280]/10 
                                      flex items-center justify-center flex-shrink-0"
                        >
                          <span className="text-[9px] font-bold text-[#05015A]">
                            {ticket.shop_name?.substring(0, 2).toUpperCase() || "SH"}
                          </span>
                        </div>
                        <span
                          className="text-sm font-medium text-gray-900 truncate max-w-[90px]"
                          title={ticket.shop_name}
                        >
                          {ticket.shop_name || "-"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 ml-7">
                        {formatDateTime(ticket.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="p-3">
                    <p
                      className="text-sm text-gray-700 truncate max-w-[160px]"
                      title={ticket.subject}
                    >
                      {ticket.subject || "-"}
                    </p>
                  </td>

                  {/* Category */}
                  <td className="p-3 text-center">
                    <CategoryBadge category={ticket.category} />
                  </td>

                  {/* Priority + Reopen */}
                  <td className="p-3">
                    <PriorityCell
                      priority={ticket.priority}
                      reopenCount={ticket.reopen_count}
                    />
                  </td>

                  {/* Status */}
                  <td className="p-3 text-center">
                    <StatusBadge status={ticket.status} />
                  </td>

                  {/* Actions */}
                  <td className="p-2">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onViewTicket(ticket)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50 transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-4
                                  ${hasActiveFilters ? "bg-amber-50" : "bg-gray-100"}`}
                    >
                      {hasActiveFilters ? (
                        <Search size={32} className="text-amber-400" />
                      ) : (
                        <Inbox size={32} className="text-gray-300" />
                      )}
                    </div>
                    <p className="text-lg font-medium text-gray-500 mb-1">
                      {hasActiveFilters ? "No matching tickets" : "No tickets yet"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {hasActiveFilters
                        ? "Try adjusting your filters"
                        : "Tickets will appear here when created"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {tickets.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </div>
      )}
    </div>
  );
};

export default TicketsTable;