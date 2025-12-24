// src/components/purchase/PurchaseTable.jsx
import { useEffect, useRef, useCallback, useMemo } from "react";
import PurchaseRow from "./PurchaseRowFixed";

const FIELDS_COUNT = 13; // Number of editable fields

const PurchaseTable = ({
  rows,
  setRows,
  productMaster,
  calculateRow,
}) => {
  const fieldRefs = useRef([]);
  const containerRef = useRef(null);

  const stableProductMaster = useMemo(
    () => productMaster || [],
    [productMaster]
  );

  useEffect(() => {
    fieldRefs.current = fieldRefs.current.slice(0, rows.length);
  }, [rows.length]);

  /* Keyboard navigation */
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

  /* Focus previous field */
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

  /* Row update with calculation */
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

  // Column definitions for header (added # column)
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

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [rows]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header Bar */}
      {/* <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#05015A] to-[#0a0280] border-b border-[#0a0280]">
        <h3 className="text-white font-semibold text-sm tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Purchase Items
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-indigo-200 text-xs bg-indigo-900/30 px-2.5 py-1 rounded-full">
            {rows.length} item{rows.length !== 1 ? 's' : ''}
          </span>
          {totalAmount > 0 && (
            <span className="text-white text-xs bg-emerald-600/80 px-2.5 py-1 rounded-full font-medium">
              Total: ₹{totalAmount.toFixed(2)}
            </span>
          )}
          <div className="text-[10px] text-indigo-300 hidden sm:block">
            <kbd className="bg-indigo-900/50 px-1.5 py-0.5 rounded text-white">Tab</kbd>
            <span className="ml-1">-</span>
          </div>
        </div>
      </div> */}

      {/* Table Container */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
      >
        <table className="w-full border-collapse text-[11px] 2xl:text-xs">
          {/* HEADER */}
          <thead className="sticky top-0 z-20">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280]">
              {headerColumns.map((col, i) => (
                <th
                  key={i}
                  colSpan={col.colSpan || 1}
                  className={`
                    ${col.width}
                    px-2 py-2.5 
                    text-white font-semibold text-center
                    border-r border-[#1a1a8a] last:border-r-0
                    ${col.isSerial ? 'bg-[#03013d]' : ''}
                  `}
                >
                  <div className="leading-tight">
                    <div>{col.label}</div>
                    {col.subLabel && (
                      <div className="text-[9px] font-normal text-indigo-200 mt-0.5">
                        {col.subLabel}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>

            {/* Sub-header Row */}
            <tr className="bg-[#0d0399]">
              <th className="h-1 border-r border-[#1a1a8a] bg-[#03013d]" /> {/* # column */}
              {[...Array(8)].map((_, i) => (
                <th key={i} className="h-1 border-r border-[#1a1a8a]" />
              ))}
              <th className="py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]" />
              <th className="py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]" />
              <th className="border-r border-[#1a1a8a]" />
              <th className="py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]">%</th>
              <th className="py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]">Amt</th>
              <th className="py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]">%</th>
              <th className="py-1 text-[9px] font-medium text-indigo-200 border-r border-[#1a1a8a]">Amt</th>
              <th className="border-r-0" />
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="bg-white">
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
    </div>
  );
};

export default PurchaseTable;