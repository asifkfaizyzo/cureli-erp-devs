
// src/pages/PurchasePage.jsx
import { useState, useMemo, useEffect } from "react";
import PurchaseHeader from "./components/PurchaseHeader";
import PurchaseTable from "./components/PurchaseTable";
import SupplierDetailsCard from "./components/SupplierDetailsCard";
import PurchaseSummaryCard from "./components/PurchaseSummaryCard";

const makeEmptyPurchaseRow = () => ({
  name: "", batch: "", rate: 0, qty: "", pack: "", exp: "", type: "", category: "", rack: "", tax: 0, disc: 0, mrp: 0, free: "",
});

// Dummy Master Data
const PRODUCT_MASTER_DATA = [
  { id: 1, name: "Paracetamol 500mg", type: "Tablet", category: "Pain Relief" },
  { id: 2, name: "Amoxicillin 250mg", type: "Capsule", category: "Antibiotic" },
  { id: 3, name: "Omeprazole 20mg", type: "Capsule", category: "Gastric" },
  { id: 4, name: "Metformin 500mg", type: "Tablet", category: "Diabetes" },
  { id: 5, name: "Atorvastatin 10mg", type: "Tablet", category: "Cholesterol" },
];

const PurchasePage = () => {
  const [targetRowCount, setTargetRowCount] = useState(8);
  const [rows, setRows] = useState([]);

  const [supplier, setSupplier] = useState({
    purchaseId: "123456", invoiceNo: "", supplierGST: "", receivedOn: "", address: "", amountPaid: "", balance: "",
  });

  const productMaster = useMemo(() => PRODUCT_MASTER_DATA, []);

  // 1. RESPONSIVE LOGIC (Exact match from BillingPage)
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      let count = 6; // Default / Mobile

      if (width >= 2560) count = 18;       // 4k / 27 inch
      else if (width >= 1920) count = 16;  // 1080p Full HD
      else if (width >= 1440) count = 10;  // 19 inch / high res laptop
      else if (width >= 1366) count = 6;   // 14 inch laptop (Specific requirement)
      else count = 6;

      setTargetRowCount(count);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  // 2. Sync Rows with Target Count
  useEffect(() => {
    setRows((prev) => {
      if (prev.length < targetRowCount) {
        const needed = targetRowCount - prev.length;
        return [...prev, ...Array.from({ length: needed }).map(makeEmptyPurchaseRow)];
      }
      return prev.length > 0 ? prev : Array.from({ length: targetRowCount }).map(makeEmptyPurchaseRow);
    });
  }, [targetRowCount]);

  const summary = useMemo(() => {
    const subTotal = rows.reduce((sum, r) => sum + (Number(r.mrp) || 0), 0);
    const sgst = +(subTotal * 0.05).toFixed(2);
    const cgst = +(subTotal * 0.05).toFixed(2);
    return { subTotal: +subTotal.toFixed(2), sgst, cgst, total: +(subTotal + sgst + cgst).toFixed(2) };
  }, [rows]);

  const handleSave = () => { alert("Purchase Saved Successfully!"); };
  const handleSavePrint = () => { handleSave(); setTimeout(() => window.print(), 500); };

  return (
    // Main Container: Tighter padding (p-1) to match BillingPage
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1 gap-1 font-sans">

      {/* HEADER */}
      <div className="shrink-0">
        <PurchaseHeader onSave={handleSave} onSavePrint={handleSavePrint} />
      </div>

      {/* TABLE: Fills remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm min-h-0 relative">
        <div className="flex-1 overflow-y-auto">
          <PurchaseTable 
            rows={rows} 
            setRows={setRows} 
            productMaster={productMaster} 
          />
        </div>
      </div>

      {/* FOOTER: Fixed height, responsive card sizing */}
      <div className="shrink-0 flex gap-2 h-[170px] 2xl:h-[200px]">
        <SupplierDetailsCard supplier={supplier} setSupplier={setSupplier} />
        <PurchaseSummaryCard summary={summary} />
      </div>

    </div>
  );
};

export default PurchasePage;