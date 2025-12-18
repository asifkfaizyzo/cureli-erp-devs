// frontend\src\pages\purchase\invoice\components\ViewInvoiceModal.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  const labelSize = sidebarExpanded ? "text-[10px]" : "text-xs";
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
                    title="Save Changes"
                  >
                    <Save size={iconSize} />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                )}

                <button
                  onClick={handlePrintClick}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-[10px] sm:text-sm font-medium hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm"
                  title="Print"
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
                  title="Close"
                >
                  <X size={iconSize + 2} />
                </button>
              </div>
            </div>

            {/* BODY - SCROLLABLE */}
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
                {editableBill.time && (
                  <>
                    <div className="w-px h-3 bg-blue-200 hidden sm:block"></div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={iconSize} className="text-blue-600" />
                      <span className="text-gray-500">Time:</span>
                      <span className="font-semibold text-gray-900">{editableBill.time}</span>
                    </div>
                  </>
                )}
              </div>

              {/* ITEMS TABLE */}
              <div className="border rounded-lg overflow-hidden mb-2.5 sm:mb-3 shadow-sm ring-1 ring-gray-100">
                <table className={`w-full text-left border-collapse ${textSize}`}>
                  <thead className="bg-[#000060] text-white sticky top-0 z-10">
                    <tr className={labelSize}>
                      {["#", "Item Name", "Batch", "Rate", "Qty", "Exp", "Type", "Cat.", "Stk", "Rack", "Tax%", "Tax Amt", "Disc%", "MRP", ...(isEdit ? ["Del"] : [])].map((h, i) => (
                        <th key={i} className={`${pxSize} ${pySize} whitespace-nowrap font-bold uppercase tracking-wider ${h === "Del" ? "text-center" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {editableBill.items.length > 0 ? (
                      editableBill.items.map((item, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group"
                        >
                          <td className={`${pxSize} ${pySize} text-gray-400 font-medium`}>
                            {String(i + 1).padStart(2, '0')}
                          </td>

                          <td className={`${pxSize} ${pySize}`}>
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

                          <td className={`${pxSize} ${pySize}`}>
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

                          <td className={`${pxSize} ${pySize}`}>
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

                          <td className={`${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-16 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.qty || ""}
                                onChange={(e) => updateItemField(i, "qty", e.target.value)}
                              />
                            ) : (
                              <span className="font-semibold text-blue-600">{item.qty}</span>
                            )}
                          </td>

                          <td className={`${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                className={`w-20 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.exp || ""}
                                onChange={(e) => updateItemField(i, "exp", e.target.value)}
                              />
                            ) : (
                              <span className="text-red-500 text-[10px]">{item.exp}</span>
                            )}
                          </td>

                          <td className={`${pxSize} ${pySize} text-gray-500`}>
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

                          <td className={`${pxSize} ${pySize} text-gray-500`}>
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

                          <td className={`${pxSize} ${pySize} text-gray-500`}>
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

                          <td className={`${pxSize} ${pySize} text-gray-500`}>
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

                          <td className={`${pxSize} ${pySize} text-gray-500`}>
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

                          <td className={`${pxSize} ${pySize} text-gray-500`}>
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

                          <td className={`${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-16 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.disc || ""}
                                onChange={(e) => updateItemField(i, "disc", e.target.value)}
                              />
                            ) : (
                              <span className="text-green-600">{item.disc}</span>
                            )}
                          </td>

                          <td className={`${pxSize} ${pySize}`}>
                            {isEdit ? (
                              <input
                                type="number"
                                className={`w-24 bg-white border border-gray-300 rounded px-2 py-1 ${textSize} focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent`}
                                value={item.mrp || ""}
                                onChange={(e) => updateItemField(i, "mrp", e.target.value)}
                              />
                            ) : (
                              <span className="font-bold text-gray-900">₹{item.mrp}</span>
                            )}
                          </td>

                          {isEdit && (
                            <td className={`${pxSize} ${pySize} text-center`}>
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
                        <td colSpan={isEdit ? 15 : 14} className={`${pxSize} py-12 text-center text-gray-400 italic text-sm`}>
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
                      value={editableBill.customer.id}
                      readOnly
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField
                      label="Name"
                      value={editableBill.customer.name}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("name", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField
                      label="Phone"
                      value={editableBill.customer.phone}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("phone", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField
                      label="Doctor"
                      value={editableBill.customer.docName}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("docName", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField
                      label="Payment Mode"
                      value={editableBill.customer.payment}
                      editable={isEdit}
                      onChange={(v) => updateCustomerField("payment", v)}
                      textSize={textSize}
                      labelSize={labelSize}
                    />
                    <InputField
                      label="E-Way Bill"
                      value={editableBill.customer.eway || "-"}
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
                            {editableBill.customer?.address || "-"}
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
                      <span className="font-medium text-gray-900">₹{currentSummary.subTotal?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>SGST</span>
                      <span className="font-medium text-gray-900">₹{currentSummary.sgst}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>CGST</span>
                      <span className="font-medium text-gray-900">₹{currentSummary.cgst}</span>
                    </div>

                    <div className="border-t-2 border-[#000060] pt-2 mt-1.5"></div>

                    <div className="flex justify-between items-end">
                      <span className="text-xs sm:text-sm font-bold text-gray-900">Total</span>
                      <span className="text-base sm:text-lg font-bold text-[#000060]">
                        ₹{currentSummary.total?.toLocaleString('en-IN')}
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

/* Helper Component */
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