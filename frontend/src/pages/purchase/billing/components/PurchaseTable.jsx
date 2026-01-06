// src/components/purchase/PurchaseTable.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PurchaseRow from "./PurchaseRowFixed";

const FIELDS_COUNT = 13;
const ROW_HEIGHT = 36; // Height of each row in pixels
const HEADER_HEIGHT = 60; // Height of header (both rows)

const PurchaseTable = ({
  rows,
  setRows,
  productMaster,
  calculateRow,
}) => {
  const fieldRefs = useRef([]);
  const containerRef = useRef(null);
  const tbodyRef = useRef(null);

  // Dynamic max visible rows based on screen size
  const [maxVisibleRows, setMaxVisibleRows] = useState(9);

  // Update max visible rows based on screen width
  useEffect(() => {
    const updateMaxRows = () => {
      const width = window.innerWidth;
      let count = 4; // Default / Mobile

      if (width >= 2560) count = 17;       // 4k / 27 inch
      else if (width >= 1920) count = 13;  // 1080p Full HD
      else if (width >= 1440) count = 7;  // 19 inch / high res laptop
      else if (width >= 1366) count = 5;   // 14 inch laptop
      else count = 4;

      setMaxVisibleRows(count);
    };

    updateMaxRows();
    window.addEventListener("resize", updateMaxRows);
    return () => window.removeEventListener("resize", updateMaxRows);
  }, []);

  const stableProductMaster = useMemo(
    () => productMaster || [],
    [productMaster]
  );

  useEffect(() => {
    fieldRefs.current = fieldRefs.current.slice(0, rows.length);
  }, [rows.length]);

  // Auto-scroll to bottom when new rows with data are added
  useEffect(() => {
    if (containerRef.current && rows.length > maxVisibleRows) {
      const lastRowWithData = rows.findLastIndex(row => row.name);
      if (lastRowWithData >= maxVisibleRows - 1) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [rows, maxVisibleRows]);

  const focusNextField = useCallback((rowIndex, fieldIndex) => {
    const nextField = fieldIndex + 1;
    
    if (nextField >= FIELDS_COUNT) {
      if (rowIndex + 1 < fieldRefs.current.length) {
        requestAnimationFrame(() => {
          const el = fieldRefs.current?.[rowIndex + 1]?.[0];
          if (el?.focus) el.focus();
        });
      }
      return;
    }

    requestAnimationFrame(() => {
      const el = fieldRefs.current?.[rowIndex]?.[nextField];
      if (el?.focus) el.focus();
    });
  }, []);

  const focusPrevField = useCallback((rowIndex, fieldIndex) => {
    const prevField = fieldIndex - 1;
    
    if (prevField < 0) {
      if (rowIndex > 0) {
        requestAnimationFrame(() => {
          const el = fieldRefs.current?.[rowIndex - 1]?.[FIELDS_COUNT - 1];
          if (el?.focus) el.focus();
        });
      }
      return;
    }

    requestAnimationFrame(() => {
      const el = fieldRefs.current?.[rowIndex]?.[prevField];
      if (el?.focus) el.focus();
    });
  }, []);

  const handleRowChange = useCallback(
    (rowIndex, key, value) => {
      setRows((prev) => {
        const updated = [...prev];
        const row = { ...updated[rowIndex], [key]: value };
        updated[rowIndex] = calculateRow(row);
        return updated;
      });
    },
    [setRows, calculateRow]
  );

  const handleProductSelect = useCallback(
    (rowIndex, product) => {
      setRows((prev) => {
        const updated = [...prev];
        updated[rowIndex] = calculateRow({
          ...updated[rowIndex],
          name: product.name || "",
          hsn: product.hsn || "",
          pack: product.pack || "",
          rack: product.rack || "",
          cgstPercent: product.cgstPercent || "",
          sgstPercent: product.sgstPercent || "",
        });
        return updated;
      });
    },
    [setRows, calculateRow]
  );

  const getRegisterFieldRef = useCallback(
    (rowIndex) => (fieldIndex, el) => {
      if (!fieldRefs.current[rowIndex]) fieldRefs.current[rowIndex] = [];
      fieldRefs.current[rowIndex][fieldIndex] = el;
    },
    []
  );

  const headerColumns = [
    { label: "#", width: "w-[40px]", isSerial: true },
    { label: "Mfac", subLabel: "Rack", width: "w-[80px]" },
    { label: "Description of Goods", subLabel: "HSN/SAC", width: "min-w-[200px]" },
    { label: "Pack", width: "w-[60px]" },
    { label: "Batch No", subLabel: "Exp", width: "w-[100px]" },
    { label: "Qty", width: "w-[55px]" },
    { label: "Sch", width: "w-[50px]" },
    { label: "M.R.P", width: "w-[75px]" },
    { label: "Price", width: "w-[75px]" },
    { label: "Scheme", subLabel: "% / Amt", width: "w-[80px]" },
    { label: "Discount", subLabel: "% / Amt", width: "w-[80px]" },
    { label: "Taxable", subLabel: "Value", width: "w-[85px]" },
    { label: "CGST", width: "w-[95px]", colSpan: 2 },
    { label: "SGST", width: "w-[95px]", colSpan: 2 },
    { label: "Amount", width: "w-[95px]" },
  ];

  const totalAmount = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [rows]);

  // Sub-header cells configuration
  const subHeaderCells = [
    { className: "h-1 border-r border-[#1a1a8a] bg-[#03013d]", content: null },
    { className: "h-1 border-r border-[#1a1a8a]", content: null },
    { className: "h-1 border-r border-[#1a1a8a]", content: null },
    { className: "h-1 border-r border-[#1a1a8a]", content: null },
    { className: "h-1 border-r border-[#1a1a8a]", content: null },
    { className: "h-1 border-r border-[#1a1a8a]", content: null },
    { className: "h-1 border-r border-[#1a1a8a]", content: null },
    { className: "h-1 border-r border-[#1a1a8a]", content: null },
    { className: "h-1 border-r border-[#1a1a8a]", content: null },
    { className: "py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]", content: null },
    { className: "py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]", content: null },
    { className: "border-r border-[#1a1a8a]", content: null },
    { className: "py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]", content: "%" },
    { className: "py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]", content: "Amt" },
    { className: "py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]", content: "%" },
    { className: "py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]", content: "Amt" },
    { className: "border-r-0", content: null },
  ];

  // Calculate max height for scroll container
  const maxTableHeight = HEADER_HEIGHT + (maxVisibleRows * ROW_HEIGHT);

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Scrollable container with dynamic max height */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        style={{ 
          maxHeight: `${maxTableHeight}px`,
        }}
      >
        <table className="w-full border-collapse text-[11px] 2xl:text-xs">
          <thead className="sticky top-0 z-20">
            {/* Main Header Row */}
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280]">
              {headerColumns.map((col, i) => (
                <th
                  key={i}
                  colSpan={col.colSpan || 1}
                  className={`${col.width} px-2 py-2.5 text-white font-semibold text-center border-r border-[#1a1a8a] last:border-r-0 ${col.isSerial ? 'bg-[#03013d]' : ''}`}
                >
                  <div className="leading-tight">
                    <div>{col.label}</div>
                    {col.subLabel && (
                      <div className="text-[9px] font-normal text-indigo-200 mt-0.5">{col.subLabel}</div>
                    )}
                  </div>
                </th>
              ))}
            </tr>

            {/* Sub-header Row */}
            <tr className="bg-[#0d0399]">
              {subHeaderCells.map((cell, i) => (
                <th key={i} className={cell.className}>{cell.content}</th>
              ))}
            </tr>
          </thead>

          <tbody ref={tbodyRef} className="bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-slate-500">No items added yet</p>
                      <p className="text-xs text-slate-400 mt-1">Start typing to add purchase items</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <PurchaseRow
                  key={item.id || index}
                  index={index}
                  item={item}
                  onChange={handleRowChange}
                  onProductSelect={handleProductSelect}
                  productMaster={stableProductMaster}
                  registerFieldRef={getRegisterFieldRef(index)}
                  focusNextField={focusNextField}
                  focusPrevField={focusPrevField}
                  isEven={index % 2 === 0}
                  isLast={index === rows.length - 1}
                  rowNumber={index + 1}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Row count indicator - shows when scrolling is needed */}
      {/* {rows.length > maxVisibleRows && (
        <div className="shrink-0 px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {maxVisibleRows} of {rows.length} rows
          </span>
          <span className="text-slate-400">
            ↑↓ Scroll to see more
          </span>
        </div>
      )} */}
    </div>
  );
};

export default PurchaseTable;