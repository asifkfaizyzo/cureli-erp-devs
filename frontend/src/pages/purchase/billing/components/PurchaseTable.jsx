// src/components/purchase/PurchaseTable.jsx
import { useEffect, useRef, useCallback, useMemo } from "react";
import PurchaseRow from "./PurchaseRowFixed";

const makeEmptyRow = () => ({
  name: "", batch: "", rate: "", qty: "", pack: "", exp: "", type: "", category: "", rack: "", tax: "", packRate: "", disc: "", mrp: "", free: "",
});

const FIELDS_COUNT = 14;

const PurchaseTable = ({ rows, setRows, productMaster }) => {
  const fieldRefs = useRef([]);
  const containerRef = useRef(null);

  const stableProductMaster = useMemo(() => productMaster || [], [productMaster]);

  useEffect(() => {
    fieldRefs.current = fieldRefs.current.slice(0, rows.length);
  }, [rows.length]);

  // Focus Navigation
  const focusNextField = useCallback((rowIndex, fieldIndex) => {
    const lastField = FIELDS_COUNT - 1;
    let nextRow = rowIndex;
    let nextField = fieldIndex + 1;

    if (nextField > lastField) {
      nextField = 0;
      nextRow = rowIndex + 1;

      setRows((prev) => {
        if (prev[nextRow]) return prev;
        return [...prev, makeEmptyRow()];
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            const el = fieldRefs.current?.[nextRow]?.[nextField] ?? null;
            if (el && typeof el.focus === "function") {
              el.focus();
              if (containerRef.current && el.scrollIntoView) {
                el.scrollIntoView({ block: "nearest", behavior: "smooth" });
              }
            }
          } catch (err) {}
        });
      });
      return;
    }

    requestAnimationFrame(() => {
      try {
        const el = fieldRefs.current?.[nextRow]?.[nextField] ?? null;
        if (el && typeof el.focus === "function") el.focus();
      } catch (err) {}
    });
  }, [setRows]);

  const handleRowChange = useCallback((rowIndex, key, value) => {
    setRows((prev) => {
      if (prev[rowIndex]?.[key] === value) return prev;
      const updated = [...prev];
      updated[rowIndex] = { ...(updated[rowIndex] ?? makeEmptyRow()), [key]: value };
      return updated;
    });
  }, [setRows]);

  const getRegisterFieldRef = useCallback((rowIndex) => {
    return (fieldIndex, el) => {
      if (!fieldRefs.current[rowIndex]) fieldRefs.current[rowIndex] = [];
      fieldRefs.current[rowIndex][fieldIndex] = el;
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-white">
      
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        
        <table className="w-full border-collapse text-[10px] 2xl:text-xs table-fixed">
          
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white shadow-sm">
            <tr className="h-8">
              <th className="px-2 py-1 w-[40px] text-left font-semibold border-r border-indigo-900/30">#</th>
              <th className="px-2 py-1 w-[160px] text-left font-semibold border-r border-indigo-900/30">Product Name</th>
              <th className="px-2 py-1 w-[90px] text-center font-semibold border-r border-indigo-900/30">Batch</th>
              <th className="px-2 py-1 w-[60px] text-right font-semibold border-r border-indigo-900/30">Rate</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold border-r border-indigo-900/30">Qty</th>
              <th className="px-2 py-1 w-[60px] text-center font-semibold border-r border-indigo-900/30">Pack</th>
              <th className="px-2 py-1 w-[60px] text-center font-semibold border-r border-indigo-900/30">Exp</th>
              <th className="px-2 py-1 w-[90px] text-left font-semibold border-r border-indigo-900/30">Type</th>
              <th className="px-2 py-1 w-[90px] text-left font-semibold border-r border-indigo-900/30">Category</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold border-r border-indigo-900/30">Rack</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold border-r border-indigo-900/30">Tax%</th>
              <th className="px-2 py-1 w-[60px] text-right font-semibold border-r border-indigo-900/30">Pk Rate</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold border-r border-indigo-900/30">Disc%</th>
              <th className="px-2 py-1 w-[60px] text-right font-semibold border-r border-indigo-900/30">MRP</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold">Free</th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {rows.map((item, index) => (
              <PurchaseRow
                key={item.id || index}
                index={index}
                item={item}
                onChange={handleRowChange}
                productMaster={stableProductMaster}
                registerFieldRef={getRegisterFieldRef(index)}
                focusNextField={focusNextField}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseTable;