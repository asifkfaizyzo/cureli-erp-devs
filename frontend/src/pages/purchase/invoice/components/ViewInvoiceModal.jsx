// frontend\src\pages\purchase\invoice\components\ViewInvoiceModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, Printer, Trash2 } from "lucide-react";
import { useMenuStore } from "../../../../store/useMenuStore";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

const ViewInvoiceModal = ({
  open,
  onClose,
  bill,
  mode = "view",
  onSave,
  onDelete,
  onPrint,
}) => {
  console.log("🔍 ViewInvoiceModal render:", { open, mode, bill: !!bill });

  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
  const isEdit = mode === "edit";

  // --- DYNAMIC SIZING (matching PurchaseTable) ---
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const headerTextSize = sidebarExpanded ? "text-[10px]" : "text-xs";
  const pySize = sidebarExpanded ? "py-2" : "py-3";
  const pxSize = sidebarExpanded ? "px-2" : "px-4";
  const iconSize = sidebarExpanded ? 14 : 16;

  const initialBill = useMemo(() => {
    const baseBill = bill || {};
    return {
      billNo: baseBill.billNo || baseBill.purchaseId || "-",
      billedBy: baseBill.billedBy || baseBill.supplierName || "Unknown",
      date: baseBill.date || baseBill.purchaseDate || "",
      time: baseBill.time || "",
      items: Array.isArray(baseBill.items) ? baseBill.items : [],
      customer: {
        id: baseBill.customer?.id || baseBill.supplierId || "",
        name: baseBill.customer?.name || baseBill.supplierName || "",
        phone: baseBill.customer?.phone || baseBill.contact || "",
        docName: baseBill.customer?.docName || "",
        payment: baseBill.customer?.payment || "",
        eway: baseBill.customer?.eway || baseBill.eway || "",
        address: baseBill.customer?.address || "",
      },
      summary: {
        subTotal: baseBill.summary?.subTotal || 0,
        sgst: baseBill.summary?.sgst || 0,
        cgst: baseBill.summary?.cgst || 0,
        total: baseBill.summary?.total || 0,
      },
    };
  }, [bill]);

  const [editableBill, setEditableBill] = useState(initialBill);

  useEffect(() => {
    if (open && bill) {
      setEditableBill(initialBill);
    }
  }, [open, bill, initialBill]);

  const derivedSummary = useMemo(() => {
    const items = editableBill.items || [];
    let subTotal = 0;
    let sgst = 0;
    let cgst = 0;

    items.forEach((it) => {
      const qty = Number(it.qty) || 0;
      const rate = Number(it.rate) || 0;
      const lineTotal = qty * rate;
      subTotal += lineTotal;

      const taxPercent = Number(it.tax) || 0;
      const taxAmount = (lineTotal * taxPercent) / 100;
      sgst += taxAmount / 2;
      cgst += taxAmount / 2;
    });

    const total = subTotal + sgst + cgst;
    return {
      subTotal: Math.round(subTotal),
      sgst: Math.round(sgst),
      cgst: Math.round(cgst),
      total: Math.round(total),
    };
  }, [editableBill.items]);

  const currentSummary = {
    ...editableBill.summary,
    ...derivedSummary,
  };

  if (!open) return null;

  /* ---------- handlers ---------- */
  const updateItemField = (index, field, value) => {
    if (!isEdit) return;
    setEditableBill((prev) => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const deleteItemRow = (index) => {
    if (!isEdit) return;
    setEditableBill((prev) => {
      const items = (prev.items || []).filter((_, i) => i !== index);
      return { ...prev, items };
    });
  };

  const updateCustomerField = (field, value) => {
    if (!isEdit) return;
    setEditableBill((prev) => ({
      ...prev,
      customer: { ...(prev.customer || {}), [field]: value },
    }));
  };

  const handleSaveClick = () => {
    console.log("💾 Modal: Save clicked");
    onSave?.({
      ...editableBill,
      summary: currentSummary,
    });
  };

  const handlePrintClick = () => {
    console.log("🖨️ Modal: Print clicked");
    onPrint?.(bill || editableBill);
  };

  const handleDeleteClick = () => {
    console.log("🗑️ Modal: Delete clicked");
    if (confirm(`Delete bill #${editableBill.billNo}?`)) {
      onDelete?.(bill || editableBill);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-poppins">
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
          />

          <motion.div
            className="relative bg-white w-full max-w-[98vw] lg:max-w-[95vw] xl:max-w-[90vw] rounded-xl shadow-2xl flex flex-col max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-gray-200"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {/* HEADER - FIXED (NOT SCROLLABLE) */}
            <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-200 shrink-0">
              {/* Top Row - Reduced gaps */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-1.5 sm:gap-2 mb-1.5">
                <div className={`flex flex-col sm:flex-row gap-1 sm:gap-2 lg:gap-4 items-start sm:items-center text-[10px] sm:${textSize} text-gray-600 flex-wrap`}>
                  <span className="whitespace-nowrap">
                    Billed by <strong className="text-[#000060] ml-1">{editableBill.billedBy}</strong>
                  </span>
                  <span className="whitespace-nowrap">
                    Date: <strong className="text-gray-900 ml-1">{editableBill.date}</strong>
                  </span>
                  {editableBill.time && (
                    <span className="whitespace-nowrap">
                      Time: <strong className="text-gray-900 ml-1">{editableBill.time}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {isEdit && (
                    <button
                      onClick={handleSaveClick}
                      className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#000060] text-white rounded-lg text-[10px] sm:${textSize} font-medium hover:bg-[#000050] transition-all shadow-sm hover:shadow-md`}
                      title="Save Changes"
                    >
                      <Save size={iconSize} />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handlePrintClick}
                    className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#000060] text-white rounded-lg text-[10px] sm:${textSize} font-medium hover:bg-[#000050] transition-all shadow-sm hover:shadow-md`}
                    title="Print"
                  >
                    <Printer size={iconSize} />
                    <span className="hidden sm:inline">Print</span>
                  </button>

                  {isEdit && onDelete && (
                    <button
                      onClick={handleDeleteClick}
                      className={`p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all`}
                      title="Delete"
                    >
                      <Trash2 size={iconSize} />
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="p-1 sm:p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                    title="Close"
                  >
                    <X size={iconSize + 2} />
                  </button>
                </div>
              </div>

              {/* Bill Number - More compact */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Bill No:</span>
                <span className="font-mono text-gray-900 bg-white px-1.5 sm:px-2 py-0.5 rounded text-xs sm:text-sm font-bold border border-gray-200">
                  #{editableBill.billNo}
                </span>
              </div>
            </div>

            {/* BODY - SCROLLABLE (contains everything) */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2.5 sm:py-3 custom-scrollbar bg-white">
              {/* ITEMS TABLE - NO SCROLL, SHOWS ALL ROWS */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 mb-2.5 sm:mb-3">
                <table className="w-full border-collapse">
                  <thead className="bg-[#000060] text-white sticky top-0 z-10">
                    <tr className={headerTextSize}>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Sl.No</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Product Name</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Batch</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Rate</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Qty</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Exp</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Type</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Category</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Stock</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Rack</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Tax%</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Tax Amt</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>Dis%</th>
                      <th className={`${pxSize} ${pySize} text-left font-bold uppercase tracking-wider whitespace-nowrap`}>MRP</th>
                      {isEdit && <th className={`${pxSize} ${pySize} text-center font-bold uppercase tracking-wider`}>Del</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {editableBill.items.length > 0 ? (
                      editableBill.items.map((item, i) => (
                        <tr 
                          key={i} 
                          className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group"
                        >
                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-400 font-medium`}>
                            {String(i + 1).padStart(2, '0')}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                className={`w-full bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.name || ""}
                                onChange={(e) => updateItemField(i, "name", e.target.value)}
                              />
                            ) : (
                              <span className="font-semibold text-gray-700 group-hover:text-[#000060]">
                                {item.name}
                              </span>
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                className={`w-full bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.batch || ""}
                                onChange={(e) => updateItemField(i, "batch", e.target.value)}
                              />
                            ) : (
                              <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                                {item.batch}
                              </span>
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-24 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.rate || ""}
                                onChange={(e) => updateItemField(i, "rate", e.target.value)}
                              />
                            ) : (
                              <span className="text-gray-800 font-medium">₹{item.rate}</span>
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-16 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.qty || ""}
                                onChange={(e) => updateItemField(i, "qty", e.target.value)}
                              />
                            ) : (
                              <span className="text-gray-700">{item.qty}</span>
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-500`}>
                            {isEdit ? (
                              <input
                                className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.exp || ""}
                                onChange={(e) => updateItemField(i, "exp", e.target.value)}
                              />
                            ) : (
                              item.exp
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
                            {isEdit ? (
                              <input
                                className={`w-full bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.type || ""}
                                onChange={(e) => updateItemField(i, "type", e.target.value)}
                              />
                            ) : (
                              item.type
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
                            {isEdit ? (
                              <input
                                className={`w-full bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.category || ""}
                                onChange={(e) => updateItemField(i, "category", e.target.value)}
                              />
                            ) : (
                              item.category
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
                            {isEdit ? (
                              <input
                                className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.stock || ""}
                                onChange={(e) => updateItemField(i, "stock", e.target.value)}
                              />
                            ) : (
                              item.stock
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
                            {isEdit ? (
                              <input
                                className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.rack || ""}
                                onChange={(e) => updateItemField(i, "rack", e.target.value)}
                              />
                            ) : (
                              item.rack
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-16 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.tax || ""}
                                onChange={(e) => updateItemField(i, "tax", e.target.value)}
                              />
                            ) : (
                              `${item.tax}%`
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.taxAmt || ""}
                                onChange={(e) => updateItemField(i, "taxAmt", e.target.value)}
                              />
                            ) : (
                              item.taxAmt
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize} text-gray-700`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-16 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.disc || ""}
                                onChange={(e) => updateItemField(i, "disc", e.target.value)}
                              />
                            ) : (
                              item.disc
                            )}
                          </td>

                          <td className={`${textSize} ${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-24 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.mrp || ""}
                                onChange={(e) => updateItemField(i, "mrp", e.target.value)}
                              />
                            ) : (
                              <span className="text-gray-800 font-bold">₹{item.mrp}</span>
                            )}
                          </td>

                          {isEdit && (
                            <td className={`${textSize} ${pxSize} ${pySize} text-center`}>
                              <button
                                onClick={() => deleteItemRow(i)}
                                className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all"
                                title="Delete Row"
                              >
                                <Trash2 size={iconSize} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isEdit ? 15 : 14} className={`${pxSize} py-12 text-center text-gray-400 ${textSize} italic`}>
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* BOTTOM SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {/* Customer Details */}
                <div className="lg:col-span-2 bg-gray-50 rounded-xl p-2.5 sm:p-3 shadow-sm border border-gray-200">
                  <h3 className="text-[10px] sm:text-xs font-bold text-[#000060] uppercase tracking-wider mb-2">
                    Customer Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 sm:gap-x-3 gap-y-2">
                    <InputField
                      label="Cust ID"
                      value={editableBill.customer.id}
                      readOnly
                      textSize={textSize}
                    />
                    <InputField
                      label="Cust Name"
                      value={editableBill.customer.name}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("name", v)}
                      textSize={textSize}
                    />
                    <InputField
                      label="Cust Ph"
                      value={editableBill.customer.phone}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("phone", v)}
                      textSize={textSize}
                    />
                    <InputField
                      label="e-Way"
                      value={editableBill.customer.eway}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("eway", v)}
                      textSize={textSize}
                    />
                    <InputField
                      label="Address"
                      value={editableBill.customer.address}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("address", v)}
                      fullWidth
                      textSize={textSize}
                    />
                    <InputField
                      label="Doc Name"
                      value={editableBill.customer.docName}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("docName", v)}
                      textSize={textSize}
                    />
                    <InputField
                      label="Pay by"
                      value={editableBill.customer.payment}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("payment", v)}
                      textSize={textSize}
                    />
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3 shadow-sm border border-gray-200 flex flex-col justify-center">
                  <h3 className="text-[10px] sm:text-xs font-bold text-[#000060] uppercase tracking-wider mb-2">
                    Payment Summary
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <SummaryRow label="Sub Total" value={currentSummary.subTotal} textSize={textSize} />
                    <SummaryRow label="SGST" value={currentSummary.sgst} textSize={textSize} />
                    <SummaryRow label="CGST" value={currentSummary.cgst} textSize={textSize} />
                    
                    <div className="border-t-2 border-[#000060] pt-2 mt-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">Total Amount:</span>
                        <span className="text-base sm:text-lg font-bold text-[#000060]">
                          ₹{currentSummary.total.toLocaleString('en-IN')}
                        </span>
                      </div>
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

/* Helper Components */
const InputField = ({ label, value, editable, onChange, readOnly, fullWidth, textSize }) => (
  <div className={fullWidth ? "sm:col-span-2" : ""}>
    <label className="block text-[9px] sm:text-[10px] text-gray-600 font-semibold mb-0.5 uppercase tracking-wide">
      {label}
    </label>
    {editable && !readOnly ? (
      <input
        type="text"
        className={`w-full px-2 py-1 border border-gray-300 rounded-lg ${textSize} text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent transition-all`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <div className={`w-full px-2 py-1 border border-gray-200 rounded-lg ${textSize} text-gray-700 bg-white font-medium`}>
        {value || "-"}
      </div>
    )}
  </div>
);

const SummaryRow = ({ label, value, textSize }) => (
  <div className="flex justify-between items-center">
    <span className={`${textSize} text-gray-700 font-medium`}>{label}</span>
    <span className={`${textSize} font-bold text-gray-900`}>
      ₹{value.toLocaleString('en-IN')}
    </span>
  </div>
);

export default ViewInvoiceModal;





