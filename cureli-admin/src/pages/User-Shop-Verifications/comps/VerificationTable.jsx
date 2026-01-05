// cureli-admin/src/components/Verification/VerificationTable.jsx

import { useState, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown, ShieldCheck, Calendar } from "lucide-react";
import Pagination from "../../../components/common/Pagination"; // ✅ Use common Pagination

const VerificationTable = ({
  data = [],
  loading = false,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  sortField,
  sortOrder,
  onSortChange,
  onRowClick,
}) => {
  const [columnWidths, setColumnWidths] = useState({
    slNo: 50,
    shopName: 200,
    ownerInfo: 220,
    status: 150,
    files: 120,
    resubCount: 100,
    date: 130,
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    if (column === "slNo") return;
    e.preventDefault();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(80, resizing.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    },
    [resizing]
  );

  const handleMouseUp = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  // Calculate start index for row numbering
  const startIndex = (currentPage - 1) * rowsPerPage;

  // Status badge configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case "verified":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          dot: "bg-emerald-500",
          label: "Verified",
        };
      case "pending_review":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          dot: "bg-amber-500",
          label: "Pending Review",
        };
      case "partially_rejected":
        return {
          bg: "bg-orange-50",
          text: "text-orange-700",
          border: "border-orange-200",
          dot: "bg-orange-500",
          label: "Partial Reject",
        };
      case "rejected":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          dot: "bg-red-500",
          label: "Rejected",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
          dot: "bg-gray-500",
          label: status || "Unknown",
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Sortable Header Component
  const SortHeader = ({ field, label, width, align = "left" }) => {
    const isActive = sortField === field;
    const isAsc = isActive && sortOrder === "asc";
    const isDesc = isActive && sortOrder === "desc";

    return (
      <th
        style={{ width }}
        className={`relative group select-none px-4 py-3 text-${align} font-semibold text-xs uppercase tracking-wider`}
      >
        <div
          onClick={() => onSortChange?.(field)}
          className={`
            flex items-center gap-1 cursor-pointer transition-colors rounded px-1 -mx-1 py-0.5
            hover:bg-white/10 ${align === "center" ? "justify-center" : ""}
          `}
        >
          <span className="truncate">{label}</span>
          <div className="flex flex-col shrink-0">
            <ChevronUp
              size={10}
              className={`-mb-0.5 ${
                isAsc ? "text-yellow-300" : "text-white/30"
              }`}
            />
            <ChevronDown
              size={10}
              className={`-mt-0.5 ${
                isDesc ? "text-yellow-300" : "text-white/30"
              }`}
            />
          </div>
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(field, e)}
          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-yellow-400/50 transition-colors z-20"
        />
      </th>
    );
  };

  // Non-sortable Header Component
  const Header = ({ label, width, field, align = "left" }) => (
    <th
      style={{ width }}
      className={`relative group select-none px-4 py-3 text-${align} font-semibold text-xs uppercase tracking-wider`}
    >
      <span className="truncate">{label}</span>
      {field && (
        <div
          onMouseDown={(e) => handleMouseDown(field, e)}
          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-yellow-400/50 transition-colors z-20"
        />
      )}
    </th>
  );

  // Loading State
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-200">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#05015A] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Loading verification records...
          </p>
          <p className="text-gray-400 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Table Container */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse text-sm">
          {/* Table Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white">
              <Header label="#" width={columnWidths.slNo} align="center" />
              <SortHeader
                field="business_name"
                label="Shop"
                width={columnWidths.shopName}
              />
              <SortHeader
                field="owner_name"
                label="Owner"
                width={columnWidths.ownerInfo}
              />
              <SortHeader
                field="verification_status"
                label="Status"
                width={columnWidths.status}
              />
              <Header
                label="Files"
                width={columnWidths.files}
                field="files"
                align="center"
              />
              <SortHeader
                field="resubmission_count"
                label="Resub"
                width={columnWidths.resubCount}
                align="center"
              />
              <SortHeader
                field="created_at"
                label="Submitted"
                width={columnWidths.date}
              />
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? (
              data.map((shop, i) => {
                const statusConfig = getStatusConfig(shop.verification_status);
                const rowIndex = startIndex + i + 1; // ✅ Fixed row numbering

                return (
                  <tr
                    key={shop.shop_id || `v-${i}`}
                    onClick={() => onRowClick?.(shop)}
                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                  >
                    {/* Row Number */}
                    <td
                      style={{ width: columnWidths.slNo }}
                      className="px-4 py-3 text-center"
                    >
                      <span className="text-gray-400 font-medium text-xs">
                        {rowIndex}
                      </span>
                    </td>

                    {/* Shop Info */}
                    <td
                      style={{ width: columnWidths.shopName }}
                      className="px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                          <span className="text-[#05015A] font-bold text-xs">
                            {shop.business_name
                              ?.substring(0, 2)
                              .toUpperCase() || "SH"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate group-hover:text-[#05015A] transition-colors">
                            {shop.business_name || "Unnamed Shop"}
                          </p>
                          <p className="text-xs text-gray-400 truncate font-mono">
                            {shop.shop_id?.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td
                      style={{ width: columnWidths.ownerInfo }}
                      className="px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {shop.owner_name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {shop.owner_email || "No email"}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td
                      style={{ width: columnWidths.status }}
                      className="px-4 py-3"
                    >
                      <span
                        className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                          border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
                        `}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Files Count */}
                    <td
                      style={{ width: columnWidths.files }}
                      className="px-4 py-3 text-center"
                    >
                      <div className="inline-flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-600 font-semibold">
                            {shop.files_approved || 0}
                          </span>
                          <span className="text-gray-300">/</span>
                          <span className="text-gray-600 font-medium">
                            {shop.files_total || 0}
                          </span>
                        </div>
                        {shop.files_rejected > 0 && (
                          <span className="text-xs text-red-500 font-medium">
                            ({shop.files_rejected} ✗)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Resubmission Count */}
                    <td
                      style={{ width: columnWidths.resubCount }}
                      className="px-4 py-3 text-center"
                    >
                      {shop.resubmission_count > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          {shop.resubmission_count}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td
                      style={{ width: columnWidths.date }}
                      className="px-4 py-3"
                    >
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar
                          size={14}
                          className="text-gray-400 shrink-0"
                        />
                        <span className="text-sm">
                          {formatDate(shop.created_at)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                      <ShieldCheck size={40} className="text-gray-300" />
                    </div>
                    <p className="text-xl font-semibold text-gray-600 mb-2">
                      No verification records found
                    </p>
                    <p className="text-gray-400 max-w-sm">
                      There are no shops matching your current filters. Try
                      adjusting your search criteria.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ UPDATED: Use common Pagination component */}
      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
};

export default VerificationTable;
