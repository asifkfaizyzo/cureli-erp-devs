// src/components/Supplier/SupplierModal.jsx - FULLY UPDATED
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, User, CreditCard, Users, Search } from "lucide-react";
import { toast } from 'react-toastify';
import { useMenuStore } from "../../../store/useMenuStore";

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

const Field = ({ label, value, editable, onChange, textSize, labelSize, required, type = "text" }) => (
  <div className="flex flex-col">
    <span className={`${labelSize} uppercase text-gray-400 font-semibold tracking-wider mb-0.5`}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </span>
    {editable ? (
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        className={`${textSize} font-medium text-gray-800 bg-white border ${required && !value ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-300'} rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#05015A] focus:border-transparent transition-all`}
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
  const [filterSuppliers, setFilterSuppliers] = useState("");
  const sidebarExpanded = useMenuStore?.((s) => s.sidebarExpanded) || false;

  // ✅ COMPLETE SUPPLIERS LIST
  const existingSuppliers = [
    { 
      id: 1, 
      name: "ABC Pharma Ltd", 
      gst: "27AABCA1234C1Z5", 
      address: "Industrial Area, Phase-II, New Delhi - 110020",
      officePhone: "011-23456789",
      personalPhone: "9876543210",
      email: "accounts@abcpharma.com"
    },
    { 
      id: 2, 
      name: "XYZ Medicals", 
      gst: "07AAFCX5678D1Z2", 
      address: "Andheri East, Mumbai - 400059",
      officePhone: "022-76543210",
      personalPhone: "8765432109",
      email: "sales@xyzmedicals.com"
    },
    { 
      id: 3, 
      name: "PQR Distributors", 
      gst: "29AAPCP5678R1Z3", 
      address: "HSR Layout, Bangalore - 560102",
      officePhone: "080-12345678",
      personalPhone: "9876543201",
      email: "info@pqrdist.com"
    },
    { 
      id: 4, 
      name: "LMN Healthcare", 
      gst: "03AABCL1234M1Z4", 
      address: "Sector 18, Chandigarh - 160018",
      officePhone: "0172-9876543",
      personalPhone: "9988776655",
      email: "contact@lmnhealthcare.com"
    },
  ];

  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const labelSize = sidebarExpanded ? "text-[10px]" : "text-xs";
  const iconSize = sidebarExpanded ? 14 : 16;

  useEffect(() => {
    setFormData(supplier || {});
    setActiveTab("general");
  }, [supplier]);

  if (!open || !supplier) return null;

  const handleSave = () => {
    try {
      if (!formData.name?.trim()) {
        toast.warn("Supplier name is required!", { autoClose: 3000 });
        setActiveTab("general");
        return;
      }
      if (!formData.officePhone?.trim()) {
        toast.warn("Office phone is required!", { autoClose: 3000 });
        setActiveTab("contact");
        return;
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.warn("Please enter a valid email address!", { autoClose: 3000 });
        setActiveTab("contact");
        return;
      }
      if (!formData.address?.trim()) {
        toast.warn("Address is required!", { autoClose: 3000 });
        setActiveTab("general");
        return;
      }
      onSave(formData);
    } catch (error) {
      toast.error("Failed to save supplier. Please try again.");
      console.error("Save error:", error);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: User },
    { id: "contact", label: "Contact", icon: User },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "existing", label: "Suppliers List", icon: Users },
  ];

  const filteredSuppliers = existingSuppliers.filter(s => 
    s.name.toLowerCase().includes(filterSuppliers.toLowerCase()) ||
    s.gst.toLowerCase().includes(filterSuppliers.toLowerCase()) ||
    s.address.toLowerCase().includes(filterSuppliers.toLowerCase())
  );

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
                  <span>{isEdit ? "Edit Supplier" : "New Supplier"}</span>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#05015A] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#060142] transition-all shadow-sm"
                  >
                    <Save size={iconSize} />
                    <span>Save Changes</span>
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

            {/* TABS */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex px-4 gap-2 sm:gap-6 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 relative
                        ${isActive ? "text-[#05015A] font-semibold" : "text-gray-500 hover:text-gray-800"}
                      `}
                    >
                      <Icon size={iconSize} className={isActive ? "text-[#05015A]" : ""} />
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#05015A]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 custom-scrollbar bg-white">
              {/* GENERAL TAB */}
              {activeTab === "general" && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
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
                      label="GST Number" 
                      value={formData.gst} 
                      editable={isEdit} 
                      onChange={(v) => setFormData({ ...formData, gst: v })} 
                      textSize={textSize} 
                      labelSize={labelSize} 
                    />
                  </div>
                  <Field 
                    label="Address" 
                    value={formData.address} 
                    editable={isEdit} 
                    onChange={(v) => setFormData({ ...formData, address: v })} 
                    textSize={textSize} 
                    labelSize={labelSize} 
                    required 
                  />
                </motion.div>
              )}

              {/* CONTACT TAB */}
              {activeTab === "contact" && (
                <motion.div initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Field 
                      label="Office Phone" 
                      value={formData.officePhone} 
                      editable={isEdit} 
                      onChange={(v) => setFormData({ ...formData, officePhone: v })} 
                      textSize={textSize} 
                      labelSize={labelSize} 
                      required 
                      type="tel"
                    />
                    <Field 
                      label="Personal Phone" 
                      value={formData.personalPhone} 
                      editable={isEdit} 
                      onChange={(v) => setFormData({ ...formData, personalPhone: v })} 
                      textSize={textSize} 
                      labelSize={labelSize} 
                      type="tel"
                    />
                  </div>
                  <Field 
                    label="Email Address" 
                    value={formData.email} 
                    editable={isEdit} 
                    onChange={(v) => setFormData({ ...formData, email: v })} 
                    textSize={textSize} 
                    labelSize={labelSize} 
                    type="email"
                  />
                </motion.div>
              )}

              {/* PAYMENT TAB */}
              {activeTab === "payment" && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <Field label="Bank Name" value={formData.bankName} editable={isEdit} onChange={(v) => setFormData({ ...formData, bankName: v })} textSize={textSize} labelSize={labelSize} />
                      <Field label="Branch Name" value={formData.branchName} editable={isEdit} onChange={(v) => setFormData({ ...formData, branchName: v })} textSize={textSize} labelSize={labelSize} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Field label="Account Number" value={formData.accountNo} editable={isEdit} onChange={(v) => setFormData({ ...formData, accountNo: v })} textSize={textSize} labelSize={labelSize} />
                    <Field label="Account Type" value={formData.accountType} editable={isEdit} onChange={(v) => setFormData({ ...formData, accountType: v })} textSize={textSize} labelSize={labelSize} />
                  </div>
                  <Field label="IFSC / SWIFT Code" value={formData.ifsc} editable={isEdit} onChange={(v) => setFormData({ ...formData, ifsc: v })} textSize={textSize} labelSize={labelSize} />
                </motion.div>
              )}

              {/* EXISTING SUPPLIERS TAB */}
              {activeTab === "existing" && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="relative">
                    <div className="relative">
                      <Field 
                        label="Search Suppliers" 
                        value={filterSuppliers} 
                        editable={true} 
                        onChange={(v) => setFilterSuppliers(v)} 
                        textSize={textSize} 
                        labelSize={labelSize} 
                      />
                      <Search className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredSuppliers.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm font-medium">{filterSuppliers ? "No matching suppliers found" : "No suppliers available"}</p>
                      </div>
                    ) : (
                      filteredSuppliers.map((sup) => (
                        <motion.div
                          key={sup.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all group bg-white shadow-sm hover:shadow-md"
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            setFormData({
                              name: sup.name,
                              gst: sup.gst,
                              address: sup.address,
                              officePhone: sup.officePhone,
                              personalPhone: sup.personalPhone,
                              email: sup.email,
                              bankName: sup.bankName || "",
                              branchName: sup.branchName || "",
                              accountNo: sup.accountNo || "",
                              accountType: sup.accountType || "",
                              ifsc: sup.ifsc || ""
                            });
                            setActiveTab("general");
                            toast.success("Supplier selected successfully!");
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[#05015A] text-sm truncate">{sup.name}</h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full font-mono">GST: {sup.gst}</span>
                                <span className="px-1 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{sup.officePhone}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">{sup.address}</p>
                            </div>
                            <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                              Select →
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
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
