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
  RefreshCw,
  Loader2,
  ShoppingCart,
  BarChart3,
  Settings,
  Factory,
} from "lucide-react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

/* ---------------- ANIMATION VARIANTS ---------------- */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, x: 50, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

/* ---------------- STATUS HELPERS ---------------- */
const getStatusInfo = (status) => {
  const normalizedStatus = (status || "").toLowerCase();
  const statusMap = {
    "in stock": {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      progressColor: "bg-emerald-500",
    },
    "low stock": {
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      progressColor: "bg-amber-500",
    },
    "out of stock": {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-700",
      progressColor: "bg-red-500",
    },
    expired: {
      icon: XCircle,
      color: "text-slate-600",
      bg: "bg-slate-100",
      border: "border-slate-300",
      badge: "bg-slate-200 text-slate-700",
      progressColor: "bg-slate-400",
    },
    "expiring soon": {
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-700",
      progressColor: "bg-orange-500",
    },
  };
  return (
    statusMap[normalizedStatus] || {
      icon: AlertCircle,
      color: "text-slate-600",
      bg: "bg-slate-50",
      border: "border-slate-200",
      badge: "bg-slate-100 text-slate-600",
      progressColor: "bg-slate-400",
    }
  );
};

/* ---------------- FORMAT EXPIRY FOR DISPLAY ---------------- */
const formatExpiryForInput = (dateValue) => {
  if (!dateValue) return "";

  // If already in MM/YYYY format
  if (typeof dateValue === "string" && /^\d{1,2}\/\d{4}$/.test(dateValue)) {
    return dateValue;
  }

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  } catch {
    return "";
  }
};

/* ---------------- MAIN COMPONENT ---------------- */
const ViewInventoryModal = ({
  open,
  onClose,
  item,
  mode = "view",
  onSave,
  onDelete,
  onAdjust,
  canAdjustStock = true,
}) => {
  const isEdit = mode === "edit";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ✅ Helper to safely extract string from any value (objects, strings, null)
  const str = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      return value.branch_name || value.name || value.supplier_name || "";
    }
    return String(value);
  };

  // ✅ FIXED initialItem useMemo
  const initialItem = useMemo(() => {
    if (!item) return null;

    console.log("🔍 ViewInventoryModal - Raw item:", item);

    return {
      // IDs
      inventory_id: item.inventory_id || item.id,
      medicine_id: item.medicine_id,
      shop_id: item.shop_id,
      branch_id:
        item.branch_id ||
        (typeof item.branch === "object" ? item.branch?.branch_id : null),

      // Product Information
      name: str(item.name || item.medicine_name || item.medicine?.name),
      manufacturer: str(
        item.manufacturer ||
          item.medicine_manufacturer ||
          item.mfac ||
          item.medicine?.manufacturer
      ),
      category: str(
        item.category || item.medicine_category || item.medicine?.category
      ),
      hsn_code: str(
        item.hsn ||
          item.hsn_code ||
          item.medicine_hsn_code ||
          item.medicine?.hsn_code
      ),

      // Batch Info
      batch_number: str(item.batch || item.batch_number),
      expiry: formatExpiryForInput(item.expiry_date || item.expiry),
      expiry_date: item.expiry_date,

      // Pricing
      mrp: item.mrp ?? "",
      selling_rate: item.slr ?? item.selling_rate ?? "",
      purchase_rate: item.purchaseRate ?? item.last_purchase_rate ?? "",

      // Location
      rack_no: str(
        item.rack || item.rack_no || item.medicine_rack_no || item.medicine?.rack_no
      ),

      // Stock thresholds
      min_stock_level:
        item.medicine_min_stock ??
        item.min_stock_level ??
        item.medicine?.min_stock_level ??
        "",
      max_stock_level:
        item.medicine_max_stock ??
        item.max_stock_level ??
        item.medicine?.max_stock_level ??
        "",
      reorder_point:
        item.medicine_reorder_point ??
        item.reorder_point ??
        item.medicine?.reorder_point ??
        "",

      // Inventory-level threshold
      minimum_stock: item.minimum_stock ?? item.minStock ?? "",

      // ✅ FIX: Safely extract supplier string (could be object)
      supplier: str(item.supplier_name || item.supplier),

      // Stock info (read-only)
      current_stock: item.qty ?? item.current_stock ?? 0,
      status: item.status || "Unknown",

      // ✅ FIX: Safely extract branch name (item.branch could be {branch_id, branch_name})
      branch_name: str(item.branch_name || item.branch),

      // Timestamps
      updated_at: item.updated_at,
    };
  }, [item]);

  const [editableItem, setEditableItem] = useState(initialItem);

  useEffect(() => {
    if (open && item) {
      setEditableItem(initialItem);
      setSaveError(null);
    }
  }, [open, item, initialItem]);

  if (!open || !editableItem) return null;

  const statusInfo = getStatusInfo(editableItem.status);
  const StatusIcon = statusInfo.icon;

  /* ---------------- HANDLERS ---------------- */
  const updateField = (field, value) => {
    if (!isEdit) return;
    setEditableItem((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
  };

  const handleSave = async () => {
    // Validation
    if (!editableItem.name?.trim()) {
      setSaveError("Item name is required");
      return;
    }
    if (!editableItem.manufacturer?.trim()) {
      setSaveError("Manufacturer is required");
      return;
    }
    if (!editableItem.batch_number?.trim()) {
      setSaveError("Batch number is required");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // ✅ Build the update payload
      const dataToSave = {
        // IDs
        inventory_id: editableItem.inventory_id,
        medicine_id: editableItem.medicine_id,

        // Product Information
        name: editableItem.name?.trim(),
        manufacturer: editableItem.manufacturer?.trim(),
        category: editableItem.category?.trim() || null,
        hsn_code: editableItem.hsn_code?.trim() || null,

        // Batch Info
        batch_number: editableItem.batch_number?.trim(),
        expiry_date: editableItem.expiry?.trim() || null,

        // Pricing
        mrp: editableItem.mrp !== "" ? Number(editableItem.mrp) : null,
        selling_rate:
          editableItem.selling_rate !== ""
            ? Number(editableItem.selling_rate)
            : null,
        last_purchase_rate:
          editableItem.purchase_rate !== ""
            ? Number(editableItem.purchase_rate)
            : null,

        // Location
        rack_no: editableItem.rack_no?.trim() || null,

        // Stock thresholds (Medicine level)
        min_stock_level:
          editableItem.min_stock_level !== ""
            ? Number(editableItem.min_stock_level)
            : null,
        max_stock_level:
          editableItem.max_stock_level !== ""
            ? Number(editableItem.max_stock_level)
            : null,
        reorder_point:
          editableItem.reorder_point !== ""
            ? Number(editableItem.reorder_point)
            : null,

        // Inventory-level threshold
        minimum_stock:
          editableItem.minimum_stock !== ""
            ? Number(editableItem.minimum_stock)
            : null,
      };

      console.log("📤 Saving inventory data:", dataToSave);

      await onSave?.(dataToSave);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      setSaveError(error.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const currentStock = Number(editableItem.current_stock || 0);
  const minStock = Number(
    editableItem.min_stock_level || editableItem.minimum_stock || 0
  );
  const maxStock = Number(editableItem.max_stock_level || 100);
  const stockPercent =
    maxStock > 0 ? Math.min((currentStock / maxStock) * 100, 100) : 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-poppins">
          {/* BACKDROP */}
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* MODAL */}
          <motion.div
            className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-[#05015A] to-[#1a1a8e] shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {isEdit ? "Edit Inventory Item" : editableItem.name}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.badge}`}
                    >
                      {editableItem.status}
                    </span>
                  </h2>
                  <div className="flex items-center gap-3 text-[11px] text-indigo-200 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Tag size={10} />
                      {editableItem.category || "Uncategorized"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Hash size={10} />
                      {editableItem.batch_number || "N/A"}
                    </span>
                    {editableItem.branch_name && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 size={10} />
                          {editableItem.branch_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEdit && canAdjustStock && onAdjust && (
                  <button
                    onClick={() => {
                      onAdjust(editableItem);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    <RefreshCw size={15} />
                    Adjust Stock
                  </button>
                )}
                {isEdit && onDelete && canAdjustStock && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-2 rounded-lg text-red-300 hover:text-white hover:bg-red-500/30 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ERROR BANNER */}
            {saveError && (
              <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-600" />
                <span className="text-xs text-red-700 font-medium">
                  {saveError}
                </span>
              </div>
            )}

            {/* TWO-SECTION BODY - SCROLLABLE */}
            <div className="flex flex-1 overflow-hidden">
              {/* LEFT SECTION - Product & Pricing Details */}
              <div className="flex-1 p-6 bg-slate-50 border-r border-slate-200 overflow-y-auto">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* Product Information */}
                  <div className="col-span-2 mb-2">
                    <SectionHeader icon={FileText} title="Product Information" />
                  </div>

                  <Field
                    label="Item Name"
                    value={editableItem.name}
                    editable={isEdit}
                    onChange={(v) => updateField("name", v)}
                    icon={Package}
                    required
                  />
                  <Field
                    label="Manufacturer"
                    value={editableItem.manufacturer}
                    editable={isEdit}
                    onChange={(v) => updateField("manufacturer", v)}
                    icon={Factory}
                    required
                  />
                  <Field
                    label="Category"
                    value={editableItem.category}
                    editable={isEdit}
                    onChange={(v) => updateField("category", v)}
                    icon={Tag}
                  />
                  <Field
                    label="HSN Code"
                    value={editableItem.hsn_code}
                    editable={isEdit}
                    onChange={(v) => updateField("hsn_code", v)}
                    icon={Hash}
                  />

                  {/* Batch Information */}
                  <div className="col-span-2 mt-4 mb-2">
                    <SectionHeader icon={Box} title="Batch Information" />
                  </div>

                  <Field
                    label="Batch Number"
                    value={editableItem.batch_number}
                    editable={isEdit}
                    onChange={(v) => updateField("batch_number", v)}
                    icon={Box}
                    required
                  />
                  <Field
                    label="Expiry Date"
                    value={editableItem.expiry}
                    editable={isEdit}
                    onChange={(v) => updateField("expiry", v)}
                    icon={Calendar}
                    placeholder="MM/YYYY"
                  />

                  {/* Pricing & Supplier */}
                  <div className="col-span-2 mt-4 mb-2">
                    <SectionHeader icon={DollarSign} title="Pricing & Supplier" />
                  </div>

                  <Field
                    label="Supplier"
                    value={editableItem.supplier}
                    editable={false}
                    icon={Truck}
                    hint="From purchase invoice"
                  />
                  <Field
                    label="Rack Location"
                    value={editableItem.rack_no}
                    editable={isEdit}
                    onChange={(v) => updateField("rack_no", v)}
                    icon={MapPin}
                    placeholder="e.g., A1"
                  />
                  <Field
                    label="MRP"
                    value={editableItem.mrp}
                    editable={isEdit}
                    onChange={(v) => updateField("mrp", v)}
                    icon={DollarSign}
                    type="number"
                    prefix="₹"
                  />
                  <Field
                    label="Purchase Rate"
                    value={editableItem.purchase_rate}
                    editable={isEdit}
                    onChange={(v) => updateField("purchase_rate", v)}
                    icon={ShoppingCart}
                    type="number"
                    prefix="₹"
                  />
                  <Field
                    label="Selling Rate"
                    value={editableItem.selling_rate}
                    editable={isEdit}
                    onChange={(v) => updateField("selling_rate", v)}
                    icon={TrendingUp}
                    type="number"
                    prefix="₹"
                  />
                </div>
              </div>

              {/* RIGHT SECTION - Stock & Status */}
              <div className="w-[380px] p-6 bg-white flex flex-col overflow-y-auto">
                {/* Stock Status Card (Read-Only) */}
                <div className="mb-5">
                  <SectionHeader icon={Layers} title="Current Stock Status" />
                  <div
                    className={`mt-3 p-4 rounded-xl border-2 ${statusInfo.border} ${statusInfo.bg}`}
                  >
                    {/* Status Display */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg ${statusInfo.bg} border ${statusInfo.border}`}
                        >
                          <StatusIcon size={20} className={statusInfo.color} />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase">
                            Current Status
                          </p>
                          <p className={`text-sm font-bold ${statusInfo.color}`}>
                            {editableItem.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-slate-500 uppercase">
                          Quantity
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {currentStock}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 bg-white/60 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusInfo.progressColor}`}
                        style={{ width: `${stockPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Min: {minStock}</span>
                      <span>{stockPercent.toFixed(0)}% of capacity</span>
                      <span>Max: {maxStock || "∞"}</span>
                    </div>
                  </div>

                  {/* Note about stock adjustment */}
                  <p className="mt-2 text-[10px] text-slate-400 italic flex items-center gap-1">
                    <AlertCircle size={10} />
                    Use "Adjust Stock" to modify quantity
                  </p>
                </div>

                {/* Stock Thresholds (Editable) */}
                <div className="mb-5">
                  <SectionHeader icon={Settings} title="Stock Thresholds" />
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <Field
                      label="Min Stock"
                      value={editableItem.min_stock_level}
                      editable={isEdit}
                      onChange={(v) => updateField("min_stock_level", v)}
                      type="number"
                      compact
                    />
                    <Field
                      label="Max Stock"
                      value={editableItem.max_stock_level}
                      editable={isEdit}
                      onChange={(v) => updateField("max_stock_level", v)}
                      type="number"
                      compact
                    />
                    <Field
                      label="Reorder Pt"
                      value={editableItem.reorder_point}
                      editable={isEdit}
                      onChange={(v) => updateField("reorder_point", v)}
                      type="number"
                      compact
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400 italic">
                    * These thresholds apply to ALL batches of this medicine
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex-1">
                  <SectionHeader icon={BarChart3} title="Quick Info" />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <QuickStat label="MRP" value={`₹${editableItem.mrp || 0}`} />
                    <QuickStat
                      label="Selling"
                      value={`₹${editableItem.selling_rate || 0}`}
                    />
                    <QuickStat label="Rack" value={editableItem.rack_no || "-"} />
                    <QuickStat
                      label="Branch"
                      value={editableItem.branch_name || "-"}
                    />
                  </div>
                </div>

                {/* Branch Warning */}
                {!canAdjustStock && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <span className="text-[11px] text-amber-700">
                      Select a branch to edit this item
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center px-6 py-3 bg-slate-100 border-t border-slate-200 shrink-0">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Clock size={11} />
                <span>
                  Updated:{" "}
                  {editableItem.updated_at
                    ? new Date(editableItem.updated_at).toLocaleDateString()
                    : "Today"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                >
                  {isEdit ? "Cancel" : "Close"}
                </button>

                {isEdit && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
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
            message={`Are you sure you want to delete "${editableItem.name}" (Batch: ${editableItem.batch_number})? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />
        </div>
      )}
    </AnimatePresence>
  );
};

/* ---------------- SECTION HEADER ---------------- */
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
    <Icon size={14} className="text-indigo-600" />
    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
      {title}
    </h3>
  </div>
);

/* ---------------- QUICK STAT ---------------- */
const QuickStat = ({ label, value }) => (
  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
    <p className="text-[9px] font-medium text-slate-500 uppercase">{label}</p>
    <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
  </div>
);

/* ---------------- FIELD COMPONENT ---------------- */
const Field = ({
  label,
  value,
  editable,
  onChange,
  icon: Icon,
  required,
  type = "text",
  prefix,
  placeholder,
  compact,
  hint,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
      {Icon && <Icon size={10} />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>

    {editable ? (
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full ${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"}
            ${prefix ? "pl-6" : ""}
            bg-white border border-slate-300 rounded-lg
            font-medium text-slate-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder:text-slate-400 transition-all
          `}
        />
      </div>
    ) : (
      // ✅ FIX: Safely handle object values in read-only display
      <div
        className={`${compact ? "px-2.5 py-1.5" : "px-3 py-2"} bg-slate-100 border border-slate-200 rounded-lg`}
      >
        <span
          className={`${compact ? "text-xs" : "text-sm"} font-semibold text-slate-800`}
        >
          {prefix}
          {typeof value === "object"
            ? value?.branch_name || value?.name || value?.supplier_name || "-"
            : value || "-"}
        </span>
        {hint && (
          <span className="ml-1 text-[9px] text-slate-400">({hint})</span>
        )}
      </div>
    )}
  </div>
);

export default ViewInventoryModal;