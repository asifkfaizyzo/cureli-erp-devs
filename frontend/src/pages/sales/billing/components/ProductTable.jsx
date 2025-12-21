
import { useState, useRef, useEffect } from "react";
import ProductRow from "./ProductRow";
import { billProductsMaster } from "../../../././../components/data/bill";

// NEW EMPTY ROW BLUEPRINT
const makeEmptyRow = () => ({
  name: "",
  batch: "",
  qty: "",
  mrp: 0,
  amount: 0,
  exp: "",
  type: "",
  category: "",
  stock: "",
  rack: "",
  tax: 0,
  taxAmt: 0,
  disc: 0,
  barcode: "",
});

const ProductTable = ({ rows, setRows }) => {
  const batchRefs = useRef([]);
  const qtyRefs = useRef([]);
  const containerRef = useRef(null);

  useEffect(() => {
    batchRefs.current = batchRefs.current.slice(0, rows.length);
    qtyRefs.current = qtyRefs.current.slice(0, rows.length);
  }, [rows.length]);

  /* -----------------------------------------------------
     REMOVE ROW
  ------------------------------------------------------ */
  const removeRow = (index) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      if (index === prev.length - 1) return prev;

      const copy = [...prev];
      copy.splice(index, 1);
      return ensureTrailingBlank(copy);
    });
  };

  /* -----------------------------------------------------
     ENSURE LAST ROW IS ALWAYS EMPTY
  ------------------------------------------------------ */
  const ensureTrailingBlank = (arr) => {
    const last = arr[arr.length - 1];
    const isEmpty = Object.keys(last).every(
      (k) => last[k] === "" || last[k] === 0 || last[k] === null
    );
    return isEmpty ? arr : [...arr, makeEmptyRow()];
  };

  /* -----------------------------------------------------
     HANDLE ROW CHANGE (REAL LOGIC)
  ------------------------------------------------------ */
  const handleRowChange = (index, field, value, opts = {}) => {
    setRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };

      // Delete row
      if (field === "__deleteRow") {
        if (index === prev.length - 1) return prev;
        updated.splice(index, 1);
        return ensureTrailingBlank(updated);
      }

      row[field] = value;
      updated[index] = row;

      /* -----------------------------------
         BATCH AUTO-FILL
      ------------------------------------ */
      if (field === "batch" && opts.triggerAutoFill) {
        const match =
          billProductsMaster.find(
            (p) => p.batch?.toLowerCase() === value.toLowerCase()
          ) ||
          billProductsMaster.find((p) => String(p.barcode) === String(value));

        if (match) {
          updated[index] = {
            ...row,
            ...match,
            qty: row.qty || match.qty || 1,
          };
        }
      }

      /* -----------------------------------
         AUTO CALCULATION
      ------------------------------------ */
      const r = updated[index];

      const qty = Number(r.qty) || 0;
      const mrp = Number(r.mrp) || 0;

      const discPct = Number(r.disc) || 0;
      const taxPct = Number(r.tax) || 0;

      const base = qty * mrp;
      const discAmt = +(base * discPct / 100).toFixed(2);
      const afterDisc = +(base - discAmt).toFixed(2);

      const taxAmt = +((afterDisc * taxPct) / 100).toFixed(2);
      const amount = +(afterDisc + taxAmt).toFixed(2);

      r.taxAmt = taxAmt;
      r.amount = amount;

      return ensureTrailingBlank(updated);
    });

    /* -----------------------------------
       Move focus → qty after batch fill
    ------------------------------------ */
    if (field === "batch" && opts.triggerAutoFill) {
      queueMicrotask(() => qtyRefs.current[index]?.focus?.());
    }
  };

  /* -----------------------------------------------------
     ENTER KEY → FOCUS NEXT ROW / ADD NEW ROW
  ------------------------------------------------------ */
  const focusNextRowBatch = (i) => {
    setRows((prev) => {
      let next = prev;

      // If last row → create new one
      if (i === prev.length - 1) {
        next = [...prev, makeEmptyRow()];

        queueMicrotask(() => {
          if (containerRef.current && next.length > 3) {
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
          batchRefs.current[i + 1]?.focus?.();
        });

        return next;
      }

      // Otherwise → go to next row
      queueMicrotask(() => batchRefs.current[i + 1]?.focus?.());
      return next;
    });
  };

  /* -----------------------------------------------------
     UI WITH YOUR EXACT NEW DESIGN
  ------------------------------------------------------ */
  return (
    <div className="h-[100%] w-full flex flex-col bg-white">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
      >
        <table className="w-full border-collapse text-[10px] 2xl:text-xs table-fixed">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white shadow-sm">
            <tr className="h-8">
              <th className="px-2 py-1 w-[40px] text-left font-semibold  border-indigo-900/30">#</th>
              <th className="px-2 py-1 w-[160px] text-left font-semibold  border-indigo-900/30">Product Name</th>
              <th className="px-2 py-1 w-[100px] text-left font-semibold  border-indigo-900/30">Batch</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold  border-indigo-900/30">Qty</th>
              <th className="px-2 py-1 w-[60px] text-right font-semibold  border-indigo-900/30">MRP</th>
              <th className="px-2 py-1 w-[70px] text-center font-semibold  border-indigo-900/30">Exp</th>
              <th className="px-2 py-1 w-[100px] text-left font-semibold  border-indigo-900/30">Type</th>
              <th className="px-2 py-1 w-[100px] text-left font-semibold  border-indigo-900/30">Category</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold  border-indigo-900/30">Stock</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold  border-indigo-900/30">Rack</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold  border-indigo-900/30">Disc%</th>
              <th className="px-2 py-1 w-[50px] text-center font-semibold  border-indigo-900/30">Tax%</th>
              <th className="px-2 py-1 w-[60px] text-center font-semibold  border-indigo-900/30">Tax Amt</th>
              <th className="px-2 py-1 w-[70px] text-right font-semibold">Amount</th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {rows.map((item, idx) => (
              <ProductRow
                key={idx}
                index={idx}
                item={item}
                masterList={billProductsMaster}
                batchRef={(el) => (batchRefs.current[idx] = el)}
                qtyRef={(el) => (qtyRefs.current[idx] = el)}
                onChange={(i, field, v, opts) =>
                  field === "__deleteRow"
                    ? removeRow(i)
                    : handleRowChange(i, field, v, opts)
                }
                onRequestNextRowBatch={() => focusNextRowBatch(idx)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
