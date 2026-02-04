// frontend/src/pages/purchase/invoice/components/invoiceModalHelpers.js
// Shared utilities and constants for Invoice Modal components

import { Clock, CheckCircle2, XCircle, Wallet, AlertCircle } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const NAVY = "#000060";

/**
 * Minimum balance amount to be considered as PARTIALLY_PAID
 * If balance <= this threshold, treat as PAID (handles rounding)
 */
export const PAYMENT_BALANCE_THRESHOLD = 10;

export const ANIMATION_VARIANTS = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  panel: {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
  },
  dropdown: {
    hidden: { opacity: 0, scale: 0.95, y: -8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.15 } },
  },
};

export const STATUS_CONFIG = {
  DRAFT: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    icon: Clock,
    label: "Draft",
    hoverBg: "hover:bg-yellow-200",
  },
  CONFIRMED: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    icon: CheckCircle2,
    label: "Confirmed",
    hoverBg: "hover:bg-green-200",
  },
  CANCELLED: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    icon: XCircle,
    label: "Cancelled",
    hoverBg: "",
  },
};

export const PAYMENT_STATUS_CONFIG = {
  PAID: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
    icon: CheckCircle2,
    label: "Paid",
    hoverBg: "hover:bg-emerald-200",
    gradient: "from-emerald-500 to-emerald-600",
  },
  PARTIALLY_PAID: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    icon: Wallet,
    label: "Partial",
    hoverBg: "hover:bg-amber-200",
    gradient: "from-amber-500 to-amber-600",
  },
  UNPAID: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    icon: AlertCircle,
    label: "Unpaid",
    hoverBg: "hover:bg-red-200",
    gradient: "from-red-500 to-red-600",
  },
};

export const PAYMENT_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT", label: "Credit" },
];

// ════════════════════════════════════════════════════════════════════════════
// CALCULATION HELPERS
// ════════════════════════════════════════════════════════════════════════════

export const calculateEditRow = (row) => {
  const qty = Number(row.qty) || 0;
  const price = Number(row.price) || 0;
  const gross = qty * price;

  const schPct = Number(row.schemePercent) || 0;
  const schemeAmount = +(gross * schPct / 100).toFixed(2);
  const afterScheme = gross - schemeAmount;

  const discPct = Number(row.discountPercent) || 0;
  const discountAmount = +(afterScheme * discPct / 100).toFixed(2);
  const taxableValue = +(afterScheme - discountAmount).toFixed(2);

  const cgstPct = Number(row.cgstPercent) || 0;
  const sgstPct = Number(row.sgstPercent) || 0;
  const cgstAmount = +(taxableValue * cgstPct / 100).toFixed(2);
  const sgstAmount = +(taxableValue * sgstPct / 100).toFixed(2);
  const amount = +(taxableValue + cgstAmount + sgstAmount).toFixed(2);

  const netRate = qty > 0 ? +(taxableValue / qty).toFixed(2) : 0;

  return {
    ...row,
    schemeAmount,
    discountAmount,
    taxableValue,
    cgstAmount,
    sgstAmount,
    amount,
    netRate: netRate.toString(),
  };
};

export const makeEmptyRow = () => ({
  medicine_id: null,
  name: "",
  mfac: "",
  batch: "",
  hsn: "",
  exp: "",
  pack: "",
  pQty: "",
  qty: "",
  price: "",
  schemePercent: "",
  discountPercent: "",
  cgstPercent: "6",
  sgstPercent: "6",
  mrp: "",
  rack: "",
  sRate: "",
  sch: "",
  netRate: "",
  amount: "0",
});

export const transformInvoiceToRows = (inv) => {
  if (!inv?.lineItems) return [];

  return inv.lineItems.map((item) => {
    let expiry = "";
    if (item.expiry_date) {
      const expDate = new Date(item.expiry_date);
      const month = String(expDate.getMonth() + 1).padStart(2, "0");
      const year = String(expDate.getFullYear()).slice(-2);
      expiry = `${month}/${year}`;
    }

    const row = {
      medicine_id: item.medicine_id,
      name: item.medicine?.name || "Unknown Product",
      mfac: item.medicine?.manufacturer || "",
      batch: item.batch_number || "",
      hsn: item.medicine?.hsn_code || "",
      exp: expiry,
      pack: item.pack_size || "",
      pQty: (item.free_quantity || 0).toString(),
      qty: (item.quantity || 0).toString(),
      price: (item.purchase_rate || 0).toString(),
      schemePercent: (item.scheme_discount || 0).toString(),
      discountPercent: (item.trade_discount || 0).toString(),
      cgstPercent: (item.cgst_percent || 0).toString(),
      sgstPercent: (item.sgst_percent || 0).toString(),
      mrp: (item.mrp || 0).toString(),
      rack: item.rack_no || "",
      sRate: item.selling_rate?.toString() || "",
      sch: (item.free_quantity || 0).toString(),
      netRate: "",
      amount: "",
    };

    return calculateEditRow(row);
  });
};

