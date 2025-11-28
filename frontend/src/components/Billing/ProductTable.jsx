import { useState, useRef, useEffect } from "react";
import ProductRow from "./ProductRow";
import { billProductsMaster } from "../data/bill";

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
  const containerRef = useRef(null);   // ⭐ Added for auto-scroll

  useEffect(() => {
    batchRefs.current = batchRefs.current.slice(0, rows.length);
    qtyRefs.current = qtyRefs.current.slice(0, rows.length);
  }, [rows.length]);

  const removeRow = (index) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      if (index === prev.length - 1) return prev;

      const copy = [...prev];
      copy.splice(index, 1);
      return ensureTrailingBlank(copy);
    });
  };

  const ensureTrailingBlank = (arr) => {
    const last = arr[arr.length - 1];
    const isEmpty = Object.keys(last).every(
      (k) => last[k] === "" || last[k] === 0 || last[k] === null
    );
    return isEmpty ? arr : [...arr, makeEmptyRow()];
  };

  const handleRowChange = (index, field, value, opts = {}) => {
    setRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (field === "__deleteRow") {
        if (index === prev.length - 1) return prev;
        const copy = [...prev];
        copy.splice(index, 1);
        return ensureTrailingBlank(copy);
      }

      row[field] = value;
      updated[index] = row;

      // BATCH autofill
      if (field === "batch" && opts.triggerAutoFill) {
        const match =
          billProductsMaster.find(
            (p) => p.batch?.toLowerCase() === value.toLowerCase()
          ) ||
          billProductsMaster.find(
            (p) => String(p.barcode) === String(value)
          );

        if (match) {
          updated[index] = {
            ...row,
            ...match,
            qty: row.qty || match.qty || 1,
          };
        }
      }

      // Auto amount
      const r = updated[index];
      const qty = Number(r.qty) || 0;
const mrp = Number(r.mrp) || 0;
const discPct = Number(r.disc) || 0;   // discount %
const taxPct = Number(r.tax) || 0;     // tax %

const base = qty * mrp;
const discAmt = +(base * discPct / 100).toFixed(2);
const afterDisc = +(base - discAmt).toFixed(2);

const taxAmt = +((afterDisc * taxPct) / 100).toFixed(2);
const amount = +(afterDisc + taxAmt).toFixed(2);

r.taxAmt = taxAmt;
r.amount = amount;


      return ensureTrailingBlank(updated);
    });

    // move focus to qty after batch autofill
    if (field === "batch" && opts.triggerAutoFill) {
      queueMicrotask(() => qtyRefs.current[index]?.focus?.());
    }
  };

  // ⭐ Auto-scroll after 3rd row and every new row
  const focusNextRowBatch = (i) => {
    setRows((prev) => {
      let next = prev;

      if (i === prev.length - 1) {
        next = [...prev, makeEmptyRow()];

        queueMicrotask(() => {
          // AUTO SCROLL only when row count > 3
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

      queueMicrotask(() => batchRefs.current[i + 1]?.focus?.());
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div
        ref={containerRef}
       className="
  max-h-[240px]
  min-[1366px]:max-h-[300px]
  min-[1440px]:max-h-[400px]
  min-[1920px]:max-h-[600px]
  min-[2560px]:max-h-[620px]
  overflow-y-auto
  relative
"

      >
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-[#000060] text-white">
  <tr className="text-[11px]">
    <th className="px-2 py-2 w-[40px] text-left">Sl.No</th>
    <th className="px-2 py-2 w-[180px] text-left">Product Name</th>
    <th className="px-2 py-2 w-[110px] text-left">Batch</th>
    <th className="px-2 py-2 w-[55px] text-center">Qty</th>
    <th className="px-2 py-2 w-[55px] text-right">MRP</th>
    <th className="px-2 py-2 w-[70px] text-center">Exp</th>
    <th className="px-2 py-2 w-[120px] text-left">Type</th>
    <th className="px-2 py-2 w-[120px] text-left">Category</th>
    <th className="px-2 py-2 w-[60px] text-center">Stock</th>
    <th className="px-2 py-2 w-[60px] text-center">Rack</th>

    {/* NEW COLUMNS */}
    <th className="px-2 py-2 w-[55px] text-center">Disc%</th>
    <th className="px-2 py-2 w-[55px] text-center">Tax%</th>
    <th className="px-2 py-2 w-[65px] text-center">Tax Amt</th>

    <th className="px-2 py-2 w-[70px] text-right">Amount</th>
  </tr>
</thead>


          <tbody className="border-4 border-white rounded-xl">
            {rows.map((item, idx) => (
              <ProductRow
                key={idx}
                index={idx}
                item={item}
                masterList={billProductsMaster}
                batchRef={(el) => (batchRefs.current[idx] = el)}
                qtyRef={(el) => (qtyRefs.current[idx] = el)}
                onChange={(i, field, value, opts) =>
                  field === "__deleteRow"
                    ? removeRow(i)
                    : handleRowChange(i, field, value, opts)
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
