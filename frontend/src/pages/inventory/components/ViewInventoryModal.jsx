// components/ViewInventoryModal.jsx
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

  /* -------- Dynamic sizing (same as Invoice modal) -------- */
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const labelSize = sidebarExpanded ? "text-[10px]" : "text-xs";
  const iconSize = sidebarExpanded ? 14 : 16;

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

  /* ---------------- RENDER ---------------- */
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-poppins">
          {/* BACKDROP */}
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
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
              w-full max-w-[95vw] lg:max-w-[80vw]
              rounded-xl shadow-2xl
              flex flex-col
              max-h-[95vh]
              overflow-hidden
              border border-gray-200
            "
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-indigo-600 font-bold uppercase tracking-wider text-[10px]">
                  <Package size={iconSize} />
                  <span>{isEdit ? "Edit Inventory Item" : "Inventory Item"}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editableItem.name}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                {isEdit && (
                  <button
                    onClick={handleSave}
                    className="
                      flex items-center gap-1.5
                      px-4 py-2
                      bg-[#000060] text-white
                      rounded-lg text-sm font-medium
                      hover:bg-[#000050]
                      transition-all shadow-sm
                    "
                  >
                    <Save size={iconSize} />
                    Save
                  </button>
                )}

                {isEdit && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={iconSize} />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <X size={iconSize + 2} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-4 py-3 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoField
                  label="Item Name"
                  value={editableItem.name}
                  editable={isEdit}
                  onChange={(v) => updateField("name", v)}
                  textSize={textSize}
                  labelSize={labelSize}
                />

                <InfoField
                  label="Category"
                  value={editableItem.category}
                  editable={isEdit}
                  onChange={(v) => updateField("category", v)}
                  textSize={textSize}
                  labelSize={labelSize}
                />

                <InfoField
                  label="Batch ID"
                  value={editableItem.batch}
                  editable={isEdit}
                  onChange={(v) => updateField("batch", v)}
                  textSize={textSize}
                  labelSize={labelSize}
                />

                <InfoField
                  label="Supplier"
                  value={editableItem.supplier}
                  editable={isEdit}
                  onChange={(v) => updateField("supplier", v)}
                  icon={Truck}
                  textSize={textSize}
                  labelSize={labelSize}
                />

                <InfoField
                  label="Expiry Date"
                  value={editableItem.expiry}
                  editable={isEdit}
                  onChange={(v) => updateField("expiry", v)}
                  icon={Calendar}
                  textSize={textSize}
                  labelSize={labelSize}
                />

                <InfoField
                  label="Quantity"
                  value={editableItem.qty}
                  editable={isEdit}
                  onChange={(v) => updateField("qty", v)}
                  icon={Layers}
                  textSize={textSize}
                  labelSize={labelSize}
                />

                <InfoField
                  label="Status"
                  value={editableItem.status}
                  editable={isEdit}
                  onChange={(v) => updateField("status", v)}
                  icon={AlertCircle}
                  textSize={textSize}
                  labelSize={labelSize}
                />
              </div>
            </div>
          </motion.div>

          {/* DELETE CONFIRMATION */}
          <ConfirmDialog
            isOpen={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => {
              onDelete?.(editableItem);
              toast.success("Inventory item deleted");
            }}
            title="Delete Inventory Item"
            message={`Are you sure you want to delete "${editableItem.name}"?`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />
        </div>
      )}
    </AnimatePresence>
  );
};

/* ---------------- FIELD COMPONENT ---------------- */
const InfoField = ({
  label,
  value,
  editable,
  onChange,
  icon: Icon,
  textSize,
  labelSize,
}) => (
  <div className="flex flex-col gap-0.5 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
    <div className="flex items-center gap-1.5 text-gray-400">
      {Icon && <Icon size={12} />}
      <span className={`${labelSize} uppercase font-semibold tracking-wide`}>
        {label}
      </span>
    </div>

    {editable ? (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`
          mt-0.5 ${textSize}
          bg-white border border-gray-300 rounded
          px-2 py-1
          text-gray-800 font-medium
          focus:outline-none focus:ring-2 focus:ring-[#000060]
        `}
      />
    ) : (
      <span className={`${textSize} font-medium text-gray-800 mt-0.5`}>
        {value || "-"}
      </span>
    )}
  </div>
);

export default ViewInventoryModal;
