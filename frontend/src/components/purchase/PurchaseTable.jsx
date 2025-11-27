// src/components/purchase/PurchaseTable.jsx
import { useEffect, useRef, useCallback, useMemo } from "react";
import PurchaseRow from "./PurchaseRowFixed";

const makeEmptyRow = () => ({
  name: "",
  batch: "",
  rate: "",
  qty: "",
  pack: "",
  exp: "",
  type: "",
  category: "",
  rack: "",
  tax: "",
  packRate: "",
  disc: "",
  mrp: "",
  free: "",
});

const FIELDS_COUNT = 14;

const PurchaseTable = ({ rows, setRows, productMaster }) => {
  const fieldRefs = useRef([]);
  const containerRef = useRef(null);

  // ✅ Memoize productMaster to ensure stable reference
  const stableProductMaster = useMemo(() => {
    return productMaster || [];
  }, [productMaster]);

  // Keep ref array sized to rows
  useEffect(() => {
    fieldRefs.current = fieldRefs.current.slice(0, rows.length);
  }, [rows.length]);

  /** Focus navigation (Enter) */
  const focusNextField = useCallback(
    (rowIndex, fieldIndex) => {
      const lastField = FIELDS_COUNT - 1;
      let nextRow = rowIndex;
      let nextField = fieldIndex + 1;

      if (nextField > lastField) {
        nextField = 0;
        nextRow = rowIndex + 1;

        // Check if need to add new row
        setRows((prev) => {
          if (prev[nextRow]) return prev; // Row exists, no change
          return [...prev, makeEmptyRow()];
        });

        // Wait for next paint then focus
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
            } catch (err) {
              // fail silently
            }
          });
        });
        return;
      }

      requestAnimationFrame(() => {
        try {
          const el = fieldRefs.current?.[nextRow]?.[nextField] ?? null;
          if (el && typeof el.focus === "function") {
            el.focus();
          }
        } catch (err) {
          // fail silently
        }
      });
    },
    [setRows]  // ✅ Removed 'rows' dependency - use functional update instead
  );

  /** Update a row value safely */
  const handleRowChange = useCallback(
    (rowIndex, key, value) => {
      setRows((prev) => {
        if (prev[rowIndex]?.[key] === value) return prev;

        const updated = [...prev];
        updated[rowIndex] = {
          ...(updated[rowIndex] ?? makeEmptyRow()),
          [key]: value,
        };
        return updated;
      });
    },
    [setRows]
  );

  /** ✅ Memoize registerFieldRef creators for each row */
  const getRegisterFieldRef = useCallback((rowIndex) => {
    return (fieldIndex, el) => {
      if (!fieldRefs.current[rowIndex]) {
        fieldRefs.current[rowIndex] = [];
      }
      fieldRefs.current[rowIndex][fieldIndex] = el;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div ref={containerRef} className="max-h-[245px] overflow-y-auto">
        <table className="min-w-full border-collapse table-fixed">
          <thead className="sticky top-0 bg-[#000060] text-white">
            <tr className="text-[11px]">
              <th className="px-2 py-2 w-[40px] text-left">Sl.No</th>
              <th className="px-2 py-2 w-[180px] text-left">Product Name</th>
              <th className="px-2 py-2 w-[100px] text-center">Batch</th>
              <th className="px-2 py-2 w-[70px] text-right">Rate</th>
              <th className="px-2 py-2 w-[55px] text-center">Qty</th>
              <th className="px-2 py-2 w-[70px] text-center">Pack</th>
              <th className="px-2 py-2 w-[70px] text-center">Exp</th>
              <th className="px-2 py-2 w-[110px] text-left">Type</th>
              <th className="px-2 py-2 w-[110px] text-left">Category</th>
              <th className="px-2 py-2 w-[60px] text-center">Rack</th>
              <th className="px-2 py-2 w-[55px] text-center">Tax%</th>
              <th className="px-2 py-2 w-[70px] text-right">Pack Rate</th>
              <th className="px-2 py-2 w-[55px] text-center">Disc%</th>
              <th className="px-2 py-2 w-[70px] text-right">MRP</th>
              <th className="px-2 py-2 w-[55px] text-center">Free</th>
            </tr>
          </thead>

          <tbody>
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