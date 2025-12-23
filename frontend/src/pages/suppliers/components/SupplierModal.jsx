// src/components/Supplier/SupplierModal.jsx
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, User, CreditCard } from "lucide-react";
import { toast } from 'react-toastify';
import { useMenuStore } from "../../../store/useMenuStore";

// Animation Variants
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

const Field = ({ label, value, editable, onChange, textSize, labelSize, required }) => (
  <div className="flex flex-col">
    <span className={`${labelSize} uppercase text-gray-400 font-semibold tracking-wider mb-0.5`}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </span>
    {editable ? (
      <input
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        className={`${textSize} font-medium text-gray-800 bg-white border ${required && !value ? 'border-red-300' : 'border-gray-300'} rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#000060] focus:border-transparent transition-all`}
      />
    ) : (
      <span className={`${textSize} font-medium text-gray-800 py-1.5`}>{value || "-"}</span>
    )}
  </div>
);

const SupplierModal = ({ open, mode, supplier, onClose, onSave }) => {
  const isEdit = mode === "edit";
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({});
  const sidebarExpanded = useMenuStore?.((s) => s.sidebarExpanded) || false;

  // Dynamic Text Sizing
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const labelSize = sidebarExpanded ? "text-[10px]" : "text-xs";
  const iconSize = sidebarExpanded ? 14 : 16;

  useEffect(() => {
    setFormData(supplier || {});
    setActiveTab("general");
  }, [supplier]);

  if (!open || !supplier) return null;

  // ✅ VALIDATION & SAVE HANDLER
  const handleSave = () => {
    try {
      // Required field validation
      if (!formData.name?.trim()) {
        toast.warn("Supplier name is required!", { autoClose: 3000 });
        setActiveTab("general");
        return;
      }

      if (!formData.contact?.trim()) {
        toast.warn("Contact number is required!", { autoClose: 3000 });
        setActiveTab("general");
        return;
      }

      // Email validation (if provided)
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.warn("Please enter a valid email address!", { autoClose: 3000 });
        setActiveTab("general");
        return;
      }

      // Call parent save handler (parent will show success toast)
      onSave(formData);
    } catch (error) {
      toast.error("Failed to save supplier. Please try again.");
      console.error("Save error:", error);
    }
  };

  const tabs = [
    { id: "general", label: "General Information", icon: User },
    { id: "payment", label: "Payment Details", icon: CreditCard },
  ];

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
            className="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex flex-col gap-0.5">
                 <div className="flex items-center gap-1.5 text-indigo-600 font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                    <User size={iconSize} />
                    <span>{isEdit ? "Edit Supplier" : "Supplier Details"}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                     {formData.name || "New Supplier"}
                   </h1>
                   {supplier.supplierId !== "NEW" && (
                     <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-mono border border-gray-200">
                        ID: {supplier.supplierId}
                     </span>
                   )}
                 </div>
              </div>

              <div className="flex items-center gap-2">
                {isEdit && (
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000060] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#000050] transition-all shadow-sm"
                  >
                    <Save size={iconSize} />
                    <span>Save</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-colors"
                >
                  <X size={iconSize + 2} />
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex px-4 gap-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 py-3 text-xs sm:text-sm font-medium transition-all relative
                        ${isActive ? "text-[#000060]" : "text-gray-500 hover:text-gray-800"}
                      `}
                    >
                      <Icon size={iconSize} />
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#000060]" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 custom-scrollbar bg-white">
              
              {/* GENERAL INFORMATION TAB */}
              {activeTab === "general" && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Field 
                      label="Supplier Name" 
                      value={formData.name} 
                      editable={isEdit}
                      onChange={(v) => setFormData({ ...formData, name: v })}
                      textSize={textSize} 
                      labelSize={labelSize}
                      required
                    />

                    <Field 
                      label="Contact Number" 
                      value={formData.contact} 
                      editable={isEdit}
                      onChange={(v) => setFormData({ ...formData, contact: v })}
                      textSize={textSize} 
                      labelSize={labelSize}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Field 
                      label="Email Address" 
                      value={formData.email} 
                      editable={isEdit}
                      onChange={(v) => setFormData({ ...formData, email: v })}
                      textSize={textSize} 
                      labelSize={labelSize}
                    />

                    <Field 
                      label="GST Number" 
                      value={formData.gst} 
                      editable={isEdit}
                      onChange={(v) => setFormData({ ...formData, gst: v })}
                      textSize={textSize} 
                      labelSize={labelSize}
                    />
                  </div>

                  <Field 
                    label="Shipping Address" 
                    value={formData.shippingAddress} 
                    editable={isEdit}
                    onChange={(v) => setFormData({ ...formData, shippingAddress: v })}
                    textSize={textSize} 
                    labelSize={labelSize}
                  />

                  <Field 
                    label="Billing Address" 
                    value={formData.billingAddress} 
                    editable={isEdit}
                    onChange={(v) => setFormData({ ...formData, billingAddress: v })}
                    textSize={textSize} 
                    labelSize={labelSize}
                  />
                </motion.div>
              )}

              {/* PAYMENT DETAILS TAB */}
              {activeTab === "payment" && (
                <motion.div 
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-5"
                >
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <Field 
                        label="Bank Name" 
                        value={formData.bankName} 
                        editable={isEdit}
                        onChange={(v) => setFormData({ ...formData, bankName: v })}
                        textSize={textSize} 
                        labelSize={labelSize}
                      />

                      <Field 
                        label="Branch Name" 
                        value={formData.branchName} 
                        editable={isEdit}
                        onChange={(v) => setFormData({ ...formData, branchName: v })}
                        textSize={textSize} 
                        labelSize={labelSize}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Field 
                      label="Account Number" 
                      value={formData.accountNo} 
                      editable={isEdit}
                      onChange={(v) => setFormData({ ...formData, accountNo: v })}
                      textSize={textSize} 
                      labelSize={labelSize}
                    />

                    <Field 
                      label="Account Type" 
                      value={formData.accountType} 
                      editable={isEdit}
                      onChange={(v) => setFormData({ ...formData, accountType: v })}
                      textSize={textSize} 
                      labelSize={labelSize}
                    />
                  </div>

                  <Field 
                    label="IFSC / SWIFT Code" 
                    value={formData.ifsc} 
                    editable={isEdit}
                    onChange={(v) => setFormData({ ...formData, ifsc: v })}
                    textSize={textSize} 
                    labelSize={labelSize}
                  />
                </motion.div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SupplierModal;
