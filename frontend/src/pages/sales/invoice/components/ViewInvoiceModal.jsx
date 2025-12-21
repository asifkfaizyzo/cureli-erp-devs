// components/ViewInvoiceModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, Printer, Trash2, Calendar, Clock, User, MapPin, CreditCard, FileText } from "lucide-react";
import { useMenuStore } from "../../../../store/useMenuStore";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 25 } 
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

// 🎯 DUMMY DATA FOR TESTING
const DUMMY_ITEMS = [
  { name: "Paracetamol 500mg", batch: "E7656T", rate: 10.00, qty: 5, exp: "12/26", type: "Antibiotics", category: "Medicine", stock: 100, rack: "S8", tax: 1.5, taxAmt: 0.75, disc: "0%", mrp: 11.50 },
  { name: "Amoxicillin 250mg", batch: "A1234B", rate: 15.50, qty: 10, exp: "03/27", type: "Antibiotics", category: "Medicine", stock: 85, rack: "S5", tax: 2.0, taxAmt: 3.10, disc: "0%", mrp: 18.60 },
  { name: "Ibuprofen 400mg", batch: "IB789C", rate: 8.75, qty: 8, exp: "06/26", type: "Pain Relief", category: "Medicine", stock: 120, rack: "R2", tax: 1.2, taxAmt: 0.84, disc: "5%", mrp: 9.59 },
  { name: "Cetirizine 10mg", batch: "CT456D", rate: 5.00, qty: 15, exp: "09/27", type: "Antihistamine", category: "Medicine", stock: 200, rack: "R7", tax: 1.0, taxAmt: 0.75, disc: "0%", mrp: 5.75 },
  { name: "Metformin 500mg", batch: "MF123E", rate: 12.00, qty: 20, exp: "11/26", type: "Diabetes", category: "Medicine", stock: 90, rack: "S3", tax: 1.8, taxAmt: 4.32, disc: "10%", mrp: 16.32 },
  { name: "Omeprazole 20mg", batch: "OM987F", rate: 18.00, qty: 7, exp: "01/28", type: "Gastric", category: "Medicine", stock: 75, rack: "R9", tax: 2.5, taxAmt: 3.15, disc: "0%", mrp: 21.15 },
  { name: "Aspirin 75mg", batch: "AS654G", rate: 6.50, qty: 12, exp: "04/27", type: "Cardiovascular", category: "Medicine", stock: 150, rack: "S1", tax: 1.0, taxAmt: 0.78, disc: "0%", mrp: 7.28 },
  { name: "Vitamin D3 1000IU", batch: "VD321H", rate: 25.00, qty: 5, exp: "08/28", type: "Supplements", category: "Vitamins", stock: 60, rack: "R4", tax: 3.0, taxAmt: 3.75, disc: "15%", mrp: 28.75 },
  { name: "Calcium Tablets", batch: "CA789I", rate: 20.00, qty: 10, exp: "12/27", type: "Supplements", category: "Minerals", stock: 80, rack: "S6", tax: 2.5, taxAmt: 5.00, disc: "0%", mrp: 25.00 },
  { name: "Multivitamin Syrup", batch: "MV456J", rate: 35.00, qty: 4, exp: "05/27", type: "Supplements", category: "Syrups", stock: 45, rack: "R8", tax: 4.0, taxAmt: 5.60, disc: "5%", mrp: 40.60 },
  { name: "Cough Syrup 100ml", batch: "CS234K", rate: 45.00, qty: 6, exp: "02/27", type: "Respiratory", category: "Syrups", stock: 55, rack: "R6", tax: 5.0, taxAmt: 13.50, disc: "0%", mrp: 58.50 },
  { name: "Antiseptic Cream", batch: "AC567L", rate: 30.00, qty: 8, exp: "07/28", type: "Topical", category: "Ointments", stock: 70, rack: "S2", tax: 3.5, taxAmt: 8.40, disc: "10%", mrp: 38.40 },
];

