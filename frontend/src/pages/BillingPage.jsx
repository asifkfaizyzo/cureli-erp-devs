import { useState, useMemo } from "react";
import BillingHeader from "../components/billing/BillingHeader";
import ProductTable from "../components/billing/ProductTable";
import CustomerDetailsCard from "../components/billing/CustomerDetailsCard";
import BillingSummaryCard from "../components/billing/BillingSummaryCard";

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
  const [rows, setRows] = useState(() => Array.from({ length: 6 }).map(makeEmptyRow));

  const [customer, setCustomer] = useState({
    id: "123564",
    name: "",
    phone: "",
    eway: "",
    address: "",
    payment: "Cash",
  });

  const summary = useMemo(() => {
    const subTotal = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const sgst = +(subTotal * 0.05).toFixed(2);
    const cgst = +(subTotal * 0.05).toFixed(2);

    return {
      subTotal: +subTotal.toFixed(2),
      sgst,
      cgst,
      total: +(subTotal + sgst + cgst).toFixed(2),
    };
  }, [rows]);

  const handleSave = () => {
    const billData = {
      billNo: "123456",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      billedBy: "Amith",
      customer,
      rows,
      summary,
    };

    console.log("SAVE BILL DATA:", billData);
    alert("Bill Saved Successfully!");
  };

  const handleSavePrint = () => {
    handleSave();
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="flex flex-col h-[97%] w-full overflow-hidden">

      <BillingHeader onSave={handleSave} onSavePrint={handleSavePrint} />

      <div className="flex-1 flex flex-col overflow-hidden mt-1">
        <div className="flex-1 overflow-y-auto">
          <ProductTable rows={rows} setRows={setRows} />
        </div>

        <div className="flex  gap-3 items-start">
          <CustomerDetailsCard customer={customer} setCustomer={setCustomer} />
          <BillingSummaryCard summary={summary} />
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
