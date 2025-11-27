// src/components/purchase/PurchaseTable.jsx

import { useEffect, useRef } from "react";
import PurchaseRow from "./PurchaseRow";

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

const PurchaseTable = ({ rows, setRows }) => {
  const fieldRefs = useRef([]);
  const containerRef = useRef(null);

  // keep ref array synced with rows length
  useEffect(() => {
    fieldRefs.current = fieldRefs.current.slice(0, rows.length);
  }, [rows.length]);

  /** ----------------------------------------------------------
   * ENTER → NEXT FIELD NAVIGATION
   * -------------------------------------------------------- */
  const focusNextField = (rowIndex, fieldIndex) => {
    const lastField = 13; // total fields (0–13)

    let nextRow = rowIndex;
    let nextField = fieldIndex + 1;

    // If Enter on last column → jump to next row
    if (nextField > lastField) {
      nextField = 0;
      nextRow = rowIndex + 1;

      // Auto-add new row if it doesn't exist
      if (!rows[nextRow]) {
        setRows((prev) => [...prev, makeEmptyRow()]);

        // Delay until new row renders
        setTimeout(() => {
          fieldRefs.current[nextRow]?.[nextField]?.focus?.();

          // auto-scroll down
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 30);

        return;
      }
    }

    // Focus next existing field
    setTimeout(() => {
      fieldRefs.current[nextRow]?.[nextField]?.focus?.();
    }, 20);
  };

  /** ----------------------------------------------------------
   * onChange from row → update rows state
   * -------------------------------------------------------- */
  const handleRowChange = (rowIndex, key, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [key]: value };
      return updated;
    });
  };

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
                key={index}
                index={index}
                item={item}
                onChange={handleRowChange}
                registerFieldRef={(fieldIndex, el) => {
                  if (!fieldRefs.current[index])
                    fieldRefs.current[index] = [];
                  fieldRefs.current[index][fieldIndex] = el;
                }}
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
