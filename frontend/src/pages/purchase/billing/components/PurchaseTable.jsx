// src/pages/purchase/billing/components/PurchaseTable.jsx
import React, { useRef, useCallback, useEffect, useState } from "react";
import PurchaseRowFixed from "./PurchaseRowFixed";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";

const PurchaseTable = ({ 
  rows, 
  setRows, 
  productMaster = [], 
  calculateRow, 
  importVersion,
  visibleRows = 8,
  rowHeight = 40,
}) => {
  const tableContainerRef = useRef(null);
  const tableBodyRef = useRef(null);
  const rowRefs = useRef([]);
  const [focusQueue, setFocusQueue] = useState(null);
  const [scrollInfo, setScrollInfo] = useState({ 
    canScrollUp: false, 
    canScrollDown: false,
    currentTopRow: 1,
    currentBottomRow: visibleRows,
  });

  // Calculate fixed viewport height
  const viewportHeight = visibleRows * rowHeight;

  // Ensure rowRefs array matches rows length
  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, rows.length);
    while (rowRefs.current.length < rows.length) {
      rowRefs.current.push(null);
    }
  }, [rows.length]);

  // Update scroll info
  const updateScrollInfo = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 5;
    
    const topRowIndex = Math.floor(scrollTop / rowHeight);
    const bottomRowIndex = Math.min(
      topRowIndex + visibleRows - 1,
      rows.length - 1
    );

    setScrollInfo({
      canScrollUp,
      canScrollDown,
      currentTopRow: topRowIndex + 1,
      currentBottomRow: bottomRowIndex + 1,
    });
  }, [rowHeight, visibleRows, rows.length]);

  // Handle scroll events
  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;

    container.addEventListener('scroll', updateScrollInfo);
    updateScrollInfo();

    return () => container.removeEventListener('scroll', updateScrollInfo);
  }, [updateScrollInfo]);

  // Handle focus queue
  useEffect(() => {
    if (focusQueue !== null) {
      const timer = setTimeout(() => {
        const targetRow = rowRefs.current[focusQueue.rowIndex];
        if (targetRow) {
          scrollToRow(focusQueue.rowIndex);
          setTimeout(() => {
            if (focusQueue.fieldKey) {
              targetRow.focusField(focusQueue.fieldKey);
            } else {
              targetRow.focusFirstField();
            }
          }, 100);
        }
        setFocusQueue(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [focusQueue]);

  // Scroll to specific row
  const scrollToRow = useCallback((rowIndex) => {
    const container = tableBodyRef.current;
    if (!container) return;

    const rowTop = rowIndex * rowHeight;
    const rowBottom = rowTop + rowHeight;
    const viewportTop = container.scrollTop;
    const viewportBottom = viewportTop + viewportHeight;

    if (rowBottom > viewportBottom) {
      container.scrollTo({
        top: rowBottom - viewportHeight,
        behavior: 'smooth'
      });
    } else if (rowTop < viewportTop) {
      container.scrollTo({
        top: rowTop,
        behavior: 'smooth'
      });
    }
  }, [rowHeight, viewportHeight]);

  // Scroll controls
  const scrollUp = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.scrollBy({ top: -rowHeight * 3, behavior: 'smooth' });
  }, [rowHeight]);

  const scrollDown = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.scrollBy({ top: rowHeight * 3, behavior: 'smooth' });
  }, [rowHeight]);

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

  // Navigate to next row
  const handleNavigateToNextRow = useCallback((currentIndex, fieldKey = null) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < rows.length) {
      scrollToRow(nextIndex);
      setTimeout(() => {
        const nextRow = rowRefs.current[nextIndex];
        if (nextRow) {
          if (fieldKey) {
            nextRow.focusField(fieldKey);
          } else {
            nextRow.focusFirstField();
          }
        }
      }, 100);
    }
  }, [rows.length, scrollToRow]);

  // Navigate to previous row
  const handleNavigateToPrevRow = useCallback((currentIndex, fieldKey = null) => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      scrollToRow(prevIndex);
      setTimeout(() => {
        const prevRow = rowRefs.current[prevIndex];
        if (prevRow) {
          if (fieldKey) {
            prevRow.focusField(fieldKey);
          } else {
            prevRow.focusLastField();
          }
        }
      }, 100);
    }
  }, [scrollToRow]);

  // Create new row
  const handleCreateNewRow = useCallback(() => {
    const newRow = {
      mfac: "", rack: "", name: "", hsn: "", pack: "", batch: "", exp: "",
      qty: "", sch: "", mrp: "", price: "", schemePercent: "", schemeAmount: "",
      discountPercent: "", discountAmount: "", taxableValue: "", cgstPercent: "9",
      cgstAmount: "", sgstPercent: "9", sgstAmount: "", amount: "", sRate: "",
    };
    
    setRows(prev => [...prev, newRow]);
    setFocusQueue({ rowIndex: rows.length, fieldKey: null });
  }, [rows.length, setRows]);

  // Remove row handler
  const handleRemoveRow = useCallback((index) => {
    if (rows.length <= 1) return;
    
    setRows(prev => {
      const newRows = [...prev];
      newRows.splice(index, 1);
      return newRows;
    });
    
    const focusIndex = Math.max(0, index - 1);
    setTimeout(() => {
      const targetRow = rowRefs.current[focusIndex];
      if (targetRow) {
        targetRow.focusFirstField();
      }
    }, 50);
  }, [rows.length, setRows]);

  // Handle row change
  const handleRowChange = useCallback((idx, key, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[idx] = { ...newRows[idx], [key]: value };
      newRows[idx] = calculateRow(newRows[idx]);
      return newRows;
    });
  }, [setRows, calculateRow]);

  // Handle product selection
  const handleProductSelect = useCallback((idx, product) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[idx] = {
        ...newRows[idx],
        name: product.name,
        hsn: product.hsn || newRows[idx].hsn,
        pack: product.pack || newRows[idx].pack,
        rack: product.rack || newRows[idx].rack,
        mfac: product.mfac || newRows[idx].mfac,
        cgstPercent: product.cgstPercent || newRows[idx].cgstPercent,
        sgstPercent: product.sgstPercent || newRows[idx].sgstPercent,
      };
      newRows[idx] = calculateRow(newRows[idx]);
      return newRows;
    });
  }, [setRows, calculateRow]);

  // Add multiple rows
  const handleAddMultipleRows = useCallback((count = 5) => {
    const newRows = Array.from({ length: count }).map(() => ({
      mfac: "", rack: "", name: "", hsn: "", pack: "", batch: "", exp: "",
      qty: "", sch: "", mrp: "", price: "", schemePercent: "", schemeAmount: "",
      discountPercent: "", discountAmount: "", taxableValue: "", cgstPercent: "9",
      cgstAmount: "", sgstPercent: "9", sgstAmount: "", amount: "", sRate: "",
    }));
    
    setRows(prev => [...prev, ...newRows]);
    setFocusQueue({ rowIndex: rows.length, fieldKey: null });
  }, [rows.length, setRows]);

  // Calculate stats
  const filledRows = rows.filter(r => r.name).length;
  const totalRows = rows.length;
  const hasOverflow = totalRows > visibleRows;

  return (
    <div className="h-full w-full flex flex-col bg-white" ref={tableContainerRef}>
      {/* Table Header Stats */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Row Count */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-500 uppercase tracking-wide font-medium">Items:</span>
            <span className="text-[11px] font-bold text-indigo-600">{filledRows}</span>
            <span className="text-[9px] text-slate-400">/ {totalRows}</span>
          </div>
          
          {/* Visible Range Indicator */}
          {hasOverflow && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[9px]">
                <span className="text-slate-500">Showing</span>
                <span className="font-bold text-slate-700">
                  {scrollInfo.currentTopRow}-{scrollInfo.currentBottomRow}
                </span>
              </div>
            </>
          )}
          
          <div className="h-3 w-px bg-slate-300" />
          
          {/* Keyboard Hints - Hide on smaller screens */}
          <div className="hidden lg:flex text-[8px] text-slate-400 items-center gap-1.5">
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">⏎</kbd>
            <span>Next</span>
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">Tab</kbd>
            <span>Navigate</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {hasOverflow && (
            <div className="flex items-center gap-0.5 mr-1">
              <button
                onClick={scrollToTop}
                disabled={!scrollInfo.canScrollUp}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Scroll to top"
              >
                <ChevronUp size={12} />
              </button>
              <button
                onClick={scrollToBottom}
                disabled={!scrollInfo.canScrollDown}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Scroll to bottom"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          )}
          
          <button
            onClick={() => handleAddMultipleRows(5)}
            className="px-1.5 py-0.5 text-[9px] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors flex items-center gap-0.5"
          >
            <Plus size={10} />
            +5
          </button>
          <button
            onClick={handleCreateNewRow}
            className="px-2 py-0.5 text-[9px] bg-indigo-500 text-white hover:bg-indigo-600 rounded transition-colors flex items-center gap-0.5 font-medium shadow-sm"
          >
            <Plus size={10} />
            Add
          </button>
        </div>
      </div>

      {/* ✅ Table Container - NO HORIZONTAL SCROLL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="shrink-0 overflow-hidden">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-8">
                {/* Column widths - percentages for flexibility */}
                <th className="w-[3%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">#</th>
                <th className="w-[18%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">Item Description</th>
                <th className="w-[6%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">HSN</th>
                <th className="w-[6%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">Batch</th>
                <th className="w-[8%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">Company</th>
                <th className="w-[4%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">Rack</th>
                <th className="w-[5%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">Exp</th>
                <th className="w-[4%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">Pack</th>
                <th className="w-[5%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">Qty</th>
                <th className="w-[6%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-right pr-2 border-r border-slate-600/30">Rate</th>
                <th className="w-[5%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">Disc%</th>
                <th className="w-[5%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">Sch%</th>
                <th className="w-[6%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-right pr-2 border-r border-slate-600/30 ">S-Rate</th>
                <th className="w-[8%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-right pr-2 border-r border-slate-600/30">Amount</th>
                <th className="w-[5%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-right pr-2 border-r border-slate-600/30">MRP</th>
                <th className="w-[4%] px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center">Free</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* ✅ Scrollable Body - ONLY VERTICAL SCROLL */}
        <div 
          ref={tableBodyRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ 
            height: `${viewportHeight}px`,
            maxHeight: `${viewportHeight}px`,
          }}
        >
          <table className="w-full border-collapse table-fixed">
            <tbody>
              {rows.map((item, index) => (
                <PurchaseRowFixed
                  key={`row-${index}-${importVersion}`}
                  ref={el => rowRefs.current[index] = el}
                  index={index}
                  item={item}
                  onChange={handleRowChange}
                  onProductSelect={handleProductSelect}
                  productMaster={productMaster}
                  rowNumber={index + 1}
                  isEven={index % 2 === 0}
                  isLast={index === rows.length - 1}
                  onRemoveRow={handleRemoveRow}
                  rowsLength={rows.length}
                  onNavigateToNextRow={handleNavigateToNextRow}
                  onNavigateToPrevRow={handleNavigateToPrevRow}
                  onCreateNewRow={handleCreateNewRow}
                  rowHeight={rowHeight}
                />
              ))}
            </tbody>
          </table>
          
          {/* Empty State */}
          {rows.length === 0 && (
            <div 
              className="flex flex-col items-center justify-center text-slate-400"
              style={{ height: `${viewportHeight}px` }}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Plus size={20} className="text-slate-400" />
              </div>
              <p className="text-xs font-medium">No items added</p>
              <p className="text-[10px]">Press Enter to add items</p>
            </div>
          )}
        </div>

        {/* Scroll Indicator Bar */}
        {hasOverflow && (
          <div className="shrink-0 h-1 bg-slate-100 relative">
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[9px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>{totalRows} rows</span>
          {filledRows > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-medium">{filledRows} items</span>
            </>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[8px]">
          <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">⏎</kbd>
          <span>to add & scroll</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseTable;
