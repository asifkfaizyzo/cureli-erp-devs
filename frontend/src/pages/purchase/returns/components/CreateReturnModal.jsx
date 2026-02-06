// frontend/src/pages/purchase/returns/components/CreateReturnModal.jsx

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Package,
  AlertTriangle,
  FileText,
  CreditCard,
  Shield,
  Info,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  IndianRupee,
  Calendar,
} from "lucide-react";
import { useToast } from "../../../../components/common/Toast";
import purchaseAPI from "../../../../api/purchase";
import inventoryAPI from "../../../../api/inventory";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const RETURN_REASONS = [
  { value: "DAMAGED_GOODS", label: "Damaged Goods", description: "Items received in damaged condition" },
  { value: "EXPIRED_GOODS", label: "Expired Goods", description: "Products already expired or near expiry" },
  { value: "WRONG_ITEM_RECEIVED", label: "Wrong Item", description: "Received incorrect product" },
  { value: "QUALITY_ISSUE", label: "Quality Issue", description: "Product quality not acceptable" },
  { value: "EXCESS_STOCK", label: "Excess Stock", description: "Over-ordered items" },
  { value: "PRICE_DIFFERENCE", label: "Price Difference", description: "Billing discrepancy" },
  { value: "OTHER", label: "Other", description: "Other reason (please specify)" },
];

const ADJUSTMENT_TYPES = [
  {
    value: "CASH_REFUND",
    label: "Cash Refund",
    icon: IndianRupee,
    description: "Immediate cash refund from supplier",
    color: "emerald",
  },
  {
    value: "CREDIT_NOTE",
    label: "Credit Note",
    icon: FileText,
    description: "Generate credit note (valid for 1 year)",
    color: "blue",
  },
  {
    value: "OFFSET_NEXT_PURCHASE",
    label: "Offset Next Purchase",
    icon: CreditCard,
    description: "Adjust against future purchases",
    color: "purple",
  },
];

const STEPS = [
  { id: 1, label: "Select Items", icon: Package },
  { id: 2, label: "Return Reason", icon: AlertTriangle },
  { id: 3, label: "Adjustment Type", icon: CreditCard },
  { id: 4, label: "Review & Submit", icon: Check },
];

const NAVY = "#000060";

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ════════════════════════════════════════════════════════════════════════════

const ANIMATION_VARIANTS = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  },
  panel: {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  },
  step: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateLineTotal = (item) => {
  const qty = parseFloat(item.quantity) || 0;
  const rate = parseFloat(item.purchase_rate) || 0;
  const cgst = parseFloat(item.cgst_percent) || 0;
  const sgst = parseFloat(item.sgst_percent) || 0;

  const subtotal = qty * rate;
  const taxAmount = subtotal * ((cgst + sgst) / 100);
  return subtotal + taxAmount;
};

