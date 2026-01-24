// src/pages/inventory/components/ViewInventoryModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Save,
  Trash2,
  Package,
  Calendar,
  Truck,
  Layers,
  AlertCircle,
  Building2,
  Tag,
  DollarSign,
  MapPin,
  Hash,
  FileText,
  TrendingUp,
  Box,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useMenuStore } from "../../../store/useMenuStore";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

/* ---------------- ANIMATION VARIANTS ---------------- */
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
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/* ---------------- MAIN COMPONENT ---------------- */
const ViewInventoryModal = ({
  open,
  onClose,
  item,
  mode = "view",
  onSave,
  onDelete,
}) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
  const isEdit = mode === "edit";

  const [confirmDelete, setConfirmDelete] = useState(false);

  /* -------- Local editable state -------- */
  const initialItem = useMemo(() => {
    if (!item) return null;
    return { ...item };
  }, [item]);

  const [editableItem, setEditableItem] = useState(initialItem);

  useEffect(() => {
    if (open && item) {
      setEditableItem(initialItem);
    }
  }, [open, item, initialItem]);

  if (!open || !editableItem) return null;

  /* ---------------- HANDLERS ---------------- */
  const updateField = (field, value) => {
    if (!isEdit) return;
    setEditableItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!editableItem.name) {
      toast.warn("Item name is required");
      return;
    }
    onSave?.(editableItem);
  };

  const handleDelete = () => {
    setConfirmDelete(true);
  };

  /* ---------------- STATUS HELPERS ---------------- */
  const getStatusInfo = (status) => {
    switch (status) {
      case "In Stock":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          badge: "bg-green-100 text-green-700 border-green-300",
        };
      case "Low Stock":
        return {
          icon: AlertTriangle,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
        };
      case "Out of Stock":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          badge: "bg-red-100 text-red-700 border-red-300",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-slate-600",
          bg: "bg-slate-50",
          border: "border-slate-200",
          badge: "bg-slate-100 text-slate-700 border-slate-300",
        };
    }
  };

  const statusInfo = getStatusInfo(editableItem.status);
  const StatusIcon = statusInfo.icon;

  /* ---------------- RENDER ---------------- */
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-poppins">
          {/* BACKDROP */}
          <motion.div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* MODAL PANEL */}
          <motion.div
            className="
              relative bg-white
              w-full max-w-[95vw] lg:max-w-5xl
              rounded-2xl shadow-2xl
              flex flex-col
              max-h-[95vh]
              overflow-hidden
              border border-slate-200
            "
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#05015A] to-[#0a0280]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-indigo-200 font-semibold uppercase tracking-wider text-[9px]">
                  <Package size={14} />
                  <span>{isEdit ? "Edit Inventory Item" : "View Inventory Item"}</span>
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {editableItem.name}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusInfo.badge}`}>
                    {editableItem.status}
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-[10px] text-indigo-200 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Tag size={10} />
                    {editableItem.category}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Hash size={10} />
                    Batch: {editableItem.batch}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEdit && (
                  <button
                    onClick={handleSave}
                    className="
                      flex items-center gap-2
                      px-4 py-2
                      bg-emerald-500 text-white
                      rounded-lg text-sm font-semibold
                      hover:bg-emerald-600
                      transition-all shadow-lg hover:shadow-xl
                      border border-emerald-400
                    "
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                )}

                {isEdit && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-2.5 rounded-lg text-red-200 hover:text-white hover:bg-red-600 transition-all border border-red-400/30"
                    title="Delete Item"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {/* QUICK STATS BAR */}
              <div className="grid grid-cols-4 gap-3 p-4 bg-white border-b border-slate-200">
                <StatCard
                  label="Current Stock"
                  value={editableItem.qty || "0"}
                  icon={Layers}
                  color="blue"
                  suffix="units"
                />
                <StatCard
                  label="MRP"
                  value={editableItem.mrp ? `₹${Number(editableItem.mrp).toFixed(2)}` : "₹0.00"}
                  icon={DollarSign}
                  color="green"
                />
                <StatCard
                  label="S.L.R"
                  value={editableItem.slr || "-"}
                  icon={TrendingUp}
                  color="purple"
                />
                <StatCard
                  label="Rack Location"
                  value={editableItem.rack || "Not Assigned"}
                  icon={MapPin}
                  color="orange"
                />
              </div>

              {/* MAIN CONTENT */}
              <div className="p-6">
                {/* PRODUCT INFORMATION */}
                <Section title="Product Information" icon={Package}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoField
                      label="Item Name"
                      value={editableItem.name}
                      editable={isEdit}
                      onChange={(v) => updateField("name", v)}
                      icon={FileText}
                      required
                    />
                    <InfoField
                      label="Category"
                      value={editableItem.category}
                      editable={isEdit}
                      onChange={(v) => updateField("category", v)}
                      icon={Tag}
                    />
                    <InfoField
                      label="Manufacturer"
                      value={editableItem.manufacturer || editableItem.mfac || ""}
                      editable={isEdit}
                      onChange={(v) => updateField("manufacturer", v)}
                      icon={Building2}
                    />
                  </div>
                </Section>

                {/* BATCH & TRACKING */}
                <Section title="Batch & Tracking" icon={Box}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoField
                      label="Batch ID"
                      value={editableItem.batch}
                      editable={isEdit}
                      onChange={(v) => updateField("batch", v)}
                      icon={Hash}
                    />
                    <InfoField
                      label="Expiry Date"
                      value={editableItem.expiry}
                      editable={isEdit}
                      onChange={(v) => updateField("expiry", v)}
                      icon={Calendar}
                      type="text"
                      placeholder="MM/YYYY"
                    />
                    <InfoField
                      label="HSN Code"
                      value={editableItem.hsn || ""}
                      editable={isEdit}
                      onChange={(v) => updateField("hsn", v)}
                      icon={Hash}
                    />
                  </div>
                </Section>

                {/* SUPPLIER & PRICING */}
                <Section title="Supplier & Pricing" icon={Truck}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoField
                      label="Supplier"
                      value={editableItem.supplier}
                      editable={isEdit}
                      onChange={(v) => updateField("supplier", v)}
                      icon={Truck}
                    />
                    <InfoField
                      label="MRP"
                      value={editableItem.mrp}
                      editable={isEdit}
                      onChange={(v) => updateField("mrp", v)}
                      icon={DollarSign}
                      type="number"
                      prefix="₹"
                    />
                    <InfoField
                      label="Purchase Rate"
                      value={editableItem.purchaseRate || ""}
                      editable={isEdit}
                      onChange={(v) => updateField("purchaseRate", v)}
                      icon={DollarSign}
                      type="number"
                      prefix="₹"
                    />
                  </div>
                </Section>

                {/* STOCK & LOCATION */}
                <Section title="Stock & Location" icon={Layers}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <InfoField
                      label="Current Stock"
                      value={editableItem.qty}
                      editable={isEdit}
                      onChange={(v) => updateField("qty", v)}
                      icon={Layers}
                      type="number"
                    />
                    <InfoField
                      label="Minimum Stock"
                      value={editableItem.minStock || ""}
                      editable={isEdit}
                      onChange={(v) => updateField("minStock", v)}
                      icon={AlertTriangle}
                      type="number"
                    />
                    <InfoField
                      label="Rack Location"
                      value={editableItem.rack}
                      editable={isEdit}
                      onChange={(v) => updateField("rack", v)}
                      icon={MapPin}
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <StatusIcon size={12} className={statusInfo.color} />
                        Status
                      </label>
                      {isEdit ? (
                        <select
                          value={editableItem.status}
                          onChange={(e) => updateField("status", e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        >
                          <option value="In Stock">In Stock</option>
                          <option value="Low Stock">Low Stock</option>
                          <option value="Out of Stock">Out of Stock</option>
                        </select>
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusInfo.bg} ${statusInfo.border}`}>
                          <StatusIcon size={16} className={statusInfo.color} />
                          <span className={`text-sm font-semibold ${statusInfo.color}`}>
                            {editableItem.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Section>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center px-6 py-3 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Clock size={12} />
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
              
              {isEdit && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
                  >
                    <Save size={14} />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* DELETE CONFIRMATION */}
          <ConfirmDialog
            isOpen={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => {
              onDelete?.(editableItem);
              setConfirmDelete(false);
              onClose();
            }}
            title="Delete Inventory Item"
            message={`Are you sure you want to delete "${editableItem.name}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />
        </div>
      )}
    </AnimatePresence>
  );
};

/* ---------------- SECTION COMPONENT ---------------- */
const Section = ({ title, icon: Icon, children }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
      <Icon size={16} className="text-indigo-600" />
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

/* ---------------- STAT CARD COMPONENT ---------------- */
const StatCard = ({ label, value, icon: Icon, color, suffix }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  };

  return (
    <div className={`flex flex-col gap-1 p-3 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide opacity-70">
        <Icon size={12} />
        {label}
      </div>
      <div className="text-lg font-bold">
        {value}
        {suffix && <span className="text-[10px] font-medium ml-1 opacity-70">{suffix}</span>}
      </div>
    </div>
  );
};

/* ---------------- FIELD COMPONENT ---------------- */
const InfoField = ({
  label,
  value,
  editable,
  onChange,
  icon: Icon,
  required,
  type = "text",
  prefix,
  placeholder,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
      {Icon && <Icon size={12} />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>

    {editable ? (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 
            ${prefix ? 'pl-7' : ''}
            bg-white border border-slate-300 rounded-lg
            text-sm font-medium text-slate-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder:text-slate-400
            transition-all
          `}
        />
      </div>
    ) : (
      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
        <span className="text-sm font-semibold text-slate-800">
          {prefix}{value || "-"}
        </span>
      </div>
    )}
  </div>
);

export default ViewInventoryModal;