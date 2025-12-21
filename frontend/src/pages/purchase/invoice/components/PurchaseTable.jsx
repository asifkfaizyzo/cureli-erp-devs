
// // components/ViewInvoiceModal.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import { X, Save, Printer, Trash2 } from "lucide-react";
// import { useMenuStore } from "../../../../store/useMenuStore";

// const backdropVariants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1 },
// };

// const panelVariants = {
//   hidden: { opacity: 0, y: 20, scale: 0.95 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     scale: 1,
//     transition: { type: "spring", stiffness: 300, damping: 25 },
//   },
//   exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
// };

// // 🎯 DUMMY DATA FOR TESTING
// const DUMMY_ITEMS = [
//   { name: "Paracetamol 500mg", batch: "E7656T", rate: 10.00, qty: 5, exp: "12/26", type: "Antibiotics", category: "Medicine", stock: 100, rack: "S8", tax: 1.5, taxAmt: 1.5, disc: 0, mrp: 11.50 },
//   { name: "Amoxicillin 250mg", batch: "A1234B", rate: 15.50, qty: 10, exp: "03/27", type: "Antibiotics", category: "Medicine", stock: 85, rack: "S5", tax: 2.0, taxAmt: 3.1, disc: 0, mrp: 18.60 },
//   { name: "Ibuprofen 400mg", batch: "IB789C", rate: 8.75, qty: 8, exp: "06/26", type: "Pain Relief", category: "Medicine", stock: 120, rack: "R2", tax: 1.2, taxAmt: 0.96, disc: 5, mrp: 9.71 },
//   { name: "Cetirizine 10mg", batch: "CT456D", rate: 5.00, qty: 15, exp: "09/27", type: "Antihistamine", category: "Medicine", stock: 200, rack: "R7", tax: 1.0, taxAmt: 1.5, disc: 0, mrp: 6.50 },
//   { name: "Metformin 500mg", batch: "MF123E", rate: 12.00, qty: 20, exp: "11/26", type: "Diabetes", category: "Medicine", stock: 90, rack: "S3", tax: 1.8, taxAmt: 3.6, disc: 10, mrp: 15.60 },
//   { name: "Omeprazole 20mg", batch: "OM987F", rate: 18.00, qty: 7, exp: "01/28", type: "Gastric", category: "Medicine", stock: 75, rack: "R9", tax: 2.5, taxAmt: 1.75, disc: 0, mrp: 19.75 },
//   { name: "Aspirin 75mg", batch: "AS654G", rate: 6.50, qty: 12, exp: "04/27", type: "Cardiovascular", category: "Medicine", stock: 150, rack: "S1", tax: 1.0, taxAmt: 1.2, disc: 0, mrp: 7.70 },
//   { name: "Vitamin D3 1000IU", batch: "VD321H", rate: 25.00, qty: 5, exp: "08/28", type: "Supplements", category: "Vitamins", stock: 60, rack: "R4", tax: 3.0, taxAmt: 1.5, disc: 15, mrp: 28.50 },
//   { name: "Calcium Tablets", batch: "CA789I", rate: 20.00, qty: 10, exp: "12/27", type: "Supplements", category: "Minerals", stock: 80, rack: "S6", tax: 2.5, taxAmt: 2.5, disc: 0, mrp: 22.50 },
//   { name: "Multivitamin Syrup", batch: "MV456J", rate: 35.00, qty: 4, exp: "05/27", type: "Supplements", category: "Syrups", stock: 45, rack: "R8", tax: 4.0, taxAmt: 1.4, disc: 5, mrp: 36.40 },
//   { name: "Cough Syrup 100ml", batch: "CS234K", rate: 45.00, qty: 6, exp: "02/27", type: "Respiratory", category: "Syrups", stock: 55, rack: "R6", tax: 5.0, taxAmt: 3.0, disc: 0, mrp: 48.00 },
//   { name: "Antiseptic Cream", batch: "AC567L", rate: 30.00, qty: 8, exp: "07/28", type: "Topical", category: "Ointments", stock: 70, rack: "S2", tax: 3.5, taxAmt: 2.8, disc: 10, mrp: 33.80 },
//   { name: "Eye Drops 10ml", batch: "ED890M", rate: 55.00, qty: 3, exp: "10/26", type: "Ophthalmic", category: "Drops", stock: 40, rack: "R1", tax: 6.0, taxAmt: 1.8, disc: 0, mrp: 56.80 },
//   { name: "Band-Aid Pack", batch: "BA123N", rate: 15.00, qty: 20, exp: "12/29", type: "First Aid", category: "Consumables", stock: 300, rack: "S9", tax: 2.0, taxAmt: 4.0, disc: 5, mrp: 19.00 },
//   { name: "Dettol Antiseptic", batch: "DA456O", rate: 85.00, qty: 2, exp: "03/28", type: "Antiseptic", category: "Liquids", stock: 25, rack: "R3", tax: 8.0, taxAmt: 1.6, disc: 0, mrp: 86.60 },
// ];

// const ViewInvoiceModal = ({
//   open,
//   onClose,
//   bill,
//   mode = "view",
//   onSave,
//   onDelete,
//   onPrint,
// }) => {
//   console.log("🔍 ViewInvoiceModal render:", { open, mode, bill: !!bill });

//   const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
//   const isEdit = mode === "edit";

//   // --- DYNAMIC SIZING (matching PurchaseTable) ---
//   const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
//   const headerTextSize = sidebarExpanded ? "text-[10px]" : "text-xs";
//   const pySize = sidebarExpanded ? "py-2" : "py-3";
//   const pxSize = sidebarExpanded ? "px-2" : "px-4";
//   const iconSize = sidebarExpanded ? 14 : 16;

//   const initialBill = useMemo(() => {
//     const baseBill = bill || {};
//     return {
//       billNo: baseBill.billNo || baseBill.purchaseId || "123456",
//       billedBy: baseBill.billedBy || baseBill.supplierName || "Amith",
//       date: baseBill.date || baseBill.purchaseDate || "12/04/25",
//       time: baseBill.time || "12:35 PM",
//       // 🎯 USE DUMMY DATA IF NO ITEMS PROVIDED
//       items: Array.isArray(baseBill.items) && baseBill.items.length > 0 
//         ? baseBill.items 
//         : DUMMY_ITEMS,
//       customer: {
//         id: baseBill.customer?.id || baseBill.supplierId || "123564",
//         name: baseBill.customer?.name || baseBill.supplierName || "Zyan Mediacls",
//         phone: baseBill.customer?.phone || baseBill.contact || "9845349642",
//         docName: baseBill.customer?.docName || "Smitha Joseph",
//         payment: baseBill.customer?.payment || "Cash",
//         eway: baseBill.customer?.eway || baseBill.eway || "1257576",
//         address: baseBill.customer?.address || "Bank Road, Super bazar complex, ernakulam",
//       },
//       summary: {
//         subTotal: baseBill.summary?.subTotal || 0,
//         sgst: baseBill.summary?.sgst || 0,
//         cgst: baseBill.summary?.cgst || 0,
//         total: baseBill.summary?.total || 0,
//       },
//     };
//   }, [bill]);

//   const [editableBill, setEditableBill] = useState(initialBill);

//   useEffect(() => {
//     if (open && bill) {
//       setEditableBill(initialBill);
//     }
//   }, [open, bill, initialBill]);

//   const derivedSummary = useMemo(() => {
//     const items = editableBill.items || [];
//     let subTotal = 0;
//     let sgst = 0;
//     let cgst = 0;

//     items.forEach((it) => {
//       const qty = Number(it.qty) || 0;
//       const rate = Number(it.rate) || 0;
//       const lineTotal = qty * rate;
//       subTotal += lineTotal;

//       const taxPercent = Number(it.tax) || 0;
//       const taxAmount = (lineTotal * taxPercent) / 100;
//       sgst += taxAmount / 2;
//       cgst += taxAmount / 2;
//     });

//     const total = subTotal + sgst + cgst;
//     return {
//       subTotal: Math.round(subTotal * 100) / 100,
//       sgst: Math.round(sgst * 100) / 100,
//       cgst: Math.round(cgst * 100) / 100,
//       total: Math.round(total * 100) / 100,
//     };
//   }, [editableBill.items]);

//   const currentSummary = {
//     ...editableBill.summary,
//     ...derivedSummary,
//   };

//   if (!open) return null;

//   /* ---------- handlers ---------- */
//   const updateItemField = (index, field, value) => {
//     if (!isEdit) return;
//     setEditableBill((prev) => {
//       const items = [...(prev.items || [])];
//       items[index] = { ...items[index], [field]: value };
//       return { ...prev, items };
//     });
//   };

