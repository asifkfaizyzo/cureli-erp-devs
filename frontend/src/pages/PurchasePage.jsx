// src/pages/PurchasePage.jsx
import { useState, useMemo, useEffect } from "react";
import PurchaseHeader from "../components/purchase/PurchaseHeader";
import PurchaseTable from "../components/purchase/PurchaseTable";
import SupplierDetailsCard from "../components/purchase/SupplierDetailsCard";
import PurchaseSummaryCard from "../components/purchase/PurchaseSummaryCard";

const makeEmptyPurchaseRow = () => ({
  name: "",
  batch: "",
  rate: 0,
  qty: "",
  pack: "",
  exp: "",
  type: "",
  category: "",
  rack: "",
  tax: 0,
  disc: 0,
  mrp: 0,
  free: "",
});

const PurchasePage = () => {
  const [rows, setRows] = useState(() =>
    Array.from({ length: 8 }).map(makeEmptyPurchaseRow)
  );

  const [supplier, setSupplier] = useState({
    purchaseId: "123456",
    invoiceNo: "",
    supplierGST: "",
    receivedOn: "",
    address: "",
    amountPaid: "",
    balance: "",
  });

  const summary = useMemo(() => {
    const subTotal = rows.reduce((sum, r) => sum + (Number(r.mrp) || 0), 0);
    const sgst = +(subTotal * 0.05).toFixed(2);
    const cgst = +(subTotal * 0.05).toFixed(2);

    return {
      subTotal: +subTotal.toFixed(2),
      sgst,
      cgst,
      total: +(subTotal + sgst + cgst).toFixed(2),
    };
  }, [rows]);

  // -------------------------------
  // MAIN SAVE FUNCTION
  // -------------------------------
  const handleSave = () => {
    const data = {
      purchaseID: supplier.purchaseId,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      supplier,
      rows,
      summary,
    };

    console.log("PURCHASE SAVED:", data);
    alert("Purchase Saved Successfully!");
  };

  const handleSavePrint = () => {
    handleSave();
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">

      <PurchaseHeader onSave={handleSave} onSavePrint={handleSavePrint} />

      <div className="flex-1 flex flex-col overflow-hidden mt-1">
        <div className="flex-1 overflow-y-auto">
          <PurchaseTable rows={rows} setRows={setRows} />
        </div>

        <div className="flex gap-4 items-start">
          <SupplierDetailsCard supplier={supplier} setSupplier={setSupplier} />
          <PurchaseSummaryCard summary={summary} />
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
