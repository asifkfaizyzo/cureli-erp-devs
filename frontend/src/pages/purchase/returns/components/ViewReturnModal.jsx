// frontend/src/pages/purchase/returns/components/ViewReturnModal.jsx

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Package,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  User,
  Printer,
  Download,
  Info,
  CreditCard,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ════════════════════════════════════════════════════════════════════════════

const NAVY = "#000060";

const RETURN_REASON_LABELS = {
  DAMAGED_GOODS: "Damaged Goods",
  EXPIRED_GOODS: "Expired Goods",
  WRONG_ITEM_RECEIVED: "Wrong Item Received",
  QUALITY_ISSUE: "Quality Issue",
  EXCESS_STOCK: "Excess Stock",
  PRICE_DIFFERENCE: "Price Difference",
  OTHER: "Other",
};

const ADJUSTMENT_TYPE_LABELS = {
  CASH_REFUND: "Cash Refund",
  CREDIT_NOTE: "Credit Note",
  OFFSET_NEXT_PURCHASE: "Offset Next Purchase",
};

const APPROVAL_STATUS_CONFIG = {
  PENDING_APPROVAL: {
    label: "Pending Approval",
    icon: Clock,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
};

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
};

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

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const ViewReturnModal = ({ open, onClose, returnInvoice, onApprove, onReject, isSuperAdmin = false }) => {
  const [showApprovalActions, setShowApprovalActions] = useState(false);

   React.useEffect(() => {
    if (returnInvoice) {
      console.log("📦 Return Invoice Data:", returnInvoice);
      console.log("📦 Line Items:", returnInvoice.lineItems);
    }
  }, [returnInvoice]);

  if (!open || !returnInvoice) return null;

  const approvalStatus = returnInvoice.return_approval_status;
  const statusConfig = APPROVAL_STATUS_CONFIG[approvalStatus] || APPROVAL_STATUS_CONFIG.PENDING_APPROVAL;
  const StatusIcon = statusConfig.icon;

  const canApprove = isSuperAdmin && approvalStatus === "PENDING_APPROVAL";

  const totalQty = returnInvoice.lineItems?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;

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
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
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
                    <h2 className="text-xl font-bold text-white">Return Invoice</h2>
                    <p className="text-sm text-white/70 font-mono">{returnInvoice.invoice_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span
                    className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border-2
                      ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
                    `}
                  >
                    <StatusIcon size={16} />
                    {statusConfig.label}
                  </span>

                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex">
                {/* Left Panel - Details */}
                <div className="w-80 shrink-0 border-r border-gray-200 bg-gray-50 p-6 space-y-6">
                  {/* Parent Invoice */}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
                      <FileText size={14} />
                      Original Invoice
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="font-mono font-semibold text-[#000060]">
                        {returnInvoice.parentInvoice?.invoice_number || "N/A"}
                      </p>
                      {returnInvoice.parentInvoice?.invoice_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(returnInvoice.parentInvoice.invoice_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Supplier */}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
                      <Building2 size={14} />
                      Supplier
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900">{returnInvoice.supplier?.name || "N/A"}</p>
                      {returnInvoice.supplier?.supplier_code && (
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {returnInvoice.supplier.supplier_code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Return Details */}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
                      <AlertTriangle size={14} />
                      Return Details
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reason</p>
                        <p className="font-medium text-gray-900">
                          {RETURN_REASON_LABELS[returnInvoice.return_reason] || returnInvoice.return_reason}
                        </p>
                        {returnInvoice.return_reason_notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{returnInvoice.return_reason_notes}"</p>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-500 mb-1">Adjustment Type</p>
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-[#000060]" />
                          <p className="font-medium text-gray-900">
                            {ADJUSTMENT_TYPE_LABELS[returnInvoice.adjustment_type] || returnInvoice.adjustment_type}
                          </p>
                        </div>
                        {returnInvoice.refund_notes && (
                          <p className="text-xs text-gray-600 mt-2">{returnInvoice.refund_notes}</p>
                        )}
                      </div>

                      {returnInvoice.credit_note_number && (
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs text-gray-500 mb-1">Credit Note</p>
                          <p className="font-mono font-semibold text-emerald-600">
                            {returnInvoice.credit_note_number}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
                      <IndianRupee size={14} />
                      Amount
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{formatCurrency(returnInvoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">{formatCurrency(returnInvoice.total_tax)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-[#000060]">
                              {formatCurrency(returnInvoice.net_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Info */}
                  {(returnInvoice.approved_by || returnInvoice.rejected_by) && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
                        <Shield size={14} />
                        {approvalStatus === "APPROVED" ? "Approved By" : "Rejected By"}
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={16} className="text-gray-400" />
                          <p className="font-medium text-gray-900">
                            {approvalStatus === "APPROVED"
                              ? returnInvoice.approver?.full_name
                              : returnInvoice.rejecter?.full_name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {approvalStatus === "APPROVED"
                            ? formatDateTime(returnInvoice.approved_at)
                            : formatDateTime(returnInvoice.rejected_at)}
                        </p>
                        {returnInvoice.rejection_reason && (
                          <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                            <p className="text-xs text-red-700">{returnInvoice.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Creator Info */}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-3">
                      <Calendar size={14} />
                      Created
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900">{returnInvoice.creator?.full_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDateTime(returnInvoice.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Items Table */}
                <div className="flex-1 flex flex-col">
                  {/* Table Header */}
                  <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-gray-600" />
                        <h3 className="font-semibold text-gray-900">Line Items</h3>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#000060] text-white">
                          {returnInvoice.lineItems?.length || 0} items
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="flex-1 overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <th className="px-4 py-3 text-center w-12">#</th>
                          <th className="px-4 py-3 text-left min-w-[200px]">Product</th>
                          <th className="px-4 py-3 text-center w-32">Batch</th>
                          <th className="px-4 py-3 text-center w-24">Expiry</th>
                          <th className="px-4 py-3 text-right w-20">Qty</th>
                          <th className="px-4 py-3 text-right w-24">Rate</th>
                          <th className="px-4 py-3 text-right w-24">MRP</th>
                          <th className="px-4 py-3 text-center w-16">GST%</th>
                          <th className="px-4 py-3 text-right w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
  {returnInvoice.lineItems && returnInvoice.lineItems.length > 0 ? (
    returnInvoice.lineItems.map((item, index) => {
      const gstPercent = (parseFloat(item.cgst_percent) || 0) + (parseFloat(item.sgst_percent) || 0);
      
      // ✅ Calculate line_total if missing
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.purchase_rate) || 0;
      const subtotal = qty * rate;
      const taxAmount = subtotal * (gstPercent / 100);
      const calculatedLineTotal = subtotal + taxAmount;
      const lineTotal = item.line_total || calculatedLineTotal;

      return (
        <tr key={item.item_id || `item-${index}`} className="hover:bg-gray-50 transition-colors">
          <td className="px-4 py-3 text-center">
            <span className="text-xs font-mono text-gray-500">
              {String(index + 1).padStart(2, "0")}
            </span>
          </td>
          <td className="px-4 py-3">
            <p className="font-medium text-gray-900">{item.medicine?.name || item.name || "Unknown"}</p>
            {(item.medicine?.manufacturer || item.manufacturer) && (
              <p className="text-xs text-gray-500">{item.medicine?.manufacturer || item.manufacturer}</p>
            )}
          </td>
          <td className="px-4 py-3 text-center">
            <span className="font-mono text-xs px-2 py-1 bg-gray-100 rounded border border-gray-200">
              {item.batch_number || "N/A"}
            </span>
          </td>
          <td className="px-4 py-3 text-center text-sm text-gray-600">
            {formatDate(item.expiry_date)}
          </td>
          <td className="px-4 py-3 text-right font-bold text-gray-900">
            {qty}
          </td>
          <td className="px-4 py-3 text-right text-sm text-gray-700">
            {formatCurrency(rate)}
          </td>
          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
            {formatCurrency(item.mrp || 0)}
          </td>
          <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">
            {gstPercent.toFixed(0)}%
          </td>
          <td className="px-4 py-3 text-right font-bold text-[#000060]">
            {formatCurrency(lineTotal)}
          </td>
        </tr>
      );
    })
  ) : (
                          <tr>
                            <td colSpan={9} className="px-4 py-20 text-center">
                              <Package size={48} className="mx-auto text-gray-300 mb-3" />
                              <p className="text-gray-500">No items found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>

                     {returnInvoice.lineItems && returnInvoice.lineItems.length > 0 && (
  <tfoot className="sticky bottom-0 border-t-2 border-gray-300 bg-white">
    <tr className="text-sm font-semibold">
      <td colSpan={4} className="px-4 py-4 text-right text-gray-600">
        Grand Totals
      </td>
      <td className="px-4 py-4 text-right text-[#000060] font-bold">
        {totalQty.toFixed(0)}
      </td>
      <td colSpan={3}></td>
      <td className="px-4 py-4 text-right">
        <span className="text-xl font-bold text-[#000060]">
          {formatCurrency(Math.abs(returnInvoice.net_amount || 0))}
        </span>
      </td>
    </tr>
  </tfoot>
)}
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {}}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  onClick={() => {}}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>

              <div className="flex items-center gap-3">
                {canApprove && (
                  <>
                    <button
                      onClick={() => onReject?.(returnInvoice)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 transition-colors font-medium"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                    <button
                      onClick={() => onApprove?.(returnInvoice)}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shadow-lg"
                    >
                      <CheckCircle2 size={18} />
                      Approve Return
                    </button>
                  </>
                )}

                {!canApprove && (
                  <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-[#000060] text-white hover:bg-[#000060]/90 transition-colors font-medium"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Approval Actions Info */}
            {canApprove && (
              <div className="shrink-0 px-6 py-3 bg-amber-50 border-t border-amber-200">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-amber-600" />
                  <p className="text-sm text-amber-700">
                    <strong>Approving</strong> will deduct stock and process payment adjustment.{" "}
                    <strong>Rejecting</strong> will cancel this return without affecting inventory.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ViewReturnModal;