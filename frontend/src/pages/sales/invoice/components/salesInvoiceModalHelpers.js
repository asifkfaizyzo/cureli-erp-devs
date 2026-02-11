// frontend/src/pages/sales/invoice/components/salesInvoiceModalHelpers.js

import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PauseCircle,
  AlertCircle,
  Wallet,
  IndianRupee 
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const NAVY = "#000060";
export const PAYMENT_BALANCE_THRESHOLD = 1;

export const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: Clock,
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    hoverBg: "hover:bg-yellow-200",
  },
  PARKED: {
    label: "Parked",
    icon: PauseCircle,
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    hoverBg: "hover:bg-blue-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    hoverBg: "hover:bg-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    hoverBg: "hover:bg-red-200",
  },
};

export const PAYMENT_STATUS_CONFIG = {
  UNPAID: {
    label: "Unpaid",
    icon: AlertCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    hoverBg: "hover:bg-red-200",
  },
  PARTIALLY_PAID: {
    label: "Partial",
    icon: Wallet,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    hoverBg: "hover:bg-amber-200",
  },
  PAID: {
    label: "Paid",
    icon: CheckCircle2,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
    hoverBg: "hover:bg-emerald-200",
  },
};

export const ANIMATION_VARIANTS = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  panel: {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  },
  dropdown: {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ════════════════════════════════════════════════════════════════════════════

export const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT DISPLAY HELPER
// ════════════════════════════════════════════════════════════════════════════

export const getEffectivePaymentDisplay = (invoice) => {
  if (!invoice) {
    return {
      effectiveStatus: 'UNPAID',
      showBalance: true,
      balance: 0,
      thresholdApplied: false,
      config: PAYMENT_STATUS_CONFIG.UNPAID,
    };
  }

  const netAmount = parseFloat(invoice.net_amount) || 0;
  const paidAmount = parseFloat(invoice.paid_amount) || 0;
  const rawBalance = netAmount - paidAmount;
  
  let effectiveStatus = invoice.payment_status || 'UNPAID';
  let showBalance = true;
  let thresholdApplied = false;

  if (rawBalance > 0 && rawBalance <= PAYMENT_BALANCE_THRESHOLD && paidAmount > 0) {
    effectiveStatus = 'PAID';
    showBalance = false;
    thresholdApplied = true;
  }

  return {
    effectiveStatus,
    showBalance,
    balance: rawBalance,
    thresholdApplied,
    config: PAYMENT_STATUS_CONFIG[effectiveStatus] || PAYMENT_STATUS_CONFIG.UNPAID,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// ✅ FIXED: ROW CALCULATION - MRP IS INCLUSIVE OF TAX
// ════════════════════════════════════════════════════════════════════════════

export const calculateEditRow = (row) => {
  const qty = parseFloat(row.qty) || 0;
  const mrp = parseFloat(row.mrp) || 0;
  const price = parseFloat(row.price) || mrp; // Default to MRP if no price
  
  // ✅ Calculate discount if selling price < MRP
  let discountPercent = parseFloat(row.discountPercent) || 0;
  if (price > 0 && price < mrp && !row.manualDiscount) {
    discountPercent = ((mrp - price) / mrp) * 100;
  }
  
  // ✅ MRP is INCLUSIVE of tax - no tax calculation needed
  const lineTotal = qty * price;
  const discountAmount = (qty * mrp * discountPercent) / 100;
  const taxableValue = lineTotal; // No tax to add
  
  return {
    ...row,
    price: price.toFixed(2),
    discountPercent: discountPercent.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxableValue: taxableValue.toFixed(2),
    cgstAmount: "0.00", // ✅ No separate tax
    sgstAmount: "0.00", // ✅ No separate tax
    amount: lineTotal.toFixed(2),
  };
};

// ════════════════════════════════════════════════════════════════════════════
// ✅ FIXED: EMPTY ROW TEMPLATE
// ════════════════════════════════════════════════════════════════════════════

export const makeEmptyRow = () => ({
  medicine_id: null,
  batch_id: null,
  inventory_id: null,
  name: "",
  batch: "",
  expiry: "",
  availableStock: 0,
  qty: "",
  mrp: "",
  price: "", // ✅ Will default to MRP when batch selected
  discountPercent: "",
  discountAmount: "",
  taxableValue: "",
  cgstPercent: "0", // ✅ Not used in display
  cgstAmount: "0",
  sgstPercent: "0", // ✅ Not used in display
  sgstAmount: "0",
  amount: "",
  manualDiscount: false, // Track if user manually set discount
});

// ════════════════════════════════════════════════════════════════════════════
// ✅ FIXED: TRANSFORM INVOICE TO ROWS
// ════════════════════════════════════════════════════════════════════════════

export const transformInvoiceToRows = (invoice) => {
  if (!invoice || !invoice.lineItems || invoice.lineItems.length === 0) {
    return [makeEmptyRow()];
  }

  console.log("🔄 Transforming invoice to rows:", invoice.lineItems);

  return invoice.lineItems.map((item, index) => {
    // ✅ DEBUG LOG
    console.log(`Item ${index}:`, item);
    
    // ✅ Get batch info (denormalized fields first, then inventory relation)
    const batchNumber = item.batch_number || item.inventory?.batch_number || "";
    const expiryDate = item.expiry_date 
      ? new Date(item.expiry_date) 
      : (item.inventory?.expiry_date ? new Date(item.inventory.expiry_date) : null);
    
    let expiryDisplay = "";
    if (expiryDate && !isNaN(expiryDate.getTime())) {
      const month = String(expiryDate.getMonth() + 1).padStart(2, "0");
      const year = String(expiryDate.getFullYear()).slice(-2);
      expiryDisplay = `${month}/${year}`;
    }

    // ✅ CRITICAL FIX: Get MRP and price from correct fields
    // The backend stores these in the line item directly
    const mrp = parseFloat(
      item.mrp ||                        // Line item MRP
      item.inventory?.mrp ||             // Inventory MRP
      0
    );
    
    // ✅ CRITICAL: selling_price might be a different field name
    const sellingPrice = parseFloat(
      item.selling_price ||               // Standard field
      item.rate ||                       // Alternative field name
      item.unit_price ||                  // Another possibility
      item.price ||                       // Fallback
      item.inventory?.selling_rate ||    // From inventory
      mrp                                 // Ultimate fallback
    );
    
    // ✅ Available stock
    const availableStock = parseFloat(
      item.inventory?.available_stock || 
      item.inventory?.current_stock || 
      item.available_stock ||
      0
    );

    // ✅ Calculate discount
    let discountPercent = parseFloat(item.discount_percent || 0);
    if (sellingPrice < mrp && sellingPrice > 0 && discountPercent === 0) {
      discountPercent = ((mrp - sellingPrice) / mrp) * 100;
    }

    const qty = parseFloat(item.quantity || 0);
    const lineTotal = parseFloat(item.line_total || (qty * sellingPrice));

    console.log(`✅ Transformed item ${index}:`, {
      name: item.medicine?.name,
      batch: batchNumber,
      expiry: expiryDisplay,
      mrp,
      sellingPrice,
      qty,
      availableStock,
    });

    return {
      // IDs
      medicine_id: item.medicine_id,
      batch_id: item.inventory_id || item.batch_id,
      inventory_id: item.inventory_id,
      
      // Display fields
      name: item.medicine?.name || "Unknown",
      batch: batchNumber,
      expiry: expiryDisplay,
      availableStock: availableStock,
      
      // Quantities
      qty: qty.toString(),
      
      // ✅ CRITICAL: Ensure these are strings with 2 decimal places
      mrp: mrp.toFixed(2),
      price: sellingPrice.toFixed(2),
      rate: sellingPrice.toFixed(2), // Add rate field too
      
      // Discounts
      discountPercent: discountPercent.toFixed(2),
      discountAmount: ((qty * mrp * discountPercent) / 100).toFixed(2),
      
      // Tax (MRP is inclusive)
      taxableValue: lineTotal.toFixed(2),
      cgstPercent: "0",
      cgstAmount: "0",
      sgstPercent: "0",
      sgstAmount: "0",
      
      // Total
      amount: lineTotal.toFixed(2),
      
      // Flags
      manualDiscount: parseFloat(item.discount_percent || 0) > 0,
    };
  });
};