// ════════════════════════════════════════════════════════════════════════════
// STEP INDICATOR COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const StepIcon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                  ${isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : ""}
                  ${isActive ? "bg-[#000060] text-white shadow-lg shadow-[#000060]/30 scale-110" : ""}
                  ${!isActive && !isCompleted ? "bg-gray-100 text-gray-400" : ""}
                `}
              >
                {isCompleted ? (
                  <Check size={20} className="animate-in zoom-in" />
                ) : (
                  <StepIcon size={20} />
                )}
              </div>
              <p
                className={`
                  text-xs font-medium transition-colors duration-300
                  ${isActive ? "text-[#000060]" : ""}
                  ${isCompleted ? "text-emerald-600" : ""}
                  ${!isActive && !isCompleted ? "text-gray-400" : ""}
                `}
              >
                {step.label}
              </p>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 mb-8">
                <div
                  className={`h-full transition-all duration-500 ${
                    step.id < currentStep ? "bg-emerald-500" : "bg-gray-200"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 1: SELECT ITEMS
// ════════════════════════════════════════════════════════════════════════════

const Step1SelectItems = ({ invoice, selectedItems, onItemsChange, inventoryBatches }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddOther, setShowAddOther] = useState(false);

  const invoiceItems = useMemo(() => {
    return (invoice.lineItems || []).map((item) => ({
      ...item,
      medicine_id: item.medicine_id,
      name: item.medicine?.name || "Unknown",
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      purchase_rate: item.purchase_rate,
      mrp: item.mrp,
      cgst_percent: item.cgst_percent,
      sgst_percent: item.sgst_percent,
      max_quantity: parseFloat(item.quantity),
      current_stock: item.inventory?.current_stock || 0,
    }));
  }, [invoice]);

  const handleToggleItem = (item) => {
    const isSelected = selectedItems.some(
      (si) => si.medicine_id === item.medicine_id && si.batch_number === item.batch_number
    );

    if (isSelected) {
      onItemsChange(
        selectedItems.filter(
          (si) => !(si.medicine_id === item.medicine_id && si.batch_number === item.batch_number)
        )
      );
    } else {
      onItemsChange([
        ...selectedItems,
        {
          medicine_id: item.medicine_id,
          name: item.name,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          purchase_rate: item.purchase_rate,
          mrp: item.mrp,
          cgst_percent: item.cgst_percent,
          sgst_percent: item.sgst_percent,
          quantity: 1,
          max_quantity: item.max_quantity,
          current_stock: item.current_stock,
        },
      ]);
    }
  };

  const handleQuantityChange = (item, newQty) => {
    const qty = Math.max(1, Math.min(parseFloat(newQty) || 1, item.max_quantity));
    onItemsChange(
      selectedItems.map((si) =>
        si.medicine_id === item.medicine_id && si.batch_number === item.batch_number
          ? { ...si, quantity: qty }
          : si
      )
    );
  };

  const handleAddOtherBatch = (batch) => {
    const isAlreadyAdded = selectedItems.some(
      (si) => si.medicine_id === batch.medicine_id && si.batch_number === batch.batch_number
    );

    if (isAlreadyAdded) {
      return;
    }

    onItemsChange([
      ...selectedItems,
      {
        medicine_id: batch.medicine_id,
        name: batch.medicine?.name || "Unknown",
        batch_number: batch.batch_number,
        expiry_date: batch.expiry_date,
        purchase_rate: batch.last_purchase_rate || 0,
        mrp: batch.mrp,
        cgst_percent: 6,
        sgst_percent: 6,
        quantity: 1,
        max_quantity: parseFloat(batch.current_stock),
        current_stock: parseFloat(batch.current_stock),
        is_other_batch: true,
      },
    ]);
    setShowAddOther(false);
    setSearchQuery("");
  };

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return (inventoryBatches || []).filter(
      (batch) =>
        batch.medicine?.name?.toLowerCase().includes(query) ||
        batch.batch_number?.toLowerCase().includes(query)
    );
  }, [searchQuery, inventoryBatches]);

  return (
    <motion.div
      className="space-y-6"
      variants={ANIMATION_VARIANTS.step}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#000060] mb-1">Select Items to Return</h3>
          <p className="text-sm text-gray-500">
            Choose items from invoice <span className="font-mono font-semibold">{invoice.invoice_number}</span>
          </p>
        </div>
        <button
          onClick={() => setShowAddOther(!showAddOther)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add Other Batch
        </button>
      </div>

      {/* Add Other Batch Search */}
      {showAddOther && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">
              Search and add batches not in this invoice
            </p>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name or batch number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {searchQuery && filteredInventory.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
              {filteredInventory.map((batch) => (
                <button
                  key={`${batch.medicine_id}-${batch.batch_number}`}
                  onClick={() => handleAddOtherBatch(batch)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b last:border-b-0"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{batch.medicine?.name}</p>
                    <p className="text-xs text-gray-500">
                      Batch: <span className="font-mono">{batch.batch_number}</span> | Stock:{" "}
                      {batch.current_stock}
                    </p>
                  </div>
                  <Plus size={18} className="text-blue-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invoice Items Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-4 py-3 text-center w-12">
                <input
                  type="checkbox"
                  checked={selectedItems.length === invoiceItems.length && invoiceItems.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onItemsChange(
                        invoiceItems.map((item) => ({
                          ...item,
                          quantity: 1,
                        }))
                      );
                    } else {
                      onItemsChange([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-[#000060] focus:ring-[#000060]"
                />
              </th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-center">Batch</th>
              <th className="px-4 py-3 text-center">Expiry</th>
              <th className="px-4 py-3 text-right">Purchased</th>
              <th className="px-4 py-3 text-right">In Stock</th>
              <th className="px-4 py-3 text-right">Return Qty</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoiceItems.map((item, index) => {
              const isSelected = selectedItems.some(
                (si) => si.medicine_id === item.medicine_id && si.batch_number === item.batch_number
              );
              const selectedItem = selectedItems.find(
                (si) => si.medicine_id === item.medicine_id && si.batch_number === item.batch_number
              );

              return (
                <tr
                  key={`${item.medicine_id}-${item.batch_number}-${index}`}
                  className={`hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(item)}
                      className="w-4 h-4 rounded border-gray-300 text-[#000060] focus:ring-[#000060]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.medicine?.manufacturer && (
                      <p className="text-xs text-gray-500">{item.medicine.manufacturer}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-xs px-2 py-1 bg-gray-100 rounded">
                      {item.batch_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {formatDate(item.expiry_date)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {item.max_quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.current_stock}</td>
                  <td className="px-4 py-3 text-right">
                    {isSelected ? (
                      <input
                        type="number"
                        min="1"
                        max={item.max_quantity}
                        value={selectedItem.quantity}
                        onChange={(e) => handleQuantityChange(selectedItem, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-[#000060] focus:border-[#000060]"
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {isSelected
                      ? formatCurrency(calculateLineTotal(selectedItem))
                      : formatCurrency(0)}
                  </td>
                </tr>
              );
            })}

            {/* Other batches added */}
            {selectedItems
              .filter((si) => si.is_other_batch)
              .map((item, index) => (
                <tr key={`other-${item.medicine_id}-${item.batch_number}-${index}`} className="bg-purple-50">
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        onItemsChange(
                          selectedItems.filter(
                            (si) =>
                              !(
                                si.medicine_id === item.medicine_id &&
                                si.batch_number === item.batch_number
                              )
                          )
                        )
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-700 rounded">
                        Other Batch
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-xs px-2 py-1 bg-gray-100 rounded">
                      {item.batch_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {formatDate(item.expiry_date)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">N/A</td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.current_stock}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min="1"
                      max={item.max_quantity}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-[#000060] focus:border-[#000060]"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(calculateLineTotal(item))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-700">
          Selected: <span className="text-[#000060] font-bold">{selectedItems.length}</span> items
        </p>
        <p className="text-lg font-bold text-[#000060]">
          Total: {formatCurrency(selectedItems.reduce((sum, item) => sum + calculateLineTotal(item), 0))}
        </p>
      </div>

      {selectedItems.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Please select at least one item to proceed.</p>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 2: RETURN REASON
// ════════════════════════════════════════════════════════════════════════════

const Step2ReturnReason = ({ returnReason, onReasonChange, reasonNotes, onNotesChange }) => {
  return (
    <motion.div
      className="space-y-6"
      variants={ANIMATION_VARIANTS.step}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div>
        <h3 className="text-lg font-semibold text-[#000060] mb-1">Select Return Reason</h3>
        <p className="text-sm text-gray-500">Choose the primary reason for this return</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {RETURN_REASONS.map((reason) => (
          <button
            key={reason.value}
            onClick={() => onReasonChange(reason.value)}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${
                returnReason === reason.value
                  ? "border-[#000060] bg-[#000060]/5 shadow-lg"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <p
                className={`font-semibold ${
                  returnReason === reason.value ? "text-[#000060]" : "text-gray-900"
                }`}
              >
                {reason.label}
              </p>
              {returnReason === reason.value && (
                <div className="w-5 h-5 rounded-full bg-[#000060] flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">{reason.description}</p>
          </button>
        ))}
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes {returnReason === "OTHER" && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={reasonNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={
            returnReason === "OTHER"
              ? "Please provide details about the return reason..."
              : "Optional: Add any additional details..."
          }
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060] resize-none"
        />
        {returnReason === "OTHER" && !reasonNotes.trim() && (
          <p className="mt-1 text-xs text-red-600">Required when reason is "Other"</p>
        )}
      </div>

      {!returnReason && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Please select a return reason to proceed.</p>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 3: ADJUSTMENT TYPE
// ════════════════════════════════════════════════════════════════════════════

const Step3AdjustmentType = ({ adjustmentType, onAdjustmentChange, refundNotes, onRefundNotesChange }) => {
  return (
    <motion.div
      className="space-y-6"
      variants={ANIMATION_VARIANTS.step}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div>
        <h3 className="text-lg font-semibold text-[#000060] mb-1">Choose Payment Adjustment</h3>
        <p className="text-sm text-gray-500">Select how the return amount should be handled</p>
      </div>

      <div className="space-y-4">
        {ADJUSTMENT_TYPES.map((type) => {
          const TypeIcon = type.icon;
          const isSelected = adjustmentType === type.value;

          return (
            <button
              key={type.value}
              onClick={() => onAdjustmentChange(type.value)}
              className={`
                w-full p-5 rounded-lg border-2 transition-all text-left
                ${
                  isSelected
                    ? `border-${type.color}-500 bg-${type.color}-50 shadow-lg`
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center
                    ${isSelected ? `bg-${type.color}-500` : "bg-gray-100"}
                  `}
                >
                  <TypeIcon size={24} className={isSelected ? "text-white" : "text-gray-400"} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p
                        className={`font-semibold text-lg ${
                          isSelected ? `text-${type.color}-700` : "text-gray-900"
                        }`}
                      >
                        {type.label}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                    {isSelected && (
                      <div className={`w-6 h-6 rounded-full bg-${type.color}-500 flex items-center justify-center`}>
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Additional info */}
                  {type.value === "CREDIT_NOTE" && isSelected && (
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info size={14} className="text-blue-700 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">
                          Credit note will be valid for <strong>1 year</strong> from issue date. Can be used
                          for future purchases from this supplier.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Refund Notes (optional) */}
      {adjustmentType === "CASH_REFUND" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Refund Details (Optional)
          </label>
          <textarea
            value={refundNotes}
            onChange={(e) => onRefundNotesChange(e.target.value)}
            placeholder="Add payment method, reference number, or other refund details..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060] resize-none"
          />
        </div>
      )}

      {!adjustmentType && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Please select an adjustment type to proceed.</p>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 4: REVIEW & SUBMIT
// ════════════════════════════════════════════════════════════════════════════

const Step4Review = ({
  invoice,
  selectedItems,
  returnReason,
  reasonNotes,
  adjustmentType,
  refundNotes,
  isSuperAdmin,
  autoApprove,
  onAutoApproveChange,
}) => {
  const totalAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  }, [selectedItems]);

  const reasonLabel = RETURN_REASONS.find((r) => r.value === returnReason)?.label || returnReason;
  const adjustmentLabel =
    ADJUSTMENT_TYPES.find((a) => a.value === adjustmentType)?.label || adjustmentType;

  return (
    <motion.div
      className="space-y-6"
      variants={ANIMATION_VARIANTS.step}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div>
        <h3 className="text-lg font-semibold text-[#000060] mb-1">Review & Submit</h3>
        <p className="text-sm text-gray-500">Verify all details before creating the return</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Invoice Info */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Original Invoice</p>
          <p className="font-mono font-bold text-[#000060]">{invoice.invoice_number}</p>
          <p className="text-sm text-gray-600 mt-1">{invoice.supplier?.name}</p>
        </div>

        {/* Total Amount */}
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Return Amount</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Items Summary */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="font-semibold text-gray-900">Returning Items ({selectedItems.length})</p>
        </div>
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-center">Batch</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedItems.map((item, index) => (
                <tr key={`review-${item.medicine_id}-${item.batch_number}-${index}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.is_other_batch && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        Other Batch
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-xs">{item.batch_number}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#000060]">
                    {formatCurrency(calculateLineTotal(item))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Details */}
      <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Return Reason</p>
          <p className="font-semibold text-gray-900">{reasonLabel}</p>
          {reasonNotes && <p className="text-sm text-gray-600 mt-1">{reasonNotes}</p>}
        </div>
        <div className="border-t border-blue-200 pt-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Adjustment</p>
          <p className="font-semibold text-gray-900">{adjustmentLabel}</p>
          {refundNotes && <p className="text-sm text-gray-600 mt-1">{refundNotes}</p>}
        </div>
      </div>

      {/* Super Admin Auto-Approve Toggle */}
      {isSuperAdmin && (
        <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-purple-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-purple-900">Super Admin Option</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => onAutoApproveChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <p className="text-sm text-purple-700">
                {autoApprove ? (
                  <>
                    <strong>Auto-approve this return</strong> - Stock will be deducted immediately and
                    payment adjustment will be processed.
                  </>
                ) : (
                  <>
                    Return will be created in <strong>Pending Approval</strong> status. You can review and
                    approve later.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Non-Super Admin Info */}
      {!isSuperAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            This return will be submitted for <strong>Super Admin approval</strong>. Stock will not be
            affected until approved.
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const CreateReturnModal = ({ open, onClose, invoice, onSuccess, isSuperAdmin = false }) => {
  const toast = useToast();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 - Items
  const [selectedItems, setSelectedItems] = useState([]);
  const [inventoryBatches, setInventoryBatches] = useState([]);

  // Step 2 - Reason
  const [returnReason, setReturnReason] = useState("");
  const [reasonNotes, setReasonNotes] = useState("");

  // Step 3 - Adjustment
  const [adjustmentType, setAdjustmentType] = useState("");
  const [refundNotes, setRefundNotes] = useState("");

  // Step 4 - Review
  const [autoApprove, setAutoApprove] = useState(isSuperAdmin);

  // Load inventory batches for "add other" functionality
  useEffect(() => {
    if (open && invoice) {
      loadInventoryBatches();
    }
  }, [open, invoice]);

  const loadInventoryBatches = async () => {
    try {
      const response = await inventoryAPI.getAll({ limit: 1000 });
      setInventoryBatches(response.data?.inventory || []);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  };

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setSelectedItems([]);
      setReturnReason("");
      setReasonNotes("");
      setAdjustmentType("");
      setRefundNotes("");
      setAutoApprove(isSuperAdmin);
    }
  }, [open, isSuperAdmin]);

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return selectedItems.length > 0;
      case 2:
        return returnReason && (returnReason !== "OTHER" || reasonNotes.trim());
      case 3:
        return adjustmentType;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedItems, returnReason, reasonNotes, adjustmentType]);

  // Navigation
  const handleNext = () => {
    if (canProceed && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Submit
 const handleSubmit = async () => {
  if (!canProceed) return;

  setIsSubmitting(true);

  try {
    // Helper to ensure ISO datetime string
    const toISOString = (dateValue) => {
      if (!dateValue) return new Date().toISOString();
      if (typeof dateValue === 'string') {
        // Already ISO string
        if (dateValue.includes('T')) return dateValue;
        // Date only string
        return new Date(dateValue).toISOString();
      }
      if (dateValue instanceof Date) return dateValue.toISOString();
      return new Date().toISOString();
    };

    const payload = {
      parent_invoice_id: invoice.invoice_id,
      supplier_id: invoice.supplier_id,
      branch_id: invoice.branch_id || null,
      return_reason: returnReason,
      return_reason_notes: reasonNotes.trim() || null,
      adjustment_type: adjustmentType,
      refund_notes: refundNotes.trim() || null,
      invoice_date: new Date().toISOString(),
      remarks: null,
      lineItems: selectedItems.map((item) => ({
        medicine_id: item.medicine_id,
        batch_number: item.batch_number || "UNKNOWN",
        expiry_date: toISOString(item.expiry_date),
        quantity: parseFloat(item.quantity) || 1,
        purchase_rate: parseFloat(item.purchase_rate) || 0,
        mrp: parseFloat(item.mrp) || 0,
        cgst_percent: parseFloat(item.cgst_percent) || 0,
        sgst_percent: parseFloat(item.sgst_percent) || 0,
      })),
    };
      console.log("🚀 Return Payload:", JSON.stringify(payload, null, 2));
      const response = await purchaseAPI.createReturn(payload);

      const returnInvoice = response.data;
      const wasAutoApproved = returnInvoice.return_approval_status === "APPROVED";

      toast.success(
        "Return Created",
        wasAutoApproved
          ? `Return ${returnInvoice.invoice_number} created and auto-approved. Stock deducted.`
          : `Return ${returnInvoice.invoice_number} submitted for approval.`
      );

      onSuccess?.();
      onClose();
    } catch (error) {
    console.error("Create return error:", error);
    
    // ✅ ADD: Log detailed validation errors
    if (error.response?.data?.data) {
      console.error("Validation errors:", JSON.stringify(error.response.data.data, null, 2));
    }
    
    // Show more detailed error message
    let errorMessage = error.response?.data?.message || error.message;
    if (error.response?.data?.data?.issues) {
      const issues = error.response.data.data.issues;
      errorMessage = issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    }
    
    toast.error("Failed to Create Return", errorMessage);
  } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !invoice) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#000060]/40 backdrop-blur-sm"
            variants={ANIMATION_VARIANTS.backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={isSubmitting ? undefined : onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
            variants={ANIMATION_VARIANTS.panel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#000060] to-[#000080]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Package size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Create Purchase Return</h2>
                    <p className="text-sm text-white/70">
                      Return items from invoice{" "}
                      <span className="font-mono font-semibold">{invoice.invoice_number}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="shrink-0 px-6 py-6 bg-gray-50 border-b border-gray-200">
              <StepIndicator currentStep={currentStep} steps={STEPS} />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <Step1SelectItems
                    key="step1"
                    invoice={invoice}
                    selectedItems={selectedItems}
                    onItemsChange={setSelectedItems}
                    inventoryBatches={inventoryBatches}
                  />
                )}
                {currentStep === 2 && (
                  <Step2ReturnReason
                    key="step2"
                    returnReason={returnReason}
                    onReasonChange={setReturnReason}
                    reasonNotes={reasonNotes}
                    onNotesChange={setReasonNotes}
                  />
                )}
                {currentStep === 3 && (
                  <Step3AdjustmentType
                    key="step3"
                    adjustmentType={adjustmentType}
                    onAdjustmentChange={setAdjustmentType}
                    refundNotes={refundNotes}
                    onRefundNotesChange={setRefundNotes}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Review
                    key="step4"
                    invoice={invoice}
                    selectedItems={selectedItems}
                    returnReason={returnReason}
                    reasonNotes={reasonNotes}
                    adjustmentType={adjustmentType}
                    refundNotes={refundNotes}
                    isSuperAdmin={isSuperAdmin}
                    autoApprove={autoApprove}
                    onAutoApproveChange={setAutoApprove}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#000060] text-white hover:bg-[#000060]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    Next
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canProceed || isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Create Return
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CreateReturnModal;