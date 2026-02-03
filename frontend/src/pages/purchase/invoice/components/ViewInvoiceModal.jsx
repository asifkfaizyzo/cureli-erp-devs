// frontend/src/pages/purchase/invoice/components/ViewInvoiceModal.jsx
// White & Navy Theme with Inline Super Admin Edit Support for ANY Status

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Printer,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  User,
  MapPin,
  Package,
  Building2,
  Phone,
  Mail,
  Hash,
  AlertCircle,
  CheckCircle2,
  Download,
  Sparkles,
  IndianRupee,
  Receipt,
  Shield,
  ExternalLink,
  AlertTriangle,
  Save,
  ArrowLeft,
  RefreshCw,
  Plus,
  ChevronUp,
  ChevronDown,
  Loader2,
  XCircle,
} from "lucide-react";

import { useToast } from "../../../../components/common/Toast";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import purchaseAPI from "../../../../api/purchase";
import medicinesAPI from "../../../../api/medicines";

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ════════════════════════════════════════════════════════════════════════════

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

const NAVY = "#000060";

// ════════════════════════════════════════════════════════════════════════════
// CALCULATION HELPER
// ════════════════════════════════════════════════════════════════════════════

const calculateEditRow = (row) => {
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

  // Calculate net rate (taxable / qty)
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

const makeEmptyRow = () => ({
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

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const ViewInvoiceModal = ({
  open,
  onClose,
  invoice,
  onPrint,
  onEdit,
  onDelete,
  onRefresh,
  isSuperAdmin = false,
}) => {
  const toast = useToast();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [editRows, setEditRows] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [medicinesLoading, setMedicinesLoading] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
  });

  const tableBodyRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Reset mode when modal closes or invoice changes
  useEffect(() => {
    if (open && invoice) {
      setMode('view');
      setEditRows([]);
      setOriginalData(null);
      console.log("📦 Invoice loaded:", invoice);
    }
  }, [open, invoice?.invoice_id]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) {
        if (mode === 'edit') {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, mode]);

  // Load medicines when entering edit mode
  useEffect(() => {
    if (mode === 'edit' && medicines.length === 0) {
      loadMedicines();
    }
  }, [mode]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadMedicines = async () => {
    try {
      setMedicinesLoading(true);
      const response = await medicinesAPI.getAll({
        isActive: true,
        limit: 1000,
      });

      const formattedMedicines = response.data.medicines.map((med) => ({
        id: med.medicine_id,
        medicine_id: med.medicine_id,
        name: med.name,
        genericName: med.generic_name,
        manufacturer: med.manufacturer,
        mfac: med.manufacturer,
        hsnCode: med.hsn_code,
        hsn: med.hsn_code,
        packSize: med.pack_size,
        pack: med.pack_size,
        rackNo: med.rack_no,
        rack: med.rack_no,
        cgstPercent: med.cgst_percentage?.toString() || "6",
        sgstPercent: med.sgst_percentage?.toString() || "6",
      }));

      setMedicines(formattedMedicines);
    } catch (error) {
      console.error("Load medicines error:", error);
      toast.error("Failed to load medicines");
    } finally {
      setMedicinesLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT MODE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const transformInvoiceToRows = useCallback((inv) => {
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
  }, []);

  const handleEnterEditMode = useCallback(() => {
    const rows = transformInvoiceToRows(invoice);
    
    // Ensure minimum 5 rows
    while (rows.length < 5) {
      rows.push(makeEmptyRow());
    }
    
    setEditRows(rows);
    setOriginalData(JSON.parse(JSON.stringify(invoice)));
    setMode('edit');
  }, [invoice, transformInvoiceToRows]);

  const handleCancelEdit = useCallback(() => {
    const hasChanges = JSON.stringify(editRows) !== JSON.stringify(transformInvoiceToRows(originalData));
    
    if (hasChanges) {
      setConfirmDialog({
        isOpen: true,
        type: 'warning',
        title: 'Discard Changes?',
        message: (
          <div className="space-y-2">
            <p>You have unsaved changes. Are you sure you want to discard them?</p>
            <p className="text-sm text-amber-600 font-medium">
              All changes will be lost.
            </p>
          </div>
        ),
        confirmText: 'Discard',
        onConfirm: () => {
          setMode('view');
          setEditRows([]);
          setOriginalData(null);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setMode('view');
      setEditRows([]);
      setOriginalData(null);
    }
  }, [editRows, originalData, transformInvoiceToRows]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ROW OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleRowChange = useCallback((index, key, value) => {
    setEditRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [key]: value };
      newRows[index] = calculateEditRow(newRows[index]);
      return newRows;
    });
  }, []);

  const handleProductSelect = useCallback((index, product) => {
    setEditRows(prev => {
      const newRows = [...prev];
      newRows[index] = {
        ...newRows[index],
        medicine_id: product.medicine_id || product.id,
        name: product.name,
        mfac: product.manufacturer || product.mfac || "",
        hsn: product.hsnCode || product.hsn || "",
        pack: product.packSize || product.pack || "",
        rack: product.rackNo || product.rack || "",
        cgstPercent: product.cgstPercent || "6",
        sgstPercent: product.sgstPercent || "6",
      };
      newRows[index] = calculateEditRow(newRows[index]);
      return newRows;
    });
  }, []);

  const handleAddRow = useCallback(() => {
    setEditRows(prev => [...prev, makeEmptyRow()]);
  }, []);

  const handleRemoveRow = useCallback((index) => {
    if (editRows.length <= 1) return;
    setEditRows(prev => prev.filter((_, i) => i !== index));
  }, [editRows.length]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSave = useCallback(async () => {
    // Filter filled rows
    const filledRows = editRows.filter(r => r.name && r.qty && parseFloat(r.qty) > 0);
    
    if (filledRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return;
    }

    // Validate all rows have medicine_id
    const missingMedicines = filledRows.filter(r => !r.medicine_id);
    if (missingMedicines.length > 0) {
      toast.warning(
        "Invalid Products",
        `${missingMedicines.length} product(s) not found in master. Please select from dropdown.`
      );
      return;
    }

    const isConfirmed = invoice.status === "CONFIRMED";

    // Show confirmation for confirmed invoice
    if (isConfirmed) {
      setConfirmDialog({
        isOpen: true,
        type: 'warning',
        title: 'Update Confirmed Invoice',
        message: (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Shield className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-amber-800">Super Admin Action</p>
                <p className="text-sm text-amber-700 mt-1">
                  You are updating a confirmed invoice.
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                Stock Adjustment Warning
              </p>
              <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                <li>Current stock from this invoice will be <strong>reversed</strong></li>
                <li>New stock based on updated quantities will be <strong>added</strong></li>
                <li>This action is <strong>logged in audit trail</strong></li>
              </ul>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
              <p className="font-medium text-gray-900">Invoice: {invoice.invoice_number}</p>
              <p>Original Items: {invoice.lineItems?.length || 0}</p>
              <p>Updated Items: {filledRows.length}</p>
            </div>
          </div>
        ),
        confirmText: 'Update Invoice',
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          performSave(filledRows);
        },
      });
    } else {
      await performSave(filledRows);
    }
  }, [editRows, invoice, toast]);

const performSave = useCallback(async (filledRows) => {
  setIsSaving(true);
  
  try {
    // ✅ Parse expiry date helper - converts MM/YY to ISO datetime
    const parseExpiryDate = (expString) => {
      if (!expString || !/^\d{2}\/\d{2}$/.test(expString)) {
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        return defaultDate.toISOString();
      }

      const [month, year] = expString.split("/");
      const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      const date = new Date(`${fullYear}-${month}-01`);
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      return date.toISOString();
    };

    // ✅ Convert any date to ISO datetime format
    const toISODateTime = (dateStr) => {
      if (!dateStr) return null;
      // Already in ISO format with T
      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        return dateStr;
      }
      // Date object
      if (dateStr instanceof Date) {
        return dateStr.toISOString();
      }
      // Date string without time (YYYY-MM-DD)
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return `${dateStr}T00:00:00.000Z`;
      }
      // Try to parse and convert
      try {
        return new Date(dateStr).toISOString();
      } catch {
        return null;
      }
    };

    // ✅ Build line items matching lineItemSchema EXACTLY
    const lineItems = filledRows.map((row) => ({
      medicine_id: row.medicine_id, // Required: z.string().uuid()
      batch_number: row.batch || `BATCH-${Date.now()}`, // Required: z.string().max(50)
      expiry_date: parseExpiryDate(row.exp), // Required: z.string().datetime()
      manufacturing_date: null, // Optional
      quantity: parseFloat(row.qty) || 1, // Required: z.number().positive()
      free_quantity: parseFloat(row.sch || row.pQty) || 0, // Default: 0
      pack_size: row.pack || null, // Optional
      unit_of_measure: "UNIT", // Default: "UNIT"
      purchase_rate: parseFloat(row.price) || 0.01, // Required: z.number().positive() - must be > 0
      mrp: parseFloat(row.mrp) || 0.01, // Required: z.number().positive() - must be > 0
      scheme_discount: parseFloat(row.schemePercent) || 0,
      trade_discount: parseFloat(row.discountPercent) || 0,
      cgst_percent: parseFloat(row.cgstPercent) || 0,
      sgst_percent: parseFloat(row.sgstPercent) || 0,
      igst_percent: 0,
      selling_rate: parseFloat(row.sRate) || null, // Optional but must be positive if provided
      margin_percent: null,
      rack_no: row.rack || null,
    }));

    // ✅ Validate line items before sending
    const invalidItems = lineItems.filter(item => 
      !item.medicine_id || 
      item.quantity <= 0 || 
      item.purchase_rate <= 0 || 
      item.mrp <= 0
    );

    if (invalidItems.length > 0) {
      toast.error("Invalid Items", "Some items have missing or invalid data");
      setIsSaving(false);
      return;
    }

    // ✅ Build payload matching updatePurchaseInvoiceSchema EXACTLY
    // DO NOT include: supplier_id, branch_id, action (not in schema!)
    const payload = {
      // Optional fields only
      supplier_invoice_no: invoice.supplier_invoice_no || null,
      invoice_date: toISODateTime(invoice.invoice_date), // Must be ISO datetime
      due_date: toISODateTime(invoice.due_date),
      received_date: toISODateTime(invoice.received_date),
      payment_mode: invoice.payment_mode || null,
      paid_amount: parseFloat(invoice.paid_amount) || null,
      transport_charges: parseFloat(invoice.transport_charges) || null,
      other_charges: parseFloat(invoice.other_charges) || null,
      remarks: invoice.remarks || null,
      lineItems, // The updated line items
    };

    // ✅ Remove null/undefined optional fields to keep payload clean
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    // ✅ Debug: Log the payload before sending
    console.group("📤 Update Payload Debug");
    console.log("Invoice ID:", invoice.invoice_id);
    console.log("Payload:", JSON.stringify(cleanPayload, null, 2));
    console.log("Line Items Count:", lineItems.length);
    console.groupEnd();
    console.log("Sending to API:", {
  url: `/purchase/${invoice.invoice_id}`,
  method: 'PUT',
  payload: cleanPayload
});
    await purchaseAPI.update(invoice.invoice_id, cleanPayload);

    toast.success(
      "Invoice Updated",
      invoice.status === "CONFIRMED" 
        ? `Confirmed invoice ${invoice.invoice_number} updated. Stock levels adjusted.`
        : `Invoice ${invoice.invoice_number} updated successfully.`
    );

    setMode('view');
    setEditRows([]);
    setOriginalData(null);

    if (onRefresh) {
      onRefresh();
    }

  } catch (error) {
    console.error("Save error:", error);
    
    // ✅ Better error parsing
    let errorMessage = "Failed to update invoice";
    
    if (error.response?.data) {
      const { message, data } = error.response.data;
      
      // If data contains Zod errors array
      if (Array.isArray(data)) {
        errorMessage = data.map(err => {
          const path = err.path?.join('.') || 'field';
          return `${path}: ${err.message}`;
        }).join('; ');
      } else if (message) {
        errorMessage = message;
      }
      
      console.error("Error details:", error.response.data);
    }
    
    toast.error("Update Failed", errorMessage);
  } finally {
    setIsSaving(false);
  }
}, [invoice, toast, onRefresh]);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  const editSummary = useMemo(() => {
    const taxable = editRows.reduce((s, r) => s + (Number(r.taxableValue) || 0), 0);
    const cgst = editRows.reduce((s, r) => s + (Number(r.cgstAmount) || 0), 0);
    const sgst = editRows.reduce((s, r) => s + (Number(r.sgstAmount) || 0), 0);
    const totalItems = editRows.filter(r => r.name).length;
    const totalQty = editRows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const totalFree = editRows.reduce((s, r) => s + (Number(r.sch || r.pQty) || 0), 0);

    return {
      subTotal: +taxable.toFixed(2),
      cgst: +cgst.toFixed(2),
      sgst: +sgst.toFixed(2),
      total: +(taxable + cgst + sgst).toFixed(2),
      totalItems,
      totalQty,
      totalFree,
    };
  }, [editRows]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDS
  // ═══════════════════════════════════════════════════════════════════════════

  if (!open || !invoice) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Status checks
  const isDraft = invoice.status === "DRAFT";
  const isConfirmed = invoice.status === "CONFIRMED";
  const isCancelled = invoice.status === "CANCELLED";

  // Super admin can edit ANY status (except cancelled)
  const canEdit = isSuperAdmin && !isCancelled;
  const canDelete = !isConfirmed && !isCancelled;

  const statusConfig = {
    DRAFT: {
      bg: "bg-[#000060]/10",
      text: "text-[#000060]",
      border: "border-[#000060]/30",
      icon: Clock,
      label: "Draft",
    },
    CONFIRMED: {
      bg: "bg-[#000060]",
      text: "text-white",
      border: "border-[#000060]",
      icon: CheckCircle2,
      label: "Confirmed",
    },
    CANCELLED: {
      bg: "bg-[#000060]/5",
      text: "text-[#000060]/60",
      border: "border-[#000060]/20",
      icon: XCircle,
      label: "Cancelled",
    },
  };

  const paymentConfig = {
    PAID: { bg: "bg-[#000060]", text: "text-white", label: "Paid" },
    PARTIALLY_PAID: {
      bg: "bg-[#000060]/20",
      text: "text-[#000060]",
      label: "Partial",
    },
    UNPAID: {
      bg: "bg-[#000060]/10",
      text: "text-[#000060]/70",
      label: "Unpaid",
    },
  };

  const currentStatus = statusConfig[invoice.status] || statusConfig.DRAFT;
  const currentPayment = paymentConfig[invoice.payment_status] || paymentConfig.UNPAID;
  const StatusIcon = currentStatus.icon;

  // View mode calculations
  const totalQty = invoice.lineItems?.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0),
    0
  ) || 0;
  const totalFree = invoice.lineItems?.reduce(
    (sum, item) => sum + (parseFloat(item.free_quantity) || 0),
    0
  ) || 0;
  const itemCount = invoice.lineItems?.length || 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#000060]/40 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={mode === 'view' ? onClose : undefined}
          />

          {/* Main Panel */}
          <motion.div
            className={`relative w-full max-w-[95vw] h-[95vh] rounded-2xl overflow-hidden flex flex-col bg-white ${
              mode === 'edit' && isConfirmed ? 'ring-2 ring-amber-400' : ''
            }`}
            style={{
              boxShadow:
                "0 25px 80px rgba(0, 0, 96, 0.25), 0 0 0 1px rgba(0, 0, 96, 0.1)",
            }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Decorative elements */}
            <div
              className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-[0.03]"
              style={{
                background: `radial-gradient(circle, ${NAVY} 0%, transparent 70%)`,
              }}
            />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className={`shrink-0 px-6 py-4 border-b relative z-10 bg-white ${
              mode === 'edit' ? 'border-amber-300' : 'border-[#000060]/10'
            }`}>
              <div className="flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                        mode === 'edit' ? 'bg-amber-500' : ''
                      }`}
                      style={mode === 'view' ? {
                        background: NAVY,
                        boxShadow: "0 8px 24px rgba(0, 0, 96, 0.3)",
                      } : {}}
                    >
                      {mode === 'edit' ? (
                        <Pencil size={24} className="text-white" />
                      ) : (
                        <Receipt size={24} className="text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[#000060]/50 text-xs uppercase tracking-widest mb-1">
                        {mode === 'edit' ? (
                          <>
                            <Shield size={12} className="text-amber-600" />
                            <span className="text-amber-600">Editing Invoice</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            <span>Purchase Invoice</span>
                          </>
                        )}
                      </div>
                      <h1 className="text-2xl font-bold text-[#000060] tracking-tight">
                        {invoice.invoice_number}
                      </h1>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
                    >
                      <StatusIcon size={12} />
                      {currentStatus.label}
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${currentPayment.bg} ${currentPayment.text}`}
                    >
                      {currentPayment.label}
                    </span>

                    {mode === 'edit' && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                        <Shield size={10} />
                        Editing Mode
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side - Stats & Actions */}
                <div className="flex items-center gap-6">
                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-[#000060]/5 border border-[#000060]/10">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#000060]">
                        {mode === 'edit' ? editSummary.totalItems : itemCount}
                      </div>
                      <div className="text-[10px] text-[#000060]/50 uppercase">
                        Items
                      </div>
                    </div>
                    <div className="w-px h-8 bg-[#000060]/10" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#000060]">
                        {mode === 'edit' 
                          ? formatCurrency(editSummary.total)
                          : formatCurrency(invoice.net_amount)
                        }
                      </div>
                      <div className="text-[10px] text-[#000060]/50 uppercase">
                        Total
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {mode === 'view' ? (
                      <>
                        {/* View Mode Actions */}
                        <button
                          onClick={onPrint}
                          className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-[#000060]/10 text-[#000060] transition-all border border-[#000060]/10 hover:border-[#000060]/20"
                          title="Print Invoice"
                        >
                          <Printer size={18} />
                        </button>

                        <button
                          className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-[#000060]/10 text-[#000060] transition-all border border-[#000060]/10 hover:border-[#000060]/20"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>

                        {canEdit && (
                          <button
                            onClick={handleEnterEditMode}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all border ${
                              isConfirmed
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 hover:border-amber-400"
                                : "bg-[#000060]/10 hover:bg-[#000060]/20 text-[#000060] border-[#000060]/20 hover:border-[#000060]/30"
                            }`}
                            title={isConfirmed ? "Edit Confirmed Invoice (Super Admin)" : "Edit Invoice"}
                          >
                            {isConfirmed ? <Shield size={16} /> : <Pencil size={16} />}
                            <span className="text-sm font-medium">
                              {isConfirmed ? "Admin Edit" : "Edit"}
                            </span>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => onDelete?.(invoice)}
                            className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-red-50 text-[#000060]/60 hover:text-red-600 transition-all border border-[#000060]/10 hover:border-red-200"
                            title="Delete Invoice"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                        <button
                          onClick={onClose}
                          className="p-2.5 rounded-xl bg-[#000060] text-white hover:bg-[#000060]/90 transition-all ml-2"
                          title="Close (Esc)"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit Mode Actions */}
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all border border-gray-300"
                        >
                          <ArrowLeft size={16} />
                          <span className="text-sm font-medium">Cancel</span>
                        </button>

                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-lg ${
                            isConfirmed
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                              : "bg-[#000060] hover:bg-[#000060]/90 text-white shadow-[#000060]/20"
                          }`}
                        >
                          {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          <span className="text-sm font-medium">
                            {isSaving ? "Saving..." : "Save Changes"}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta Info Bar */}
              <div className="flex items-center gap-6 mt-4 text-sm text-[#000060]/60">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#000060]/40" />
                  <span>{formatDate(invoice.invoice_date)}</span>
                </div>
                {invoice.supplier_invoice_no && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-[#000060]/40" />
                      <span className="font-mono">{invoice.supplier_invoice_no}</span>
                    </div>
                  </>
                )}
                {invoice.supplier && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-[#000060]/40" />
                      <span>{invoice.supplier.name}</span>
                    </div>
                  </>
                )}
                {invoice.branch && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#000060]/40" />
                      <span>{invoice.branch.branch_name}</span>
                    </div>
                  </>
                )}

                {mode === 'edit' && isConfirmed && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                      <AlertTriangle size={12} />
                      <span className="text-xs font-medium">
                        Stock will be recalculated on save
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT - VIEW MODE */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {mode === 'view' && (
              <div className="flex-1 flex overflow-hidden relative z-10">
                {/* LEFT PANEL - Supplier & Summary */}
                <ViewLeftPanel 
                  invoice={invoice} 
                  formatCurrency={formatCurrency} 
                  formatDate={formatDate}
                  totalQty={totalQty}
                  totalFree={totalFree}
                  itemCount={itemCount}
                  canEdit={canEdit}
                  isConfirmed={isConfirmed}
                  onEnterEditMode={handleEnterEditMode}
                />

                {/* RIGHT PANEL - Items Table */}
                <ViewRightPanel 
                  invoice={invoice}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  totalQty={totalQty}
                  totalFree={totalFree}
                  itemCount={itemCount}
                />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT - EDIT MODE */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {mode === 'edit' && (
              <EditModeContent
                invoice={invoice}
                editRows={editRows}
                editSummary={editSummary}
                medicines={medicines}
                medicinesLoading={medicinesLoading}
                isConfirmed={isConfirmed}
                formatCurrency={formatCurrency}
                onRowChange={handleRowChange}
                onProductSelect={handleProductSelect}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
                tableBodyRef={tableBodyRef}
              />
            )}
          </motion.div>

          {/* Confirm Dialog */}
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmDialog.onConfirm}
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText}
            cancelText="Cancel"
            type={confirmDialog.type}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// VIEW LEFT PANEL
// ════════════════════════════════════════════════════════════════════════════

const ViewLeftPanel = ({
  invoice,
  formatCurrency,
  formatDate,
  totalQty,
  totalFree,
  itemCount,
  canEdit,
  isConfirmed,
  onEnterEditMode,
}) => (
  <div className="w-80 shrink-0 border-r border-[#000060]/10 flex flex-col overflow-hidden bg-[#000060]/[0.02]">
    {/* Supplier Card */}
    <div className="shrink-0 p-5 border-b border-[#000060]/10 bg-white">
      <div className="flex items-center gap-2 text-[#000060]/60 text-xs uppercase tracking-widest mb-4">
        <Building2 size={14} />
        <span>Supplier</span>
      </div>

      {invoice.supplier ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#000060]/10"
              style={{ background: "rgba(0, 0, 96, 0.05)" }}
            >
              <Building2 size={18} className="text-[#000060]/70" />
            </div>
            <div>
              <h3 className="font-semibold text-[#000060]">
                {invoice.supplier.name}
              </h3>
              {invoice.supplier.supplier_code && (
                <p className="text-xs text-[#000060]/40 font-mono">
                  {invoice.supplier.supplier_code}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {(invoice.supplier.office_phone || invoice.supplier.personal_phone) && (
              <div className="flex items-center gap-2 text-sm text-[#000060]/70">
                <Phone size={14} className="text-[#000060]/40" />
                <span>
                  {invoice.supplier.office_phone || invoice.supplier.personal_phone}
                </span>
              </div>
            )}
            {invoice.supplier.email && (
              <div className="flex items-center gap-2 text-sm text-[#000060]/70">
                <Mail size={14} className="text-[#000060]/40" />
                <span className="truncate">{invoice.supplier.email}</span>
              </div>
            )}
            {invoice.supplier.gst_number && (
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#000060]/40" />
                <span className="font-mono text-xs px-2 py-1 rounded bg-[#000060]/5 text-[#000060]/80 border border-[#000060]/10">
                  {invoice.supplier.gst_number}
                </span>
              </div>
            )}
          </div>

          {(invoice.supplier.address_line_1 || invoice.supplier.city) && (
            <div className="flex gap-2 pt-3 border-t border-[#000060]/10">
              <MapPin size={14} className="text-[#000060]/40 shrink-0 mt-0.5" />
              <p className="text-xs text-[#000060]/50 leading-relaxed">
                {[
                  invoice.supplier.address_line_1,
                  invoice.supplier.city,
                  invoice.supplier.state,
                  invoice.supplier.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-[#000060]/40">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Supplier info not available</p>
        </div>
      )}
    </div>

    {/* Summary Stats */}
    <div className="shrink-0 p-5 border-b border-[#000060]/10 bg-white">
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-[#000060]/5 border border-[#000060]/10">
          <div className="text-xl font-bold text-[#000060]">{itemCount}</div>
          <div className="text-[10px] text-[#000060]/50 uppercase mt-1">Products</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#000060]/10 border border-[#000060]/15">
          <div className="text-xl font-bold text-[#000060]">{totalQty}</div>
          <div className="text-[10px] text-[#000060]/50 uppercase mt-1">Quantity</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#000060]/10 border border-[#000060]/15">
          <div className="text-xl font-bold text-[#000060]">{totalFree}</div>
          <div className="text-[10px] text-[#000060]/50 uppercase mt-1">Free</div>
        </div>
      </div>
    </div>

    {/* Financial Summary */}
    <div
      className="flex-1 overflow-y-auto p-5 bg-white"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0, 0, 96, 0.2) transparent",
      }}
    >
      <div className="flex items-center gap-2 text-[#000060]/60 text-xs uppercase tracking-widest mb-4">
        <IndianRupee size={14} />
        <span>Financials</span>
      </div>

      <div className="space-y-3">
        <FinanceRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />

        {parseFloat(invoice.discount_amount) > 0 && (
          <FinanceRow
            label="Discount"
            value={`- ${formatCurrency(invoice.discount_amount)}`}
            valueClass="text-[#000060]/80"
          />
        )}

        <FinanceRow label="Taxable Amount" value={formatCurrency(invoice.taxable_amount)} />

        <div className="border-t border-dashed border-[#000060]/10 my-3" />

        {parseFloat(invoice.cgst_amount) > 0 && (
          <FinanceRow label="CGST" value={formatCurrency(invoice.cgst_amount)} small />
        )}
        {parseFloat(invoice.sgst_amount) > 0 && (
          <FinanceRow label="SGST" value={formatCurrency(invoice.sgst_amount)} small />
        )}
        {parseFloat(invoice.igst_amount) > 0 && (
          <FinanceRow label="IGST" value={formatCurrency(invoice.igst_amount)} small />
        )}

        <FinanceRow
          label="Total Tax"
          value={formatCurrency(invoice.total_tax)}
          valueClass="text-[#000060]/90"
        />

        {invoice.round_off !== 0 && (
          <FinanceRow label="Round Off" value={formatCurrency(invoice.round_off)} small />
        )}

        <div className="border-t-2 border-[#000060]/20 my-4" />

        <div className="flex justify-between items-center py-2">
          <span className="font-semibold text-[#000060]">Net Amount</span>
          <span className="text-2xl font-bold text-[#000060]">
            {formatCurrency(invoice.net_amount)}
          </span>
        </div>

        {invoice.payment_status !== "PAID" && (
          <div className="mt-4 p-4 rounded-xl bg-[#000060]/5 border border-[#000060]/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#000060]/60">Paid</span>
              <span className="font-semibold text-[#000060]">
                {formatCurrency(invoice.paid_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#000060]">Balance</span>
              <span className="text-lg font-bold text-[#000060]">
                {formatCurrency(invoice.balance_amount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Edit CTA */}
      {canEdit && (
        <div className="mt-6 pt-4 border-t border-[#000060]/10">
          {isConfirmed && (
            <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <p className="font-semibold">Super Admin Override</p>
                  <p className="mt-0.5 opacity-80">
                    Editing will adjust inventory stock levels automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onEnterEditMode}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-lg ${
              isConfirmed
                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                : "bg-[#000060] text-white hover:bg-[#000060]/90 shadow-[#000060]/20"
            }`}
          >
            {isConfirmed ? <Shield size={18} /> : <Pencil size={18} />}
            <span>{isConfirmed ? "Edit as Super Admin" : "Edit This Invoice"}</span>
          </button>
          <p
            className={`text-xs text-center mt-2 ${
              isConfirmed ? "text-amber-600" : "text-[#000060]/50"
            }`}
          >
            {isConfirmed ? "⚠️ Stock will be automatically adjusted" : "Opens inline editor"}
          </p>
        </div>
      )}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// VIEW RIGHT PANEL - ITEMS TABLE
// ════════════════════════════════════════════════════════════════════════════

const ViewRightPanel = ({
  invoice,
  formatCurrency,
  formatDate,
  totalQty,
  totalFree,
  itemCount,
}) => (
  <div className="flex-1 flex flex-col overflow-hidden bg-white">
    {/* Table Header */}
    <div className="shrink-0 px-6 py-4 border-b border-[#000060]/10 flex items-center justify-between bg-[#000060]/[0.02]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#000060]/10 flex items-center justify-center">
          <Package size={16} className="text-[#000060]/70" />
        </div>
        <h2 className="font-semibold text-[#000060]">Line Items</h2>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#000060] text-white">
          {itemCount} items
        </span>
      </div>
    </div>

    {/* Table Container */}
    <div
      className="flex-1 overflow-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0, 0, 96, 0.2) transparent",
      }}
    >
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="text-xs font-semibold text-[#000060]/60 uppercase tracking-wider bg-[#000060]/[0.03]">
            <th className="px-4 py-3 text-center w-12 border-b border-[#000060]/10">#</th>
            <th className="px-4 py-3 text-left min-w-[200px] border-b border-[#000060]/10">Product</th>
            <th className="px-4 py-3 text-center w-28 border-b border-[#000060]/10">Batch</th>
            <th className="px-4 py-3 text-center w-24 border-b border-[#000060]/10">Expiry</th>
            <th className="px-4 py-3 text-center w-20 border-b border-[#000060]/10">Pack</th>
            <th className="px-4 py-3 text-right w-16 border-b border-[#000060]/10">Qty</th>
            <th className="px-4 py-3 text-right w-16 border-b border-[#000060]/10">Free</th>
            <th className="px-4 py-3 text-right w-24 border-b border-[#000060]/10">Rate</th>
            <th className="px-4 py-3 text-right w-24 border-b border-[#000060]/10">MRP</th>
            <th className="px-4 py-3 text-center w-16 border-b border-[#000060]/10">Disc%</th>
            <th className="px-4 py-3 text-center w-16 border-b border-[#000060]/10">GST%</th>
            <th className="px-4 py-3 text-right w-28 border-b border-[#000060]/10">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#000060]/5">
          {invoice.lineItems && invoice.lineItems.length > 0 ? (
            invoice.lineItems.map((item, i) => {
              if (!item) return null;
              const gstPercent =
                (parseFloat(item.cgst_percent) || 0) + (parseFloat(item.sgst_percent) || 0);
              const isExpiringSoon =
                item.expiry_date &&
                new Date(item.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

              return (
                <tr
                  key={item.item_id || `item-${i}`}
                  className="hover:bg-[#000060]/[0.02] transition-colors group"
                >
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-mono text-[#000060]/40 group-hover:text-[#000060]/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-[#000060] text-sm">
                        {item.medicine?.name || "Unknown Product"}
                      </span>
                      {item.medicine?.generic_name && (
                        <p className="text-[10px] text-[#000060]/40 italic mt-0.5">
                          {item.medicine.generic_name}
                        </p>
                      )}
                      {item.medicine?.manufacturer && (
                        <p className="text-[10px] text-[#000060]/30 mt-0.5">
                          {item.medicine.manufacturer}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-xs px-2 py-1 rounded bg-[#000060]/5 text-[#000060]/70 border border-[#000060]/10">
                      {item.batch_number || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs ${
                        isExpiringSoon
                          ? "text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded"
                          : "text-[#000060]/60"
                      }`}
                    >
                      {formatDate(item.expiry_date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-[#000060]/50">
                    {item.pack_size || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-[#000060]">
                      {parseFloat(item.quantity) || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-[#000060]/70">
                      {parseFloat(item.free_quantity) || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#000060]/70">
                    {formatCurrency(item.purchase_rate)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-[#000060]">
                    {formatCurrency(item.mrp)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(parseFloat(item.trade_discount) || 0) > 0 ? (
                      <span className="text-xs font-semibold text-[#000060]/80">
                        {item.trade_discount}%
                      </span>
                    ) : (
                      <span className="text-xs text-[#000060]/30">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-medium text-[#000060]/70">
                      {gstPercent.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-[#000060]">
                      {formatCurrency(item.line_total)}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={12} className="px-4 py-20 text-center">
                <div className="flex flex-col items-center gap-4 text-[#000060]/40">
                  <Package size={48} strokeWidth={1} className="opacity-30" />
                  <div>
                    <p className="font-medium text-[#000060]/60">No items found</p>
                    <p className="text-sm mt-1 text-[#000060]/40">
                      This invoice has no items
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>

        {/* Table Footer */}
        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <tfoot className="sticky bottom-0 border-t-2 border-[#000060]/20 bg-white">
            <tr className="text-sm font-semibold">
              <td colSpan={5} className="px-4 py-4 text-right text-[#000060]/60">
                Grand Totals
              </td>
              <td className="px-4 py-4 text-right text-[#000060] font-bold">{totalQty}</td>
              <td className="px-4 py-4 text-right text-[#000060]/80 font-bold">{totalFree}</td>
              <td colSpan={4} className="px-4 py-4"></td>
              <td className="px-4 py-4 text-right">
                <span className="text-lg font-bold text-[#000060]">
                  {formatCurrency(invoice.net_amount)}
                </span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// EDIT MODE CONTENT
// ════════════════════════════════════════════════════════════════════════════

const EditModeContent = ({
  invoice,
  editRows,
  editSummary,
  medicines,
  medicinesLoading,
  isConfirmed,
  formatCurrency,
  onRowChange,
  onProductSelect,
  onAddRow,
  onRemoveRow,
  tableBodyRef,
}) => {
  const filledRows = editRows.filter(r => r.name).length;

  return (
    <div className="flex-1 flex overflow-hidden relative z-10">
      {/* LEFT PANEL - Supplier Info (Read-only) + Summary */}
      <div className="w-80 shrink-0 border-r border-amber-200 flex flex-col overflow-hidden bg-amber-50/30">
        {/* Supplier Card - Read Only */}
        <div className="shrink-0 p-5 border-b border-amber-200 bg-white">
          <div className="flex items-center gap-2 text-amber-700 text-xs uppercase tracking-widest mb-4">
            <Building2 size={14} />
            <span>Supplier (Locked)</span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Building2 size={18} className="text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">
                {invoice.supplier?.name || "Unknown"}
              </h3>
              {invoice.supplier?.gst_number && (
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {invoice.supplier.gst_number}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle size={12} />
            Supplier cannot be changed on existing invoices
          </p>
        </div>

        {/* Live Summary */}
        <div className="flex-1 overflow-y-auto p-5 bg-white">
          <div className="flex items-center gap-2 text-amber-700 text-xs uppercase tracking-widest mb-4">
            <IndianRupee size={14} />
            <span>Live Summary</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xl font-bold text-amber-700">{editSummary.totalItems}</div>
              <div className="text-[10px] text-amber-600 uppercase mt-1">Items</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xl font-bold text-amber-700">{editSummary.totalQty}</div>
              <div className="text-[10px] text-amber-600 uppercase mt-1">Qty</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xl font-bold text-amber-700">{editSummary.totalFree}</div>
              <div className="text-[10px] text-amber-600 uppercase mt-1">Free</div>
            </div>
          </div>

          <div className="space-y-3">
            <FinanceRow label="Subtotal" value={formatCurrency(editSummary.subTotal)} />
            <FinanceRow label="CGST" value={formatCurrency(editSummary.cgst)} small />
            <FinanceRow label="SGST" value={formatCurrency(editSummary.sgst)} small />
            <div className="border-t-2 border-amber-200 my-4" />
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-amber-800">Net Amount</span>
              <span className="text-2xl font-bold text-amber-700">
                {formatCurrency(editSummary.total)}
              </span>
            </div>
          </div>

          {/* Stock Warning */}
          {isConfirmed && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <RefreshCw size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-semibold">Stock Recalculation</p>
                  <p className="mt-1 opacity-80">
                    On save, the system will:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-80">
                    <li>Reverse original stock entries</li>
                    <li>Add new stock based on updated quantities</li>
                    <li>Log all changes in audit trail</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Editable Table */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Table Header */}
        <div className="shrink-0 px-4 py-3 border-b border-amber-200 flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Pencil size={14} className="text-white" />
            </div>
            <h2 className="font-semibold text-amber-800">Edit Line Items</h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
              {filledRows} / {editRows.length} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddRow}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus size={14} />
              Add Row
            </button>
          </div>
        </div>

        {/* Editable Table */}
        <div 
          ref={tableBodyRef}
          className="flex-1 overflow-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(217, 119, 6, 0.3) transparent",
          }}
        >
          {medicinesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-amber-500 animate-spin" />
                <p className="text-sm text-amber-700">Loading products...</p>
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="text-xs font-semibold text-white uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-500">
                  <th className="px-2 py-2 text-center w-10">#</th>
                  <th className="px-2 py-2 text-left min-w-[180px]">Product</th>
                  <th className="px-2 py-2 text-left w-24">Mfac</th>
                  <th className="px-2 py-2 text-center w-20">Batch</th>
                  <th className="px-2 py-2 text-center w-16">Expiry</th>
                  <th className="px-2 py-2 text-center w-14">Pack</th>
                  <th className="px-2 py-2 text-center w-14">Qty</th>
                  <th className="px-2 py-2 text-center w-14">Free</th>
                  <th className="px-2 py-2 text-right w-20">Rate</th>
                  <th className="px-2 py-2 text-center w-14">Dis%</th>
                  <th className="px-2 py-2 text-center w-14">GST%</th>
                  <th className="px-2 py-2 text-right w-20">MRP</th>
                  <th className="px-2 py-2 text-right w-24">Amount</th>
                  <th className="px-2 py-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {editRows.map((row, index) => (
                  <EditableRow
                    key={index}
                    index={index}
                    row={row}
                    medicines={medicines}
                    onChange={onRowChange}
                    onProductSelect={onProductSelect}
                    onRemove={onRemoveRow}
                    canRemove={editRows.length > 1}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// EDITABLE ROW COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const EditableRow = ({
  index,
  row,
  medicines,
  onChange,
  onProductSelect,
  onRemove,
  canRemove,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredProducts = medicines.filter(p => {
    const search = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(search) ||
      p.genericName?.toLowerCase().includes(search) ||
      p.manufacturer?.toLowerCase().includes(search)
    );
  }).slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (key, value) => {
    onChange(index, key, value);
  };

  const handleProductClick = (product) => {
    onProductSelect(index, product);
    setShowDropdown(false);
    setSearchTerm("");
  };

  const inputClass = `
    w-full h-8 px-2 text-xs bg-white border border-amber-200 rounded
    focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400
    transition-all placeholder:text-gray-300
  `;

  const hasData = row.name || row.qty;

  return (
    <tr className={`
      ${index % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}
      ${hasData ? 'border-l-2 border-l-amber-500' : 'border-l-2 border-l-transparent'}
      hover:bg-amber-50/50 transition-colors
    `}>
      {/* Row Number */}
      <td className="px-2 py-1.5 text-center">
        <span className={`
          inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold
          ${hasData ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}
        `}>
          {index + 1}
        </span>
      </td>

      {/* Product Name with Dropdown */}
      <td className="px-2 py-1.5 relative" ref={dropdownRef}>
        <input
          type="text"
          value={showDropdown ? searchTerm : row.name}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleChange("name", e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setSearchTerm(row.name || "");
            setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className={`${inputClass} font-medium`}
          placeholder="Search product..."
        />
        
        {/* Dropdown */}
        {showDropdown && filteredProducts.length > 0 && (
          <div className="absolute top-full left-0 z-50 w-72 bg-white border border-amber-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="px-3 py-2 hover:bg-amber-50 cursor-pointer border-b border-amber-100 last:border-b-0"
              >
                <div className="font-medium text-xs text-gray-800">{product.name}</div>
                <div className="text-[10px] text-gray-500 flex gap-2 mt-0.5">
                  <span>{product.manufacturer || '-'}</span>
                  <span>•</span>
                  <span>HSN: {product.hsn || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </td>

      {/* Manufacturer */}
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.mfac || ""}
          onChange={(e) => handleChange("mfac", e.target.value)}
          className={inputClass}
          placeholder="Mfac"
        />
      </td>

      {/* Batch */}
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.batch || ""}
          onChange={(e) => handleChange("batch", e.target.value.toUpperCase())}
          className={`${inputClass} text-center font-mono`}
          placeholder="Batch"
        />
      </td>

      {/* Expiry */}
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.exp || ""}
          onChange={(e) => handleChange("exp", e.target.value)}
          className={`${inputClass} text-center font-mono`}
          placeholder="MM/YY"
        />
      </td>

      {/* Pack */}
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.pack || ""}
          onChange={(e) => handleChange("pack", e.target.value)}
          className={`${inputClass} text-center`}
          placeholder="Pk"
        />
      </td>

      {/* Qty */}
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.qty || ""}
          onChange={(e) => handleChange("qty", e.target.value)}
          className={`${inputClass} text-center font-bold text-amber-700`}
          placeholder="0"
          min="0"
        />
      </td>

      {/* Free */}
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.sch || row.pQty || ""}
          onChange={(e) => handleChange("sch", e.target.value)}
          className={`${inputClass} text-center`}
          placeholder="0"
          min="0"
        />
      </td>

      {/* Rate */}
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.price || ""}
          onChange={(e) => handleChange("price", e.target.value)}
          className={`${inputClass} text-right`}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </td>

      {/* Discount % */}
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.discountPercent || ""}
          onChange={(e) => handleChange("discountPercent", e.target.value)}
          className={`${inputClass} text-center`}
          placeholder="0"
          min="0"
          max="100"
        />
      </td>

      {/* GST % (CGST + SGST) */}
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.sgstPercent || "6"}
          onChange={(e) => {
            handleChange("cgstPercent", e.target.value);
            handleChange("sgstPercent", e.target.value);
          }}
          className={`${inputClass} text-center`}
          placeholder="6"
          min="0"
          max="50"
        />
      </td>

      {/* MRP */}
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.mrp || ""}
          onChange={(e) => handleChange("mrp", e.target.value)}
          className={`${inputClass} text-right`}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </td>

      {/* Amount (Calculated) */}
      <td className="px-2 py-1.5">
        <div className={`h-8 px-2 flex items-center justify-end rounded bg-amber-100 text-sm font-bold ${
          Number(row.amount) > 0 ? 'text-amber-700' : 'text-gray-400'
        }`}>
          {Number(row.amount || 0).toFixed(2)}
        </div>
      </td>

      {/* Remove Button */}
      <td className="px-2 py-1.5 text-center">
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove row"
          >
            <X size={14} />
          </button>
        )}
      </td>
    </tr>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const FinanceRow = ({
  label,
  value,
  valueClass = "text-[#000060]/70",
  small = false,
}) => (
  <div className={`flex justify-between items-center ${small ? "text-xs" : "text-sm"}`}>
    <span className="text-[#000060]/50">{label}</span>
    <span className={`font-medium ${valueClass}`}>{value}</span>
  </div>
);

export default ViewInvoiceModal;