//   const deleteItemRow = (index) => {
//     if (!isEdit) return;
//     setEditableBill((prev) => {
//       const items = (prev.items || []).filter((_, i) => i !== index);
//       return { ...prev, items };
//     });
//   };

//   const updateCustomerField = (field, value) => {
//     if (!isEdit) return;
//     setEditableBill((prev) => ({
//       ...prev,
//       customer: { ...(prev.customer || {}), [field]: value },
//     }));
//   };

//   const handleSaveClick = () => {
//     console.log("💾 Modal: Save clicked");
//     onSave?.({
//       ...editableBill,
//       summary: currentSummary,
//     });
//   };

//   const handlePrintClick = () => {
//     console.log("🖨️ Modal: Print clicked");
//     onPrint?.(bill || editableBill);
//   };

//   const handleDeleteClick = () => {
//     console.log("🗑️ Modal: Delete clicked");
//     if (confirm(`Delete bill #${editableBill.billNo}?`)) {
//       onDelete?.(bill || editableBill);
//     }
//   };

//   return (
//     <AnimatePresence>
//       {open && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-poppins">
//           <motion.div
//             className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
//             initial="hidden"
//             animate="visible"
//             exit="hidden"
//             variants={backdropVariants}
//             onClick={onClose}
//           />

//           <motion.div
//             className="relative bg-white w-full max-w-[98vw] lg:max-w-[95vw] xl:max-w-[90vw] rounded-xl shadow-2xl flex flex-col max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-gray-200"
//             variants={panelVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             role="dialog"
//             aria-modal="true"
//           >
//             {/* HEADER - FIXED (NOT SCROLLABLE) */}
//             <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-200 shrink-0">
//               {/* Top Row - Reduced gaps */}
//               <div className="flex flex-col sm:flex-row justify-between items-start gap-1.5 sm:gap-2 mb-1.5">
//                 <div className={`flex flex-col sm:flex-row gap-1 sm:gap-2 lg:gap-4 items-start sm:items-center text-[10px] sm:${textSize} text-gray-600 flex-wrap`}>
//                   <span className="whitespace-nowrap">
//                     Billed by <strong className="text-[#000060] ml-1">{editableBill.billedBy}</strong>
//                   </span>
//                   <span className="whitespace-nowrap">
//                     Date: <strong className="text-gray-900 ml-1">{editableBill.date}</strong>
//                   </span>
//                   {editableBill.time && (
//                     <span className="whitespace-nowrap">
//                       Time: <strong className="text-gray-900 ml-1">{editableBill.time}</strong>
//                     </span>
//                   )}
//                 </div>

//                 <div className="flex items-center gap-1.5 flex-wrap">
//                   {isEdit && (
//                     <button
//                       onClick={handleSaveClick}
//                       className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#000060] text-white rounded-lg text-[10px] sm:${textSize} font-medium hover:bg-[#000050] transition-all shadow-sm hover:shadow-md`}
//                       title="Save Changes"
//                     >
//                       <Save size={iconSize} />
//                       <span className="hidden sm:inline">Save</span>
//                     </button>
//                   )}
                  
//                   <button
//                     onClick={handlePrintClick}
//                     className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#000060] text-white rounded-lg text-[10px] sm:${textSize} font-medium hover:bg-[#000050] transition-all shadow-sm hover:shadow-md`}
//                     title="Print"
//                   >
//                     <Printer size={iconSize} />
//                     <span className="hidden sm:inline">Print</span>
//                   </button>

//                   {isEdit && onDelete && (
//                     <button
//                       onClick={handleDeleteClick}
//                       className={`p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all`}
//                       title="Delete"
//                     >
//                       <Trash2 size={iconSize} />
//                     </button>
//                   )}

//                   <button
//                     onClick={onClose}
//                     className="p-1 sm:p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
//                     title="Close"
//                   >
//                     <X size={iconSize + 2} />
//                   </button>
//                 </div>
//               </div>

//               {/* Bill Number - More compact */}
//               <div className="flex items-center gap-1.5 sm:gap-2">
//                 <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Bill No:</span>
//                 <span className="font-mono text-gray-900 bg-white px-1.5 sm:px-2 py-0.5 rounded text-xs sm:text-sm font-bold border border-gray-200">
//                   #{editableBill.billNo}
//                 </span>
//               </div>
//             </div>