const ViewInvoiceModal = ({ 
  open, 
  onClose, 
  bill,
  mode = "view", // ✅ Add mode prop
  onSave,
  onDelete,
  onPrint,
}) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
  const isEdit = mode === "edit";

  // Dynamic Text Sizing
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const labelSize = sidebarExpanded ? "text-[10px]" : "text-xs";
  const pySize = sidebarExpanded ? "py-2" : "py-3";
  const pxSize = sidebarExpanded ? "px-2" : "px-4";
  const iconSize = sidebarExpanded ? 14 : 16;

  // 🎯 Initialize with dummy data
  const initialBill = useMemo(() => {
    if (!bill) return null;
    
    return {
      ...bill,
      items: Array.isArray(bill.items) && bill.items.length > 0 
        ? bill.items 
        : DUMMY_ITEMS,
    };
  }, [bill]);

  const [editableBill, setEditableBill] = useState(initialBill);

  useEffect(() => {
    if (open && bill) {
      setEditableBill(initialBill);
    }
  }, [open, bill, initialBill]);

  if (!open || !editableBill) return null;

  // Handlers
  const updateCustomerField = (field, value) => {
    if (!isEdit) return;
    setEditableBill((prev) => ({
      ...prev,
      customer: { ...(prev.customer || {}), [field]: value },
    }));
  };

  const handleSaveClick = () => {
    // console.log("💾 Save clicked from modal");
    onSave?.(editableBill);
  };

  const handleDeleteClick = () => {
    // console.log("🗑️ Delete clicked from modal");
    if (confirm(`Delete invoice #${editableBill.billNo}?`)) {
      onDelete?.(editableBill);
    }
  };

  const handlePrintClick = () => {
    // console.log("🖨️ Print clicked from modal");
    onPrint?.(editableBill);
  };
  
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-poppins">
          
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="relative bg-white w-full max-w-[98vw] lg:max-w-[95vw] xl:max-w-[90vw] rounded-xl shadow-2xl flex flex-col max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-gray-200"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex flex-col gap-0.5">
                 <div className="flex items-center gap-1.5 text-indigo-600 font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                    <FileText size={iconSize} />
                    <span>{isEdit ? "Edit Invoice" : "Tax Invoice"}</span>
                 </div>
                 <div className="flex items-center gap-2 sm:gap-3">
                   <h1 className="text-base sm:text-xl font-bold text-gray-900">
                      #{editableBill.billNo}
                   </h1>
                   <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] sm:text-xs font-medium border border-green-200">
                      Paid
                    </span>
                 </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {isEdit && (
                  <button 
                    onClick={handleSaveClick}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#000060] text-white rounded-lg text-[10px] sm:text-sm font-medium hover:bg-[#000050] transition-all shadow-sm"
                  >
                    <Save size={iconSize} />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                )}

                <button 
                  onClick={handlePrintClick}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-[10px] sm:text-sm font-medium hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm"
                >
                  <Printer size={iconSize} />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {isEdit && onDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={iconSize} />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1 sm:p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-colors"
                >
                  <X size={iconSize + 2} />
                </button>
              </div>
            </div>

            {/* BODY (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2.5 sm:py-3 custom-scrollbar bg-white">
              
              {/* Meta Data Bar */}
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4 text-[10px] sm:text-xs text-gray-600 bg-blue-50/50 p-2.5 sm:p-3 rounded-lg border border-blue-100">
                 <div className="flex items-center gap-1.5">
                    <User size={iconSize} className="text-blue-600" />
                    <span className="text-gray-500">Billed By:</span>
                    <span className="font-semibold text-gray-900">{editableBill.billedBy}</span>
                 </div>
                 <div className="w-px h-3 bg-blue-200 hidden sm:block"></div>
                 <div className="flex items-center gap-1.5">
                    <Calendar size={iconSize} className="text-blue-600" />
                    <span className="text-gray-500">Date:</span>
                    <span className="font-semibold text-gray-900">{editableBill.date}</span>
                 </div>
                 <div className="w-px h-3 bg-blue-200 hidden sm:block"></div>
                 <div className="flex items-center gap-1.5">
                    <Clock size={iconSize} className="text-blue-600" />
                    <span className="text-gray-500">Time:</span>
                    <span className="font-semibold text-gray-900">{editableBill.time}</span>
                 </div>
              </div>

              {/* ITEMS TABLE */}
              <div className="border rounded-lg overflow-hidden mb-2.5 sm:mb-3 shadow-sm ring-1 ring-gray-100">
                <table className={`w-full text-left border-collapse ${textSize}`}>
                  <thead className="bg-[#000060] text-white sticky top-0 z-10">
                    <tr className={labelSize}>
                      {["#", "Item Name", "Batch", "Rate", "Qty", "Exp", "Type", "Cat.", "Stk", "Rack", "Tax%", "Tax Amt", "Disc%", "MRP"].map((h, i) => (
                        <th key={i} className={`${pxSize} ${pySize} whitespace-nowrap font-bold uppercase tracking-wider`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {editableBill.items.length > 0 ? (
                      editableBill.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group">
                          <td className={`${pxSize} ${pySize} text-gray-400 font-medium`}>
                            {String(i + 1).padStart(2, '0')}
                          </td>
                          <td className={`${pxSize} ${pySize} font-semibold text-gray-700 group-hover:text-[#000060]`}>
                            {item.name}
                          </td>
                          <td className={`${pxSize} ${pySize}`}>
                            <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                              {item.batch}
                            </span>
                          </td>
                          <td className={`${pxSize} ${pySize} text-gray-800 font-medium`}>₹{item.rate}</td>
                          <td className={`${pxSize} ${pySize} font-semibold text-blue-600`}>{item.qty}</td>
                          <td className={`${pxSize} ${pySize} text-red-500 text-[10px]`}>{item.exp}</td>
                          <td className={`${pxSize} ${pySize} text-gray-500`}>{item.type}</td>
                          <td className={`${pxSize} ${pySize} text-gray-500`}>{item.category}</td>
                          <td className={`${pxSize} ${pySize} text-gray-500`}>{item.stock}</td>
                          <td className={`${pxSize} ${pySize} text-gray-500`}>{item.rack}</td>
                          <td className={`${pxSize} ${pySize} text-gray-500`}>{item.tax}%</td>
                          <td className={`${pxSize} ${pySize} text-gray-500`}>{item.taxAmt}</td>
                          <td className={`${pxSize} ${pySize} text-green-600`}>{item.disc}</td>
                          <td className={`${pxSize} ${pySize} font-bold text-gray-900`}>₹{item.mrp}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={14} className={`${pxSize} py-12 text-center text-gray-400 italic text-sm`}>
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* FOOTER INFO GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3">
                
                {/* Customer Details */}
                <div className="lg:col-span-2 bg-gray-50 rounded-xl p-2.5 sm:p-3 border border-gray-200">
                  <h3 className="text-[10px] sm:text-xs font-bold text-[#000060] uppercase mb-2 flex items-center gap-1.5">
                    <User size={iconSize} /> Customer Details
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2.5 sm:gap-x-3 gap-y-2">
                    <InputField 
                      label="Customer ID" 
                      value={editableBill.customer?.id} 
                      readOnly 
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField 
                      label="Name" 
                      value={editableBill.customer?.name} 
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("name", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField 
                      label="Phone" 
                      value={editableBill.customer?.phone} 
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("phone", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField 
                      label="Doctor" 
                      value={editableBill.customer?.docName} 
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("docName", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField 
                      label="Payment Mode" 
                      value={editableBill.customer?.payment} 
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("payment", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField 
                      label="E-Way Bill" 
                      value={editableBill.customer?.eway || "-"} 
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("eway", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 mt-1 pt-1.5 border-t border-gray-200">
                      <div className="flex gap-1.5 items-start text-gray-600">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        {isEdit ? (
                          <textarea
                            className="flex-1 text-[10px] sm:text-xs leading-snug bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#000060]"
                            value={editableBill.customer?.address || ""}
                            onChange={(e) => updateCustomerField("address", e.target.value)}
                            rows={2}
                          />
                        ) : (
                          <span className="text-[10px] sm:text-xs leading-snug">
                            {editableBill.customer?.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3 border border-gray-200 shadow-sm flex flex-col justify-center">
                  <h3 className="text-[10px] sm:text-xs font-bold text-[#000060] uppercase mb-2 flex items-center gap-1.5">
                    <CreditCard size={iconSize} /> Payment Summary
                  </h3>
                  
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Sub Total</span>
                      <span className="font-medium text-gray-900">₹{editableBill.summary?.subTotal?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>SGST</span>
                      <span className="font-medium text-gray-900">₹{editableBill.summary?.sgst}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>CGST</span>
                      <span className="font-medium text-gray-900">₹{editableBill.summary?.cgst}</span>
                    </div>
                    
                    <div className="border-t-2 border-[#000060] pt-2 mt-1.5"></div>
                    
                    <div className="flex justify-between items-end">
                      <span className="text-xs sm:text-sm font-bold text-gray-900">Total</span>
                      <span className="text-base sm:text-lg font-bold text-[#000060]">
                        ₹{editableBill.summary?.total?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Helper Component
const InputField = ({ label, value, editable, onChange, readOnly, textSize, labelSize }) => (
  <div className="flex flex-col">
    <span className={`${labelSize} uppercase text-gray-400 font-semibold tracking-wider`}>{label}</span>
    {editable && !readOnly ? (
      <input
        type="text"
        className={`mt-0.5 ${textSize} font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent transition-all`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <span className={`${textSize} font-medium text-gray-800 mt-0.5`}>{value || "-"}</span>
    )}
  </div>
);

export default ViewInvoiceModal;
