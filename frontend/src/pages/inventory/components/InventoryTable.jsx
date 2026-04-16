// src/pages/inventory/components/InventoryTable.jsx

import React, { useRef, useCallback, useEffect, useState } from "react";
import InventoryRowFixed from "./InventoryRowFixed";
import InventoryPagination from "../../../components/common/Pagination";
import {
  ChevronUp,
  ChevronDown,
  Package,
  Loader2,
  Layers,
  Building2,
  Link2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";

// ══════════════════════════════════════════════════════════════
// CATALOG STATUS BADGE COMPONENT
// ══════════════════════════════════════════════════════════════

const CatalogStatusBadge = ({ status, confidence, loading }) => {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        Loading...
      </span>
    );
  }

  const config = {
    LINKED: {
      label: "Linked",
      icon: CheckCircle,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      iconColor: "text-emerald-500",
    },
    PENDING: {
      label: "Pending",
      icon: Clock,
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      iconColor: "text-amber-500",
    },
    NOT_LINKED: {
      label: "Not Linked",
      icon: AlertCircle,
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-600",
      iconColor: "text-slate-400",
    },
  };

  const c = config[status] || config.NOT_LINKED;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.border} ${c.text}`}
      title={confidence > 0 ? `Confidence: ${confidence}%` : undefined}
    >
      <Icon size={12} className={c.iconColor} />
      {c.label}
      {confidence > 0 && status !== "NOT_LINKED" && (
        <span className="text-[10px] opacity-70">({confidence}%)</span>
      )}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════
// SKELETON ROW COMPONENT
// ══════════════════════════════════════════════════════════════

const SkeletonRow = ({ rowHeight, isEven, index, showBranchColumn }) => (
  <tr
    style={{ height: `${rowHeight}px` }}
    className={`${isEven ? "bg-white" : "bg-slate-50/50"}`}
  >
    {/* Row number */}
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-center">
        <div
          className="w-5 h-5 bg-slate-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 30}ms` }}
        />
      </div>
    </td>
    {/* Item name */}
    <td className="border-b border-r border-slate-200 p-1.5">
      <div className="space-y-1">
        <div
          className="h-3.5 bg-slate-200 rounded animate-pulse w-[85%]"
          style={{ animationDelay: `${index * 30 + 50}ms` }}
        />
        <div
          className="h-2.5 bg-slate-100 rounded animate-pulse w-[60%]"
          style={{ animationDelay: `${index * 30 + 80}ms` }}
        />
      </div>
    </td>
    {/* Category */}
    <td className="border-b border-r border-slate-200 p-1">
      <div
        className="h-3 bg-slate-200 rounded animate-pulse w-[70%]"
        style={{ animationDelay: `${index * 30 + 100}ms` }}
      />
    </td>
    {/* Catalog Status */}
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-center">
        <div
          className="h-5 bg-slate-200 rounded-full animate-pulse w-20"
          style={{ animationDelay: `${index * 30 + 110}ms` }}
        />
      </div>
    </td>
    {/* Manufacturer */}
    <td className="border-b border-r border-slate-200 p-1">
      <div
        className="h-3 bg-slate-200 rounded animate-pulse w-[75%]"
        style={{ animationDelay: `${index * 30 + 120}ms` }}
      />
    </td>
    {/* Batch */}
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-center">
        <div
          className="h-3 bg-slate-200 rounded animate-pulse w-16"
          style={{ animationDelay: `${index * 30 + 140}ms` }}
        />
      </div>
    </td>
    {/* Expiry */}
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-center">
        <div
          className="h-3 bg-slate-200 rounded animate-pulse w-14"
          style={{ animationDelay: `${index * 30 + 160}ms` }}
        />
      </div>
    </td>
    {/* Branch - Conditional */}
    {showBranchColumn && (
      <td className="border-b border-r border-slate-200 p-1">
        <div className="flex justify-center">
          <div
            className="h-5 bg-slate-200 rounded-full animate-pulse w-20"
            style={{ animationDelay: `${index * 30 + 170}ms` }}
          />
        </div>
      </td>
    )}
    {/* Supplier */}
    <td className="border-b border-r border-slate-200 p-1">
      <div
        className="h-3 bg-slate-200 rounded animate-pulse w-[80%]"
        style={{ animationDelay: `${index * 30 + 180}ms` }}
      />
    </td>
    {/* Qty */}
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-center">
        <div
          className="h-3 bg-slate-200 rounded animate-pulse w-10"
          style={{ animationDelay: `${index * 30 + 200}ms` }}
        />
      </div>
    </td>
    {/* MRP */}
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-end pr-1">
        <div
          className="h-3 bg-slate-200 rounded animate-pulse w-14"
          style={{ animationDelay: `${index * 30 + 220}ms` }}
        />
      </div>
    </td>
    {/* Rack */}
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-center">
        <div
          className="h-3 bg-slate-200 rounded animate-pulse w-8"
          style={{ animationDelay: `${index * 30 + 240}ms` }}
        />
      </div>
    </td>
    {/* Status */}
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-center">
        <div
          className="h-5 bg-slate-200 rounded-full animate-pulse w-16"
          style={{ animationDelay: `${index * 30 + 260}ms` }}
        />
      </div>
    </td>
    {/* Actions */}
    <td className="border-b border-slate-200 p-1">
      <div className="flex justify-center gap-1">
        <div
          className="h-6 w-6 bg-slate-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 30 + 280}ms` }}
        />
        <div
          className="h-6 w-6 bg-slate-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 30 + 300}ms` }}
        />
      </div>
    </td>
  </tr>
);