//             {/* BODY - SCROLLABLE (contains everything) */}
//             <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2.5 sm:py-3 custom-scrollbar bg-white">
//               {/* ITEMS TABLE - NO SCROLL, SHOWS ALL ROWS */}
//               <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 mb-2.5 sm:mb-3">
//                 <table className="w-full border-collapse">
//                   <thead className="bg-[#000060] text-white sticky top-0 z-10">
//                     <tr className={headerTextSize}>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Sl.No</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Product Name</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Batch</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Rate</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Qty</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Exp</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Type</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Category</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Stock</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Rack</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Tax%</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Tax Amt</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Dis%</th>
//                       <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>MRP</th>
//                       {isEdit && <th className={`${pxSize} ${pySize} text-center font-bold uppercase tracking-wider`}>Del</th>}
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white">
//                     {editableBill.items.length > 0 ? (
//                       editableBill.items.map((item, i) => (
//                         <tr 
//                           key={i} 
//                           className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group"
//                         >
//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-400 font-medium`}>
//                             {String(i + 1).padStart(2, '0')}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize}`}>
//                             {isEdit ? (
//                               <input
//                                 className={`w-full bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.name || ""}
//                                 onChange={(e) => updateItemField(i, "name", e.target.value)}
//                               />
//                             ) : (
//                               <span className="font-semibold text-gray-700 group-hover:text-[#000060]">
//                                 {item.name}
//                               </span>
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize}`}>
//                             {isEdit ? (
//                               <input
//                                 className={`w-full bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.batch || ""}
//                                 onChange={(e) => updateItemField(i, "batch", e.target.value)}
//                               />
//                             ) : (
//                               <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
//                                 {item.batch}
//                               </span>
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize}`}>
//                             {isEdit ? (
//                               <input
//                                 type="number"
//                                 className={`w-24 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.rate || ""}
//                                 onChange={(e) => updateItemField(i, "rate", e.target.value)}
//                               />
//                             ) : (
//                               <span className="text-gray-800 font-medium">₹ {item.rate}</span>
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize}`}>
//                             {isEdit ? (
//                               <input
//                                 type="number"
//                                 className={`w-16 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.qty || ""}
//                                 onChange={(e) => updateItemField(i, "qty", e.target.value)}
//                               />
//                             ) : (
//                               <span className="text-gray-700">{item.qty}</span>
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-500`}>
//                             {isEdit ? (
//                               <input
//                                 className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.exp || ""}
//                                 onChange={(e) => updateItemField(i, "exp", e.target.value)}
//                               />
//                             ) : (
//                               item.exp
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
//                             {isEdit ? (
//                               <input
//                                 className={`w-full bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.type || ""}
//                                 onChange={(e) => updateItemField(i, "type", e.target.value)}
//                               />
//                             ) : (
//                               item.type
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
//                             {isEdit ? (
//                               <input
//                                 className={`w-full bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.category || ""}
//                                 onChange={(e) => updateItemField(i, "category", e.target.value)}
//                               />
//                             ) : (
//                               item.category
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
//                             {isEdit ? (
//                               <input
//                                 className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.stock || ""}
//                                 onChange={(e) => updateItemField(i, "stock", e.target.value)}
//                               />
//                             ) : (
//                               item.stock
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
//                             {isEdit ? (
//                               <input
//                                 className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.rack || ""}
//                                 onChange={(e) => updateItemField(i, "rack", e.target.value)}
//                               />
//                             ) : (
//                               item.rack
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
//                             {isEdit ? (
//                               <input
//                                 type="number"
//                                 className={`w-16 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.tax || ""}
//                                 onChange={(e) => updateItemField(i, "tax", e.target.value)}
//                               />
//                             ) : (
//                               `${item.tax}%`
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
//                             {isEdit ? (
//                               <input
//                                 type="number"
//                                 className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.taxAmt || ""}
//                                 onChange={(e) => updateItemField(i, "taxAmt", e.target.value)}
//                               />
//                             ) : (
//                               item.taxAmt
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
//                             {isEdit ? (
//                               <input
//                                 type="number"
//                                 className={`w-16 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.disc || ""}
//                                 onChange={(e) => updateItemField(i, "disc", e.target.value)}
//                               />
//                             ) : (
//                               item.disc
//                             )}
//                           </td>

