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
  const [rows, setRows] = useState(() => Array.from({ length: 18 }).map(makeEmptyRow));

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


// import { useState, useMemo } from "react";
// import BillingHeader from "../components/billing/BillingHeader";
// import ProductTable from "../components/billing/ProductTable";
// import CustomerDetailsCard from "../components/billing/CustomerDetailsCard";
// import BillingSummaryCard from "../components/billing/BillingSummaryCard";

// const makeEmptyRow = () => ({
//   name: "",
//   batch: "",
//   qty: "",
//   mrp: 0,
//   amount: 0,
//   exp: "",
//   type: "",
//   category: "",
//   stock: "",
//   rack: "",
//   tax: 0,
//   taxAmt: 0,
//   disc: 0,
//   barcode: "",
// });

// const BillingPage = () => {
//   const [rows, setRows] = useState(() => Array.from({ length: 18 }).map(makeEmptyRow));

//   const [customer, setCustomer] = useState({
//     id: "123564",
//     name: "",
//     phone: "",
//     eway: "",
//     address: "",
//     payment: "Cash",
//   });

//   const summary = useMemo(() => {
//     const subTotal = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
//     const sgst = +(subTotal * 0.05).toFixed(2);
//     const cgst = +(subTotal * 0.05).toFixed(2);

//     return {
//       subTotal: +subTotal.toFixed(2),
//       sgst,
//       cgst,
//       total: +(subTotal + sgst + cgst).toFixed(2),
//     };
//   }, [rows]);

//   const handleSave = () => {
//     const billData = {
//       billNo: "123456",
//       date: new Date().toLocaleDateString(),
//       time: new Date().toLocaleTimeString(),
//       billedBy: "Amith",
//       customer,
//       rows,
//       summary,
//     };
//     console.log("SAVE BILL DATA:", billData);
//     alert("Bill Saved Successfully!");
//   };

//   const handleSavePrint = () => {
//     handleSave();
//     setTimeout(() => window.print(), 500);
//   };

//   return (
    /* 
      LAYOUT ADJUSTMENT:
      - Removed bg-gray-50 (AppLayout has it)
      - Removed outer p-4 (AppLayout has padding)
      - Added 'h-full' and 'flex-col' to fill the AnimatePresence container
      - gap-3 gives breathing room between Header, Table, and Footer
    */
//     <div className="flex flex-col h-full gap-3">
      
//       {/* HEADER: Fixed height, transparent bg (components will have their own bg) */}
//       <div className="flex-none">
//         <BillingHeader onSave={handleSave} onSavePrint={handleSavePrint} />
//       </div>

//       {/* TABLE CONTAINER: 
//           - flex-1: Greedily takes all remaining space
//           - bg-white: Creates the card look
//           - overflow-hidden: Contains the scrolling table inside this card
//       */}
//       <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
//         <div className="flex-1 relative">
//           {/* Table fills this relative container */}
//           <ProductTable rows={rows} setRows={setRows} />
//         </div>
//       </div>

//       {/* FOOTER CONTAINER:
//           - Fixed height (h-48 is approx 192px, good for summary)
//           - Horizontal layout
//       */}
//       <div className="flex-none h-48 flex gap-3">
        
//         {/* Customer Card - Takes 70% space */}
//         <div className="w-[70%] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <CustomerDetailsCard customer={customer} setCustomer={setCustomer} />
//         </div>

//         {/* Summary Card - Takes 30% space */}
//         <div className="w-[30%] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <BillingSummaryCard summary={summary} />
//         </div>

//       </div>
//     </div>
//   );
// };

// export default BillingPage;

// import { useState, useMemo } from "react";
// import BillingHeader from "../components/billing/BillingHeader";
// import ProductTable from "../components/billing/ProductTable";
// import CustomerDetailsCard from "../components/billing/CustomerDetailsCard";
// import BillingSummaryCard from "../components/billing/BillingSummaryCard";

// const makeEmptyRow = () => ({
//   name: "", batch: "", qty: "", mrp: 0, amount: 0, exp: "", type: "", category: "", stock: "", rack: "", tax: 0, taxAmt: 0, disc: 0, barcode: "",
// });

// const BillingPage = () => {
//   const [rows, setRows] = useState(() => Array.from({ length: 19 }).map(makeEmptyRow));
  
//   const [customer, setCustomer] = useState({
//     id: "123564", name: "", phone: "", eway: "", address: "", payment: "Cash",
//   });

//   const summary = useMemo(() => {
//     const subTotal = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
//     const sgst = +(subTotal * 0.05).toFixed(2);
//     const cgst = +(subTotal * 0.05).toFixed(2);
//     return { subTotal: +subTotal.toFixed(2), sgst, cgst, total: +(subTotal + sgst + cgst).toFixed(2) };
//   }, [rows]);

//   const handleSave = () => { /* Save Logic */ };
//   const handleSavePrint = () => { /* Print Logic */ };

//   return (
//     <div className="flex flex-col h-full gap-3">
      
//       {/* HEADER */}
//       <div className="flex-none">
//         <BillingHeader onSave={handleSave} onSavePrint={handleSavePrint} />
//       </div>

//       {/* TABLE CONTAINER 
//           - flex-1: Takes remaining space, but since footer is taller now, this area is smaller.
//           - Less whitespace!
//       */}
//       <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative flex flex-col">
//         <div className="absolute inset-0">
//           <ProductTable rows={rows} setRows={setRows} />
//         </div>
//       </div>

//       {/* FOOTER CONTAINER
//           - Increased height to h-[280px] (was h-48).
//           - This "lifts" the content up and gives inputs room to breathe.
//       */}
//       <div className="flex-none h-[210px] flex gap-2">
        
//         {/* Customer Card */}
//         <div className="w-[70%] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <CustomerDetailsCard customer={customer} setCustomer={setCustomer} />
//         </div>

//         {/* Summary Card */}
//         <div className="w-[30%] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <BillingSummaryCard summary={summary} />
//         </div>

//       </div>
//     </div>
//   );
// };

// export default BillingPage;