// ════════════════════════════════════════════════════════════════════════════
// FORMAT HELPERS
// ════════════════════════════════════════════════════════════════════════════

export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT STATUS HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calculate payment status from amounts with threshold
 * - If balance <= threshold (default 10), treat as PAID (handles small rounding differences)
 * - If paid amount is 0, treat as UNPAID
 * - Otherwise, PARTIALLY_PAID
 * 
 * @param {number|string} paidAmount - Amount paid
 * @param {number|string} netAmount - Total invoice amount
 * @param {number} threshold - Minimum balance to be partially paid (default: PAYMENT_BALANCE_THRESHOLD)
 * @returns {string} - "PAID" | "PARTIALLY_PAID" | "UNPAID"
 */
export const calculatePaymentStatus = (paidAmount, netAmount, threshold = PAYMENT_BALANCE_THRESHOLD) => {
  const paid = parseFloat(paidAmount) || 0;
  const net = parseFloat(netAmount) || 0;
  const balance = net - paid;
  
  // If nothing paid
  if (paid <= 0) return "UNPAID";
  
  // If balance is within threshold, treat as fully paid
  if (balance <= threshold) return "PAID";
  
  // Otherwise, partially paid
  return "PARTIALLY_PAID";
};

/**
 * Calculate payment details with threshold handling
 * Returns normalized values for display
 * 
 * @param {number|string} paidAmount - Amount paid
 * @param {number|string} netAmount - Total invoice amount
 * @param {number} threshold - Minimum balance to be partially paid (default: PAYMENT_BALANCE_THRESHOLD)
 * @returns {Object} - { status, paidAmount, balanceAmount, effectiveStatus }
 */
export const calculatePaymentDetails = (paidAmount, netAmount, threshold = PAYMENT_BALANCE_THRESHOLD) => {
  const paid = parseFloat(paidAmount) || 0;
  const net = parseFloat(netAmount) || 0;
  const rawBalance = net - paid;

  // If nothing paid
  if (paid <= 0) {
    return {
      status: "UNPAID",
      paidAmount: 0,
      balanceAmount: net,
      rawBalance: net,
      thresholdApplied: false,
    };
  }

  // If balance is within threshold, treat as fully paid
  if (rawBalance <= threshold) {
    return {
      status: "PAID",
      paidAmount: net, // Normalize to full amount for display
      balanceAmount: 0,
      rawBalance: rawBalance,
      thresholdApplied: rawBalance > 0, // True if threshold was applied
    };
  }

  // Otherwise, partially paid
  return {
    status: "PARTIALLY_PAID",
    paidAmount: paid,
    balanceAmount: rawBalance,
    rawBalance: rawBalance,
    thresholdApplied: false,
  };
};

/**
 * Get effective payment status config based on actual amounts
 * This handles the threshold logic for UI display
 * 
 * @param {Object} invoice - Invoice object with payment_status, paid_amount, net_amount
 * @returns {Object} - { effectiveStatus, config, balance, showBalance }
 */
export const getEffectivePaymentDisplay = (invoice) => {
  if (!invoice) {
    return {
      effectiveStatus: "UNPAID",
      config: PAYMENT_STATUS_CONFIG.UNPAID,
      balance: 0,
      showBalance: false,
    };
  }

  const paid = parseFloat(invoice.paid_amount) || 0;
  const net = parseFloat(invoice.net_amount) || 0;
  const rawBalance = net - paid;

  // Calculate effective status with threshold
  let effectiveStatus = invoice.payment_status;
  
  if (paid > 0 && rawBalance <= PAYMENT_BALANCE_THRESHOLD) {
    effectiveStatus = "PAID";
  }

  const config = PAYMENT_STATUS_CONFIG[effectiveStatus] || PAYMENT_STATUS_CONFIG.UNPAID;
  
  // Only show balance if > threshold
  const showBalance = rawBalance > PAYMENT_BALANCE_THRESHOLD;
  const displayBalance = showBalance ? rawBalance : 0;

  return {
    effectiveStatus,
    config,
    balance: displayBalance,
    rawBalance,
    showBalance,
    thresholdApplied: effectiveStatus === "PAID" && rawBalance > 0 && rawBalance <= PAYMENT_BALANCE_THRESHOLD,
  };
};