//                           <td className={`${textSize} ${pxSize} ${pySize}`}>
//                             {isEdit ? (
//                               <input
//                                 type="number"
//                                 className={`w-24 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
//                                 value={item.mrp || ""}
//                                 onChange={(e) => updateItemField(i, "mrp", e.target.value)}
//                               />
//                             ) : (
//                               <span className="text-gray-800 font-bold">₹ {item.mrp}</span>
//                             )}
//                           </td>

//                           {isEdit && (
//                             <td className={`${textSize} ${pxSize} ${pySize} text-center`}>
//                               <button
//                                 onClick={() => deleteItemRow(i)}
//                                 className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all"
//                                 title="Delete Row"
//                               >
//                                 <Trash2 size={iconSize} />
//                               </button>
//                             </td>
//                           )}
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan={isEdit ? 15 : 14} className={`${pxSize} py-12 text-center text-gray-400 ${textSize} italic`}>
//                           No items found
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               {/* BOTTOM SECTION */}
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3">
//                 {/* Customer Details */}
//                 <div className="lg:col-span-2 bg-gray-50 rounded-xl p-2.5 sm:p-3 shadow-sm border border-gray-200">
//                   <h3 className="text-[10px] sm:text-xs font-bold text-[#000060] uppercase tracking-wider mb-2">
//                     Customer Details
//                   </h3>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 sm:gap-x-3 gap-y-2">
//                     <InputField
//                       label="Cust ID"
//                       value={editableBill.customer.id}
//                       readOnly
//                       textSize={textSize}
//                     />
//                     <InputField
//                       label="Cust Name"
//                       value={editableBill.customer.name}
//                       editable={isEdit}
//                       onChange={(v) => updateCustomerField("name", v)}
//                       textSize={textSize}
//                     />
//                     <InputField
//                       label="Cust Ph"
//                       value={editableBill.customer.phone}
//                       editable={isEdit}
//                       onChange={(v) => updateCustomerField("phone", v)}
//                       textSize={textSize}
//                     />
//                     <InputField
//                       label="e-Way"
//                       value={editableBill.customer.eway}
//                       editable={isEdit}
//                       onChange={(v) => updateCustomerField("eway", v)}
//                       textSize={textSize}
//                     />
//                     <InputField
//                       label="Address"
//                       value={editableBill.customer.address}
//                       editable={isEdit}
//                       onChange={(v) => updateCustomerField("address", v)}
//                       fullWidth
//                       textSize={textSize}
//                     />
//                     <InputField
//                       label="Doc Name"
//                       value={editableBill.customer.docName}
//                       editable={isEdit}
//                       onChange={(v) => updateCustomerField("docName", v)}
//                       textSize={textSize}
//                     />
//                     <InputField
//                       label="Pay by"
//                       value={editableBill.customer.payment}
//                       editable={isEdit}
//                       onChange={(v) => updateCustomerField("payment", v)}
//                       textSize={textSize}
//                     />
//                   </div>
//                 </div>

//                 {/* Payment Summary */}
//                 <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3 shadow-sm border border-gray-200 flex flex-col justify-center">
//                   <h3 className="text-[10px] sm:text-xs font-bold text-[#000060] uppercase tracking-wider mb-2">
//                     Payment Summary
//                   </h3>
//                   <div className="space-y-1.5 sm:space-y-2">
//                     <SummaryRow label="Sub Total" value={currentSummary.subTotal} textSize={textSize} />
//                     <SummaryRow label="SGST" value={currentSummary.sgst} textSize={textSize} />
//                     <SummaryRow label="CGST" value={currentSummary.cgst} textSize={textSize} />
                    
//                     <div className="border-t-2 border-[#000060] pt-2 mt-1.5">
//                       <div className="flex justify-between items-center">
//                         <span className="text-xs sm:text-sm font-bold text-gray-900">Total Amount:</span>
//                         <span className="text-base sm:text-lg font-bold text-[#000060]">
//                           ₹{currentSummary.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       )}
//     </AnimatePresence>
//   );
// };

