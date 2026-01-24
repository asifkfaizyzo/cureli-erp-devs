// src/pages/inventory/components/InventoryTable.jsx
import React, { useRef, useCallback, useEffect, useState } from "react";
import InventoryRowFixed from "./InventoryRowFixed";
import InventoryPagination from "../../../components/common/Pagination";
import { ChevronUp, ChevronDown, Package } from "lucide-react";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";

const InventoryTable = ({ 
  items = [],
  onView,
  onEdit,
  onDelete,
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

  // Define column widths - MUST match between header and body
  const columnWidths = {
    rowNum: '3%',
    itemName: '18%',
    category: '10%',
    manufacturer: '10%',
    batch: '8%',
    expiry: '7%',
    supplier: '12%',
    qty: '6%',
    mrp: '7%',
    rack: '5%',
    status: '8%',
    actions: '6%',
  };

  // Pagination logic
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / visibleRows);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, currentPage, totalPages]);

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
    const bottomRowIndex = Math.min(topRowIndex + visibleRows - 1, paginatedItems.length - 1);

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
    container.addEventListener('scroll', updateScrollInfo);
    updateScrollInfo();
    return () => container.removeEventListener('scroll', updateScrollInfo);
  }, [updateScrollInfo]);

  const scrollToTop = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, []);

  const lowStockItems = items.filter(item => item.status === "Low Stock").length;
  const outOfStockItems = items.filter(item => item.status === "Out of Stock").length;
  const hasOverflow = paginatedItems.length > visibleRows;

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden" ref={tableContainerRef}>
      {/* Table Header Stats */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Package size={12} className="text-indigo-500" />
            <span className="text-[8px] text-slate-500 uppercase tracking-wide font-medium">Total:</span>
            <span className="text-[10px] font-bold text-indigo-600">{totalItems}</span>
          </div>

          {lowStockItems > 0 && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 rounded border border-yellow-300 text-[8px]">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-700 font-medium">{lowStockItems} low stock</span>
              </div>
            </>
          )}

          {outOfStockItems > 0 && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 rounded border border-red-300 text-[8px]">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium">{outOfStockItems} out of stock</span>
              </div>
            </>
          )}
          
          {totalPages > 1 && (
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
          {hasOverflow && (
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

      {/* Table Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header with scrollbar compensation */}
        <div 
          ref={headerRef}
          className="shrink-0 overflow-hidden border-b-2 border-slate-300"
          style={{ paddingRight: `${scrollbarWidth}px` }}
        >
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: columnWidths.rowNum }} />
              <col style={{ width: columnWidths.itemName }} />
              <col style={{ width: columnWidths.category }} />
              <col style={{ width: columnWidths.manufacturer }} />
              <col style={{ width: columnWidths.batch }} />
              <col style={{ width: columnWidths.expiry }} />
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
                <th colSpan="3" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-blue-900/30">Product Details</th>
                <th colSpan="2" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-cyan-900/30">Batch Info</th>
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-purple-900/30">Supplier</th>
                <th colSpan="3" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-emerald-900/30">Stock Details</th>
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-orange-900/30">Status</th>
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center bg-slate-800/20"></th>
              </tr>
              
              {/* Individual Column Headers */}
              <tr className="bg-gradient-to-r from-[#070170] to-[#0c03a0] text-white h-6">
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">#</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left pl-1 border-r border-slate-600/30">Item Name</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">Category</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">Manufacturer</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Batch</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Expiry</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">Supplier</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Qty</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">MRP</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Rack</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Status</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center">Actions</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Body */}
        <div 
          ref={tableBodyRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }}
        >
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: columnWidths.rowNum }} />
              <col style={{ width: columnWidths.itemName }} />
              <col style={{ width: columnWidths.category }} />
              <col style={{ width: columnWidths.manufacturer }} />
              <col style={{ width: columnWidths.batch }} />
              <col style={{ width: columnWidths.expiry }} />
              <col style={{ width: columnWidths.supplier }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.status }} />
              <col style={{ width: columnWidths.actions }} />
            </colgroup>
            <tbody>
              {paginatedItems.map((item, index) => (
                <InventoryRowFixed
                  key={item.id || index}
                  ref={el => rowRefs.current[index] = el}
                  index={index}
                  item={item}
                  rowNumber={startIndex + index + 1}
                  isEven={index % 2 === 0}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  rowHeight={rowHeight}
                />
              ))}
            </tbody>
          </table>
          
          {items.length === 0 && (
            <div 
              className="flex flex-col items-center justify-center text-slate-400"
              style={{ height: `${viewportHeight}px` }}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Package size={16} className="text-slate-400" />
              </div>
              <p className="text-xs font-medium">No inventory items found</p>
              <p className="text-[9px]">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {hasOverflow && (
          <div className="shrink-0 h-0.5 bg-slate-100 relative" />
        )}
      </div>
      
      {/* Pagination as Footer */}
      {totalPages > 0 && (
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