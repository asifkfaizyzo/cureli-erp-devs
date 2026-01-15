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
  rowHeight = 36,
  onAddNewProduct, // ✅ NEW: Handler for adding new products
}) => {
  const tableContainerRef = useRef(null);
  const tableBodyRef = useRef(null);
  const headerRef = useRef(null);
  const rowRefs = useRef([]);
  const [focusQueue, setFocusQueue] = useState(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [scrollInfo, setScrollInfo] = useState({ 
    canScrollUp: false, 
    canScrollDown: false,
    currentTopRow: 1,
    currentBottomRow: visibleRows,
  });

  const viewportHeight = visibleRows * rowHeight;

  // Define column widths - MUST match between header and body
  const columnWidths = {
    rowNum: '2.5%',
    itemDesc: '14%',
    mfac: '7%',
    batch: '5%',
    hsn: '5%',
    exp: '5%',
    pack: '4%',
    pQty: '4%',
    qty: '4%',
    rate: '6%',
    dis: '4%',
    netRate: '5.5%',
    amount: '7%',
    sgst: '4%',
    mrp: '5%',
    rack: '3.5%',
    sRate: '5.5%',
    free: '4%',
  };

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, rows.length);
    while (rowRefs.current.length < rows.length) {
      rowRefs.current.push(null);
    }
  }, [rows.length]);

  // Calculate scrollbar width
  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    
    const width = container.offsetWidth - container.clientWidth;
    setScrollbarWidth(width);
  }, [rows.length, visibleRows]);

  const updateScrollInfo = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 5;
    
    const topRowIndex = Math.floor(scrollTop / rowHeight);
    const bottomRowIndex = Math.min(topRowIndex + visibleRows - 1, rows.length - 1);

    setScrollInfo({
      canScrollUp,
      canScrollDown,
      currentTopRow: topRowIndex + 1,
      currentBottomRow: bottomRowIndex + 1,
    });
  }, [rowHeight, visibleRows, rows.length]);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.addEventListener('scroll', updateScrollInfo);
    updateScrollInfo();
    return () => container.removeEventListener('scroll', updateScrollInfo);
  }, [updateScrollInfo]);

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

  const scrollToRow = useCallback((rowIndex) => {
    const container = tableBodyRef.current;
    if (!container) return;

    const rowTop = rowIndex * rowHeight;
    const rowBottom = rowTop + rowHeight;
    const viewportTop = container.scrollTop;
    const viewportBottom = viewportTop + viewportHeight;

    if (rowBottom > viewportBottom) {
      container.scrollTo({ top: rowBottom - viewportHeight, behavior: 'smooth' });
    } else if (rowTop < viewportTop) {
      container.scrollTo({ top: rowTop, behavior: 'smooth' });
    }
  }, [rowHeight, viewportHeight]);

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

  const handleCreateNewRow = useCallback(() => {
    const newRow = {
      mfac: "", rack: "", name: "", hsn: "", pack: "", batch: "", exp: "",
      qty: "", sch: "", mrp: "", price: "", schemePercent: "", schemeAmount: "",
      discountPercent: "", discountAmount: "", taxableValue: "", cgstPercent: "9",
      cgstAmount: "", sgstPercent: "9", sgstAmount: "", amount: "", sRate: "",
      pQty: "", netRate: "",
    };
    
    setRows(prev => [...prev, newRow]);
    setFocusQueue({ rowIndex: rows.length, fieldKey: null });
  }, [rows.length, setRows]);

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

  const handleRowChange = useCallback((idx, key, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[idx] = { ...newRows[idx], [key]: value };
      newRows[idx] = calculateRow(newRows[idx]);
      return newRows;
    });
  }, [setRows, calculateRow]);

  const handleProductSelect = useCallback((idx, product) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[idx] = {
        ...newRows[idx],
        name: product.name,
        hsn: product.hsnCode || product.hsn || newRows[idx].hsn,
        pack: product.pack || newRows[idx].pack,
        rack: product.rackNo || product.rack || newRows[idx].rack,
        mfac: product.manufacturer || product.mfac || newRows[idx].mfac,
        cgstPercent: product.gst ? (Number(product.gst) / 2).toString() : (product.cgstPercent || newRows[idx].cgstPercent),
        sgstPercent: product.gst ? (Number(product.gst) / 2).toString() : (product.sgstPercent || newRows[idx].sgstPercent),
      };
      newRows[idx] = calculateRow(newRows[idx]);
      return newRows;
    });
  }, [setRows, calculateRow]);

  const handleAddMultipleRows = useCallback((count = 5) => {
    const newRows = Array.from({ length: count }).map(() => ({
      mfac: "", rack: "", name: "", hsn: "", pack: "", batch: "", exp: "",
      qty: "", sch: "", mrp: "", price: "", schemePercent: "", schemeAmount: "",
      discountPercent: "", discountAmount: "", taxableValue: "", cgstPercent: "9",
      cgstAmount: "", sgstPercent: "9", sgstAmount: "", amount: "", sRate: "",
      pQty: "", netRate: "",
    }));
    
    setRows(prev => [...prev, ...newRows]);
    setFocusQueue({ rowIndex: rows.length, fieldKey: null });
  }, [rows.length, setRows]);

  const filledRows = rows.filter(r => r.name).length;
  const totalRows = rows.length;
  const hasOverflow = totalRows > visibleRows;
  const newProductsCount = rows.filter(row => {
    if (!row.name || !row.name.trim()) return false;
    return !productMaster.some(product => 
      product.name.toLowerCase() === row.name.toLowerCase() ||
      product.name.toLowerCase().includes(row.name.toLowerCase()) ||
      row.name.toLowerCase().includes(product.name.toLowerCase())
    );
  }).length;

  return (
    <div className="h-full w-full flex flex-col bg-white" ref={tableContainerRef}>
      {/* Table Header Stats */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-slate-500 uppercase tracking-wide font-medium">Items:</span>
            <span className="text-[10px] font-bold text-indigo-600">{filledRows}</span>
            <span className="text-[8px] text-slate-400">/ {totalRows}</span>
          </div>

          {/* ✅ NEW: Show new products indicator */}
          {newProductsCount > 0 && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 rounded border border-yellow-300 text-[8px]">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-700 font-medium">{newProductsCount} new</span>
              </div>
            </>
          )}
          
          {hasOverflow && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[8px]">
                <span className="text-slate-500">Showing</span>
                <span className="font-bold text-slate-700">
                  {scrollInfo.currentTopRow}-{scrollInfo.currentBottomRow}
                </span>
              </div>
            </>
          )}
          
          <div className="h-3 w-px bg-slate-300" />
          <div className="hidden lg:flex text-[7px] text-slate-400 items-center gap-1">
            <kbd className="px-0.5 py-0.5 bg-white border border-slate-200 rounded font-mono">⏎</kbd>
            <span>Next</span>
            <kbd className="px-0.5 py-0.5 bg-white border border-slate-200 rounded font-mono">Tab</kbd>
            <span>Navigate</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {hasOverflow && (
            <div className="flex items-center gap-0.5 mr-1">
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
          
          <button
            onClick={() => handleAddMultipleRows(5)}
            className="px-1 py-0.5 text-[8px] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded flex items-center gap-0.5"
          >
            <Plus size={8} />
            +5
          </button>
          <button
            onClick={handleCreateNewRow}
            className="px-1.5 py-0.5 text-[8px] bg-indigo-500 text-white hover:bg-indigo-600 rounded flex items-center gap-0.5 font-medium shadow-sm"
          >
            <Plus size={8} />
            Add
          </button>
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
              <col style={{ width: columnWidths.itemDesc }} />
              <col style={{ width: columnWidths.mfac }} />
              <col style={{ width: columnWidths.batch }} />
              <col style={{ width: columnWidths.hsn }} />
              <col style={{ width: columnWidths.exp }} />
              <col style={{ width: columnWidths.pack }} />
              <col style={{ width: columnWidths.pQty }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.rate }} />
              <col style={{ width: columnWidths.dis }} />
              <col style={{ width: columnWidths.netRate }} />
              <col style={{ width: columnWidths.amount }} />
              <col style={{ width: columnWidths.sgst }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.sRate }} />
              <col style={{ width: columnWidths.free }} />
            </colgroup>
            <thead>
              {/* Group Header Row */}
              <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-5">
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-slate-800/20"></th>
                <th colSpan="3" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-blue-900/30">Product Info</th>
                <th colSpan="2" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-cyan-900/30">Identity</th>
                <th colSpan="3" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-amber-900/30">Quantity</th>
                <th colSpan="4" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-emerald-900/30">Pricing</th>
                <th colSpan="2" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-orange-900/30">Tax</th>
                <th colSpan="2" className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-purple-900/30">Output</th>
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center bg-green-900/30"></th>
              </tr>
              
              {/* Individual Column Headers */}
              <tr className="bg-gradient-to-r from-[#070170] to-[#0c03a0] text-white h-6">
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">#</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left pl-1 border-r border-slate-600/30">Item Desc</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">Mfac</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Batch</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">HSN</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Exp</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Pack</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">P.Qty</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Qty</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">Rate</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Dis%</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">NetRate</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">Amount</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">SGST</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">MRP</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">Rack</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">SRate</th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center">Free</th>
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
              <col style={{ width: columnWidths.itemDesc }} />
              <col style={{ width: columnWidths.mfac }} />
              <col style={{ width: columnWidths.batch }} />
              <col style={{ width: columnWidths.hsn }} />
              <col style={{ width: columnWidths.exp }} />
              <col style={{ width: columnWidths.pack }} />
              <col style={{ width: columnWidths.pQty }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.rate }} />
              <col style={{ width: columnWidths.dis }} />
              <col style={{ width: columnWidths.netRate }} />
              <col style={{ width: columnWidths.amount }} />
              <col style={{ width: columnWidths.sgst }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.sRate }} />
              <col style={{ width: columnWidths.free }} />
            </colgroup>
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
                  onAddNewProduct={onAddNewProduct} // ✅ NEW: Pass handler
                />
              ))}
            </tbody>
          </table>
          
          {rows.length === 0 && (
            <div 
              className="flex flex-col items-center justify-center text-slate-400"
              style={{ height: `${viewportHeight}px` }}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Plus size={16} className="text-slate-400" />
              </div>
              <p className="text-xs font-medium">No items added</p>
              <p className="text-[9px]">Press Enter to add items</p>
            </div>
          )}
        </div>

        {hasOverflow && (
          <div className="shrink-0 h-0.5 bg-slate-100 relative" />
        )}
      </div>
      
      {/* Footer */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-3 py-0.5 flex items-center justify-between text-[8px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>{totalRows} rows</span>
          {filledRows > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-medium">{filledRows} items</span>
            </>
          )}
          {newProductsCount > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-yellow-600 font-medium">{newProductsCount} new products</span>
            </>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[7px]">
          <kbd className="px-0.5 py-0.5 bg-white border border-slate-200 rounded font-mono">Ctrl+BackSpace ⌫</kbd>
          <span>Delete row</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseTable;

 