// Skeleton Header Stats
const SkeletonHeaderStats = () => (
  <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
      <div
        className="w-16 h-4 bg-slate-200 rounded animate-pulse"
        style={{ animationDelay: "50ms" }}
      />
    </div>
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-4 bg-slate-200 rounded animate-pulse"
        style={{ animationDelay: "100ms" }}
      />
    </div>
  </div>
);

const InventoryTable = ({
  items = [],
  onView,
  onEdit,
  onDelete,
  onAdjust,
  isLoading = false,
  isSearching = false,
  showBranchColumn = false,
  canAdjustStock = true,
  catalogLinkStatus = {},
  catalogStatusLoading = false,
}) => {
  const tableContainerRef = useRef(null);
  const tableBodyRef = useRef(null);
  const headerRef = useRef(null);
  const rowRefs = useRef([]);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollInfo, setScrollInfo] = useState({
    canScrollUp: false,
    canScrollDown: false,
    currentTopRow: 1,
    currentBottomRow: 1,
  });

  // Use dynamic row count hook
  const visibleRows = useDynamicRowCount();
  const rowHeight = 36;
  const viewportHeight = visibleRows * rowHeight;

  // Define column widths
  const columnWidths = showBranchColumn
    ? {
        rowNum: "3%",
        itemName: "13%",
        category: "7%",
        catalogStatus: "8%",
        manufacturer: "8%",
        batch: "6%",
        expiry: "6%",
        branch: "7%",
        supplier: "9%",
        qty: "5%",
        mrp: "6%",
        rack: "4%",
        status: "7%",
        actions: "7%",
      }
    : {
        rowNum: "3%",
        itemName: "16%",
        category: "9%",
        catalogStatus: "9%",
        manufacturer: "9%",
        batch: "7%",
        expiry: "6%",
        supplier: "11%",
        qty: "6%",
        mrp: "7%",
        rack: "5%",
        status: "7%",
        actions: "5%",
      };

  // Pagination logic
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / visibleRows);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, currentPage, totalPages]);

  // Reset to page 1 when items change significantly
  useEffect(() => {
    setCurrentPage(1);
  }, [showBranchColumn]);

  const startIndex = (currentPage - 1) * visibleRows;
  const paginatedItems = items.slice(startIndex, startIndex + visibleRows);

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, paginatedItems.length);
    while (rowRefs.current.length < paginatedItems.length) {
      rowRefs.current.push(null);
    }
  }, [paginatedItems.length]);

  // Calculate scrollbar width
  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;

    const width = container.offsetWidth - container.clientWidth;
    setScrollbarWidth(width);
  }, [paginatedItems.length, visibleRows]);

  const updateScrollInfo = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 5;

    const topRowIndex = Math.floor(scrollTop / rowHeight);
    const bottomRowIndex = Math.min(
      topRowIndex + visibleRows - 1,
      paginatedItems.length - 1
    );

    setScrollInfo({
      canScrollUp,
      canScrollDown,
      currentTopRow: topRowIndex + 1,
      currentBottomRow: bottomRowIndex + 1,
    });
  }, [rowHeight, visibleRows, paginatedItems.length]);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.addEventListener("scroll", updateScrollInfo);
    updateScrollInfo();
    return () => container.removeEventListener("scroll", updateScrollInfo);
  }, [updateScrollInfo]);

  const scrollToTop = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, []);

  const lowStockItems = items.filter(
    (item) => item.status === "Low Stock"
  ).length;
  const outOfStockItems = items.filter(
    (item) => item.status === "Out of Stock"
  ).length;
  const expiredItems = items.filter(
    (item) => item.status === "Expired"
  ).length;
  const hasOverflow = paginatedItems.length > visibleRows;

  // ✅ FIX 2: Extract branch_name STRING before deduplicating
  const uniqueBranches = showBranchColumn
    ? [
        ...new Set(
          items
            .map((item) => {
              // Handle object format {branch_id, branch_name}
              if (item.branch && typeof item.branch === "object") {
                return item.branch.branch_name || "";
              }
              // Handle string format
              return item.branch_name || item.branch || "";
            })
            .filter(Boolean)
            .filter((b) => b !== "-" && b.trim() !== "")
        ),
      ]
    : [];

  return (
    <div
      className="h-full w-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden"
      ref={tableContainerRef}
    >
      {/* Table Header Stats */}
      {isLoading ? (
        <SkeletonHeaderStats />
      ) : (
        <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Package size={12} className="text-indigo-500" />
              <span className="text-[8px] text-slate-500 uppercase tracking-wide font-medium">
                Total:
              </span>
              <span className="text-[10px] font-bold text-indigo-600">
                {totalItems}
              </span>
            </div>

            {/* Searching indicator */}
            {isSearching && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded border border-indigo-200">
                  <Loader2
                    size={10}
                    className="animate-spin text-indigo-500"
                  />
                  <span className="text-[8px] text-indigo-600 font-medium">
                    Searching...
                  </span>
                </div>
              </>
            )}

            {/* Global mode indicator */}
            {!isSearching &&
              showBranchColumn &&
              uniqueBranches.length > 0 && (
                <>
                  <div className="h-3 w-px bg-slate-300" />
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200 text-[8px]">
                    <Layers size={10} className="text-blue-500" />
                    <span className="text-blue-700 font-medium">
                      {uniqueBranches.length} branches
                    </span>
                  </div>
                </>
              )}

            {!isSearching && lowStockItems > 0 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 rounded border border-yellow-300 text-[8px]">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-700 font-medium">
                    {lowStockItems} low stock
                  </span>
                </div>
              </>
            )}

            {!isSearching && outOfStockItems > 0 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 rounded border border-red-300 text-[8px]">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">
                    {outOfStockItems} out of stock
                  </span>
                </div>
              </>
            )}

            {!isSearching && expiredItems > 0 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-[8px]">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">
                    {expiredItems} expired
                  </span>
                </div>
              </>
            )}

            {totalPages > 1 && !isSearching && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[8px]">
                  <span className="text-slate-500">Page</span>
                  <span className="font-bold text-slate-700">
                    {currentPage}/{totalPages}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Adjustment mode indicator */}
            {!canAdjustStock && !isSearching && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200 text-[8px] mr-2">
                <span className="text-amber-700 font-medium">
                  Read-only mode
                </span>
              </div>
            )}

            {hasOverflow && !isSearching && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={scrollToTop}
                  disabled={!scrollInfo.canScrollUp}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Scroll to top"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={scrollToBottom}
                  disabled={!scrollInfo.canScrollDown}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Scroll to bottom"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header with scrollbar compensation */}
        <div
          ref={headerRef}
          className="shrink-0 overflow-hidden border-b-2 border-slate-300"
          style={{ paddingRight: `${scrollbarWidth}px` }}
        >
          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: columnWidths.rowNum }} />
              <col style={{ width: columnWidths.itemName }} />
              <col style={{ width: columnWidths.category }} />
              <col style={{ width: columnWidths.catalogStatus }} />
              <col style={{ width: columnWidths.manufacturer }} />
              <col style={{ width: columnWidths.batch }} />
              <col style={{ width: columnWidths.expiry }} />
              {showBranchColumn && (
                <col style={{ width: columnWidths.branch }} />
              )}
              <col style={{ width: columnWidths.supplier }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.status }} />
              <col style={{ width: columnWidths.actions }} />
            </colgroup>
            <thead>
              {/* Group Header Row */}
              <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-5">
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-slate-800/20"></th>
                <th
                  colSpan="4"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-blue-900/30"
                >
                  Product Details
                </th>
                <th
                  colSpan="2"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-cyan-900/30"
                >
                  Batch Info
                </th>
                {showBranchColumn && (
                  <th className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-indigo-900/30">
                    Location
                  </th>
                )}
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-purple-900/30">
                  Supplier
                </th>
                <th
                  colSpan="3"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-emerald-900/30"
                >
                  Stock Details
                </th>
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-orange-900/30">
                  Status
                </th>
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center bg-slate-800/20"></th>
              </tr>

              {/* Individual Column Headers */}
              <tr className="bg-gradient-to-r from-[#070170] to-[#0c03a0] text-white h-6">
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  #
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left pl-1 border-r border-slate-600/30">
                  Item Name
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">
                  Category
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  <div className="flex items-center justify-center gap-1">
                    <Link2 size={9} />
                    <span>Catalog</span>
                  </div>
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">
                  Manufacturer
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Batch
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Expiry
                </th>
                {showBranchColumn && (
                  <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                    <div className="flex items-center justify-center gap-1">
                      <Building2 size={9} />
                      <span>Branch</span>
                    </div>
                  </th>
                )}
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Supplier
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Qty
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">
                  MRP
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Rack
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Status
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center">
                  Actions
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Body */}
        <div
          ref={tableBodyRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            height: `${viewportHeight}px`,
            maxHeight: `${viewportHeight}px`,
          }}
        >
          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: columnWidths.rowNum }} />
              <col style={{ width: columnWidths.itemName }} />
              <col style={{ width: columnWidths.category }} />
              <col style={{ width: columnWidths.catalogStatus }} />
              <col style={{ width: columnWidths.manufacturer }} />
              <col style={{ width: columnWidths.batch }} />
              <col style={{ width: columnWidths.expiry }} />
              {showBranchColumn && (
                <col style={{ width: columnWidths.branch }} />
              )}
              <col style={{ width: columnWidths.supplier }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.status }} />
              <col style={{ width: columnWidths.actions }} />
            </colgroup>
            <tbody>
              {isLoading
                ? // Skeleton loading rows
                  Array.from({ length: visibleRows }).map((_, index) => (
                    <SkeletonRow
                      key={`skeleton-${index}`}
                      rowHeight={rowHeight}
                      isEven={index % 2 === 0}
                      index={index}
                      showBranchColumn={showBranchColumn}
                    />
                  ))
                : paginatedItems.map((item, index) => (
                    <InventoryRowFixed
                      key={item.id || item.inventory_id || index}
                      ref={(el) => (rowRefs.current[index] = el)}
                      index={index}
                      item={item}
                      rowNumber={startIndex + index + 1}
                      isEven={index % 2 === 0}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAdjust={onAdjust}
                      rowHeight={rowHeight}
                      showBranchColumn={showBranchColumn}
                      canAdjustStock={canAdjustStock}
                      catalogStatus={
                        catalogLinkStatus[item.medicine_id]?.status ||
                        "NOT_LINKED"
                      }
                      catalogConfidence={
                        catalogLinkStatus[item.medicine_id]?.confidence || 0
                      }
                      catalogStatusLoading={catalogStatusLoading}
                    />
                  ))}
            </tbody>
          </table>

          {!isLoading && items.length === 0 && (
            <div
              className="flex flex-col items-center justify-center text-slate-400"
              style={{ height: `${viewportHeight}px` }}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Package size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No inventory items found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {showBranchColumn
                  ? "No items found across all branches"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          )}
        </div>

        {hasOverflow && !isLoading && (
          <div className="shrink-0 h-0.5 bg-slate-100 relative" />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 0 && (
        <div className="shrink-0 border-t border-slate-200">
          <InventoryPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            rowsPerPage={visibleRows}
          />
        </div>
      )}
    </div>
  );
};

export default InventoryTable;