// /* Helper Components */
// const InputField = ({ label, value, editable, onChange, readOnly, fullWidth, textSize }) => (
//   <div className={fullWidth ? "sm:col-span-2" : ""}>
//     <label className="block text-[9px] sm:text-[10px] text-gray-600 font-semibold mb-0.5 uppercase tracking-wide">
//       {label}
//     </label>
//     {editable && !readOnly ? (
//       <input
//         type="text"
//         className={`w-full px-2 py-1 border border-gray-300 rounded-lg ${textSize} text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent transition-all`}
//         value={value || ""}
//         onChange={(e) => onChange(e.target.value)}
//       />
//     ) : (
//       <div className={`w-full px-2 py-1 border border-gray-200 rounded-lg ${textSize} text-gray-700 bg-white font-medium`}>
//         {value || "-"}
//       </div>
//     )}
//   </div>
// );

// const SummaryRow = ({ label, value, textSize }) => (
//   <div className="flex justify-between items-center">
//     <span className={`${textSize} text-gray-700 font-medium`}>{label}</span>
//     <span className={`${textSize} font-bold text-gray-900`}>
//       ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//     </span>
//   </div>
// );

// export default ViewInvoiceModal;


// frontend\src\pages\purchase\invoice\components\PurchaseTable.jsx



import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMenuStore } from "../../../../store/useMenuStore";

const PurchaseTable = ({
  purchases = [],
  onView,
  onEdit,
  onDelete,
  children,
  rowsPerPage = 6,
  startIndex = 0,
}) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
  const safePurchases = Array.isArray(purchases) ? purchases : [];

  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const pySize = sidebarExpanded ? "py-2" : "py-3";
  const pxSize = sidebarExpanded ? "px-2" : "px-4";

  const cellClass = `${textSize} ${pySize} ${pxSize} border-b border-gray-100 group-hover:border-blue-100 transition`;
  const headerClass = `${pxSize} py-3 h-10  text-left font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#05015A] to-[#0a0280] border-r border-blue-800 sticky top-0 z-10 whitespace-nowrap shadow-sm`;
  const emptyRowsCount = Math.max(0, rowsPerPage - safePurchases.length);

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex-1 relative overflow-auto">
        <table className="w-full border-collapse">
          <thead className={headerClass}>
            <tr className={sidebarExpanded ? "text-[10px]" : "text-xs"}>
              <th>#</th>
              <th >Supplier Name</th>
              <th>Supplier ID</th>
              <th>Purchase ID</th>
              <th>Contact</th>
              <th>Purchase Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {safePurchases.map((row, i) => {
              const serialNumber = startIndex + i + 1;
              const formattedDate = new Date(row.purchaseDate).toLocaleDateString(
                "en-IN",
                { day: "2-digit", month: "short", year: "numeric" }
              );

              return (
                <tr key={row.purchaseId} className="hover:bg-blue-50/40 group">
                  <td className={`${cellClass} text-gray-400`}>
                    {String(serialNumber).padStart(2, "0")}
                  </td>

                  <td className={cellClass}>
                    <span className="font-semibold text-gray-700">
                      {row.supplierName}
                    </span>
                  </td>

                  <td className={cellClass}>
                    <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {row.supplierId}
                    </span>
                  </td>

                  <td className={cellClass}>
                    <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {row.purchaseId}
                    </span>
                  </td>

                  <td className={`${cellClass} text-gray-500`}>
                    {row.contact}
                  </td>

                  <td className={`${cellClass} text-gray-500`}>
                    {formattedDate}
                  </td>

                  {/* ACTIONS */}
                  <td className={`${cellClass} text-center text-gray-400`}>
                    <div className="flex justify-center gap-1">
                      {/* VIEW */}
                      <button
                        onClick={() => {
                          // console.log("📋 Table: VIEW button clicked");
                          onView?.(row, "view");
                        }}
                        className="p-1.5 rounded hover:bg-blue-50 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>

                      {/* EDIT */}
                      <button
                        onClick={() => {
                          // console.log("📋 Table: EDIT button clicked");
                          onEdit?.(row, "edit");
                        }}
                        className="p-1.5 rounded hover:bg-amber-50 hover:text-amber-600"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => {
                          // console.log("📋 Table: DELETE button clicked");
                          onDelete?.(row);
                        }}
                        className="p-1.5 rounded hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {safePurchases.length === 0 && (
              <tr>
                <td colSpan={7} className="py-20 text-center text-gray-400">
                  No purchases found
                </td>
              </tr>
            )}

            {safePurchases.length > 0 &&
              emptyRowsCount > 0 &&
              Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className={`${cellClass} border-transparent`}>
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 bg-gray-50/50">
        {children}
      </div>
    </div>
  );
};

export default PurchaseTable;
