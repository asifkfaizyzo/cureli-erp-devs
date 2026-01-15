// src/pages/BillingPage.jsx
import { useState, useMemo, useEffect } from "react";
import BillingHeader from "./components/BillingHeader";
import ProductTable from "./components/ProductTable";
import CustomerDetailsCard from "./components/CustomerDetailsCard";
import BillingSummaryCard from "./components/BillingSummaryCard";
import { useToast } from "../../../components/common/Toast";

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

const BillingPage = () => {
  const toast = useToast();

  const [targetRowCount, setTargetRowCount] = useState(() => {
    // Initialize immediately based on screen size
    const width = window.innerWidth;
    if (width >= 2560) return 17;
    if (width >= 1920) return 16;
    if (width >= 1440) return 10;
    if (width >= 1366) return 6;
    return 6;
  });

  // Initialize rows with the calculated count
  const [rows, setRows] = useState(() =>
    Array.from({ length: targetRowCount }).map(makeEmptyRow)
  );

  const [customer, setCustomer] = useState({
    id: "123564",
    name: "",
    phone: "",
    eway: "",
    address: "",
    payment: "Cash",
  });

  // 1. RESPONSIVE LOGIC
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      let count = 6;

      if (width >= 2560) count = 17;
      else if (width >= 1920) count = 16;
      else if (width >= 1440) count = 10;
      else if (width >= 1366) count = 6;
      else count = 6;

      setTargetRowCount(count);
    };

    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  // 2. Update Rows when targetRowCount changes
  useEffect(() => {
    setRows((prev) => {
      // If no rows exist, create initial rows
      if (prev.length === 0) {
        return Array.from({ length: targetRowCount }).map(makeEmptyRow);
      }

      // If we need more rows
      if (prev.length < targetRowCount) {
        const needed = targetRowCount - prev.length;
        return [...prev, ...Array.from({ length: needed }).map(makeEmptyRow)];
      }

      // If we need fewer rows (only remove empty rows from the end)
      if (prev.length > targetRowCount) {
        // Keep filled rows, only trim empty ones
        const hasData = (row) =>
          Object.keys(row).some(
            (k) => k !== "mrp" && k !== "amount" && k !== "tax" && k !== "taxAmt" && k !== "disc" && row[k] !== "" && row[k] !== 0
          );
        
        const filledRows = prev.filter(hasData);
        if (filledRows.length >= targetRowCount) {
          return prev; // Don't remove rows with data
        }
      }

      return prev;
    });
  }, [targetRowCount]);

  const summary = useMemo(() => {
    const subTotal = rows.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0
    );
    const sgst = +(subTotal * 0.05).toFixed(2);
    const cgst = +(subTotal * 0.05).toFixed(2);

    return {
      subTotal: +subTotal.toFixed(2),
      sgst,
      cgst,
      total: +(subTotal + sgst + cgst).toFixed(2),
    };
  }, [rows]);

  // ---------------- ACTIONS ----------------
  const handleSave = () => {
    toast.success("Bill Saved", "The bill has been saved successfully.");
  };

  const handleSavePrint = () => {
    handleSave();
    toast.info("Print Started", "Preparing bill for printing.", 2000);
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1 gap-1 font-sans">
      {/* HEADER */}
      <div className="shrink-0">
        <BillingHeader onSave={handleSave} onSavePrint={handleSavePrint} />
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm min-h-0 relative">
        <div className="flex-1 overflow-y-auto">
          <ProductTable rows={rows} setRows={setRows} />
        </div>
      </div>

      {/* FOOTER */}
      <div className="shrink-0 flex gap-2 h-[170px] 2xl:h-[200px]">
        <CustomerDetailsCard customer={customer} setCustomer={setCustomer} />
        <BillingSummaryCard summary={summary} />
      </div>
    </div>
  );
};

export default BillingPage;