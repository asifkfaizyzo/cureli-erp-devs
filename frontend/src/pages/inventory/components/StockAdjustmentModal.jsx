// src/pages/inventory/components/StockAdjustmentModal.jsx

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, Package, AlertTriangle, Plus, Minus, Building2 } from "lucide-react";
import StyledSelect from "../../../components/common/StyledSelect";

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

// ✅ FIXED: Match Prisma enum values exactly
const ADJUSTMENT_REASONS = [
  { value: "PHYSICAL_COUNT_VARIANCE", label: "Physical Count Variance" },
  { value: "DAMAGED_GOODS", label: "Damaged Goods" },
  { value: "EXPIRED_GOODS", label: "Expired Goods" },
  { value: "SYSTEM_CORRECTION", label: "System Correction" },
  { value: "THEFT_LOSS", label: "Theft / Loss" },
  { value: "OTHER", label: "Other" },
];

const StockAdjustmentModal = ({ open, item, onClose, onSubmit }) => {
  const [newQuantity, setNewQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [reasonNotes, setReasonNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setNewQuantity(Number(item.current_stock || item.qty || 0));
      setReason("");
      setReasonNotes("");
      setErrors({});
    }
  }, [item]);

  if (!open || !item) return null;

  const currentStock = Number(item.current_stock || item.qty || 0);
  const variance = Number(newQuantity) - currentStock;

  const validate = () => {
    const newErrors = {};
    
    if (newQuantity === "" || Number(newQuantity) < 0) {
      newErrors.newQuantity = "Quantity must be 0 or greater";
    }
    
    if (!reason) {
      newErrors.reason = "Please select a reason";
    }
    
    if (reason === "OTHER" && !reasonNotes.trim()) {
      newErrors.reasonNotes = "Please provide details for 'Other' reason";
    }
    
    if (variance === 0) {
      newErrors.newQuantity = "New quantity must be different from current stock";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        newQuantity: Number(newQuantity),
        reason,
        reasonNotes: reasonNotes.trim(),
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementQty = () => setNewQuantity(prev => Number(prev) + 1);
  const decrementQty = () => setNewQuantity(prev => Math.max(0, Number(prev) - 1));

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-poppins">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500">
              <div className="flex items-center gap-2">
                <Package className="text-white" size={20} />
                <h2 className="text-lg font-bold text-white">Stock Adjustment</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Item Info */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                  <span>Batch: {item.batch || item.batch_number || "-"}</span>
                  <span>Expiry: {item.expiry || "-"}</span>
                  {(item.branch || item.branch_name) && (
                    <span className="flex items-center gap-1">
                      <Building2 size={10} />
                      {item.branch || item.branch_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Current Stock */}
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-sm text-slate-600">Current Stock</span>
                <span className="text-lg font-bold text-slate-800">{currentStock} units</span>
              </div>

              {/* New Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  New Quantity *
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={decrementQty}
                    className="p-2.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    min="0"
                    className={`flex-1 px-4 py-2.5 text-center text-lg font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.newQuantity ? "border-red-300 bg-red-50" : "border-slate-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={incrementQty}
                    className="p-2.5 rounded-lg bg-slate-100 hover:bg-green-100 text-slate-600 hover:text-green-600 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {errors.newQuantity && (
                  <p className="mt-1 text-xs text-red-500">{errors.newQuantity}</p>
                )}
              </div>

              {/* Variance Display */}
              {variance !== 0 && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  variance > 0 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-red-50 border border-red-200"
                }`}>
                  <AlertTriangle size={16} className={variance > 0 ? "text-green-600" : "text-red-600"} />
                  <span className={`text-sm font-medium ${variance > 0 ? "text-green-700" : "text-red-700"}`}>
                    {variance > 0 ? "+" : ""}{variance} units ({variance > 0 ? "Stock Increase" : "Stock Decrease"})
                  </span>
                </div>
              )}

              {/* Reason - Using StyledSelect */}
              <div>
                <StyledSelect
                  label="Reason *"
                  value={reason}
                  onChange={setReason}
                  options={ADJUSTMENT_REASONS}
                  placeholder="Select a reason"
                  error={errors.reason}
                />
              </div>

              {/* Reason Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Notes {reason === "OTHER" && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional details about this adjustment..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm ${
                    errors.reasonNotes ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                />
                {errors.reasonNotes && (
                  <p className="mt-1 text-xs text-red-500">{errors.reasonNotes}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-5 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || variance === 0}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Save size={14} />
                {loading ? "Saving..." : "Save Adjustment"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockAdjustmentModal;