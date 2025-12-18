
// src/pages/BillingPage.jsx
import { useState, useMemo, useEffect } from "react";
import BillingHeader from "./components/BillingHeader";
import ProductTable from "./components/ProductTable";
import CustomerDetailsCard from "./components/CustomerDetailsCard";
import BillingSummaryCard from "./components/BillingSummaryCard";

const makeEmptyRow = () => ({
  name: "", batch: "", qty: "", mrp: 0, amount: 0, exp: "", type: "", category: "", stock: "", rack: "", tax: 0, taxAmt: 0, disc: 0, barcode: "",
});

const BillingPage = () => {
  const [targetRowCount, setTargetRowCount] = useState(8); // Default for small screens
  const [rows, setRows] = useState([]);

  const [customer, setCustomer] = useState({
    id: "123564", name: "", phone: "", eway: "", address: "", payment: "Cash",
  });

  // 1. RESPONSIVE LOGIC (Provided by you)
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      let count = 6; // Default / Mobile

      if (width >= 2560) count = 17;       // 4k / 27 inch
      else if (width >= 1920) count = 16;  // 1080p Full HD
      else if (width >= 1440) count = 10;  // 19 inch / high res laptop
      else if (width >= 1366) count = 6;   // 14 inch laptop
      else count = 6;

      setTargetRowCount(count);
    };

    // Run on mount and resize
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  // 2. Update Rows when targetRowCount changes
  useEffect(() => {
    setRows((prev) => {
      // If we need more rows, add them
      if (prev.length < targetRowCount) {
        const needed = targetRowCount - prev.length;
        return [...prev, ...Array.from({ length: needed }).map(makeEmptyRow)];
      }
      // If we have enough, just ensure we don't cut off data (optional logic)
      // For now, we just keep existing rows if they are greater than target to avoid data loss
      return prev.length > 0 ? prev : Array.from({ length: targetRowCount }).map(makeEmptyRow);
    });
  }, [targetRowCount]);

  const summary = useMemo(() => {
    const subTotal = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const sgst = +(subTotal * 0.05).toFixed(2);
    const cgst = +(subTotal * 0.05).toFixed(2);
    return { subTotal: +subTotal.toFixed(2), sgst, cgst, total: +(subTotal + sgst + cgst).toFixed(2) };
  }, [rows]);

  const handleSave = () => { alert("Bill Saved!"); };
  const handleSavePrint = () => { handleSave(); setTimeout(() => window.print(), 500); };

  return (
    // Main Container: Tighter padding (p-2)
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1 gap-1 font-sans">

      {/* HEADER */}
      <div className="shrink-0">
        <BillingHeader onSave={handleSave} onSavePrint={handleSavePrint} />
      </div>

      {/* TABLE: Fills remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm min-h-0 relative">
        <div className="flex-1 overflow-y-auto">
          <ProductTable rows={rows} setRows={setRows} />
        </div>
      </div>

      {/* FOOTER: Fixed height, responsive card sizing */}
      <div className="shrink-0 flex gap-2 h-[170px] 2xl:h-[200px]">
        <CustomerDetailsCard customer={customer} setCustomer={setCustomer} />
        <BillingSummaryCard summary={summary} />
      </div>

    </div>
  );
};

export default BillingPage;