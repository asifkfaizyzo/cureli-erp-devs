// frontend/src/pages/sales/invoice/components/ViewSalesInvoiceModal.jsx
// Main Modal Container - Orchestrates View and Edit modes with Payment Status Dropdown
// Matches Purchase Invoice Modal structure with Sales-specific features

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Printer,
  Pencil,
  Trash2,
  Calendar,
  Hash,
  CheckCircle2,
  Download,
  Sparkles,
  Receipt,
  Shield,
  AlertTriangle,
  Save,
  ArrowLeft,
  Loader2,
  XCircle,
  RotateCcw,
  Ban,
  ChevronDown,
  User,
  MapPin,
  Wallet,
  AlertCircle,
  IndianRupee,
  Info,
  FileText,
  Package,
  Plus,
  PauseCircle,
  Play,
} from "lucide-react";

import { useToast } from "../../../../components/common/Toast";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import salesAPI from "../../../../api/sales";
import inventoryAPI from "../../../../api/inventory";
import medicinesAPI from "../../../../api/medicines";

import ViewModeContent from "./ViewModeContent";
import EditModeContent from "./EditModeContent";
import { 
  calculateEditRow, 
  makeEmptyRow, 
  transformInvoiceToRows,
  formatCurrency,
  formatDate,
  ANIMATION_VARIANTS,
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  NAVY,
  PAYMENT_BALANCE_THRESHOLD,
  getEffectivePaymentDisplay,
} from "./salesInvoiceModalHelpers";

// ════════════════════════════════════════════════════════════════════════════
// STATUS DROPDOWN PORTAL COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const StatusDropdownPortal = ({ 
  isOpen, 
  anchorRef, 
  options, 
  onSelect, 
  onClose,
  currentStatus 
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropdownHeight = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      setPosition({
        top: showAbove ? rect.top - 8 : rect.bottom + 8,
        left: rect.left,
        showAbove,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />
          
          <motion.div
            ref={dropdownRef}
            className="fixed z-[9999] w-72"
            style={{
              top: position.showAbove ? 'auto' : position.top,
              bottom: position.showAbove ? `${window.innerHeight - position.top + 8}px` : 'auto',
              left: position.left,
            }}
            variants={ANIMATION_VARIANTS.dropdown}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div 
              className="bg-white rounded-xl overflow-hidden"
              style={{
                boxShadow: '0 20px 60px -15px rgba(0, 0, 96, 0.25), 0 10px 30px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 96, 0.1)',
              }}
            >
              <div className="px-4 py-3 bg-gradient-to-r from-[#000060] to-[#000080] border-b border-[#000060]/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Shield size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Change Status</p>
                    <p className="text-[10px] text-white/60">Super Admin Action</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current Status</p>
                <div className="flex items-center gap-2">
                  <span className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold
                    ${currentStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                      currentStatus === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 
                      currentStatus === 'PARKED' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'}
                  `}>
                    {currentStatus === 'CONFIRMED' ? <CheckCircle2 size={12} /> : 
                     currentStatus === 'DRAFT' ? <Clock size={12} /> : 
                     currentStatus === 'PARKED' ? <PauseCircle size={12} /> :
                     <XCircle size={12} />}
                    {currentStatus}
                  </span>
                </div>
              </div>

              <div className="py-2">
                {options.length > 0 ? (
                  options.map((option, index) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSelect(option.value);
                        onClose();
                      }}
                      className={`
                        w-full px-4 py-3 flex items-start gap-3 text-left transition-all duration-150
                        hover:bg-gray-50 active:bg-gray-100
                        ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${option.value === 'CONFIRMED' ? 'bg-green-100' : 
                          option.value === 'DRAFT' ? 'bg-amber-100' : 
                          option.value === 'PARKED' ? 'bg-blue-100' :
                          'bg-red-100'}
                      `}>
                        <option.icon 
                          size={16} 
                          className={
                            option.value === 'CONFIRMED' ? 'text-green-600' : 
                            option.value === 'DRAFT' ? 'text-amber-600' : 
                            option.value === 'PARKED' ? 'text-blue-600' :
                            'text-red-600'
                          } 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`
                          text-sm font-semibold
                          ${option.value === 'CONFIRMED' ? 'text-green-700' : 
                            option.value === 'DRAFT' ? 'text-amber-700' : 
                            option.value === 'PARKED' ? 'text-blue-700' :
                            'text-red-700'}
                        `}>
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                      <ChevronDown size={14} className="text-gray-400 rotate-[-90deg] mt-2" />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <Ban size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No status changes available</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Status changes may affect inventory levels and are logged in the audit trail.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT STATUS DROPDOWN PORTAL COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const PaymentStatusDropdownPortal = ({ 
  isOpen, 
  anchorRef, 
  options, 
  onSelect, 
  onClose,
  currentStatus,
  invoice,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropdownHeight = 400;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      setPosition({
        top: showAbove ? rect.top - 8 : rect.bottom + 8,
        left: rect.left,
        showAbove,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const paymentDisplay = getEffectivePaymentDisplay(invoice);
  const netAmount = parseFloat(invoice?.net_amount) || 0;
  const paidAmount = parseFloat(invoice?.paid_amount) || 0;
  const rawBalance = netAmount - paidAmount;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />
          
          <motion.div
            ref={dropdownRef}
            className="fixed z-[9999] w-80"
            style={{
              top: position.showAbove ? 'auto' : position.top,
              bottom: position.showAbove ? `${window.innerHeight - position.top + 8}px` : 'auto',
              left: position.left,
            }}
            variants={ANIMATION_VARIANTS.dropdown}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div 
              className="bg-white rounded-xl overflow-hidden"
              style={{
                boxShadow: '0 20px 60px -15px rgba(0, 0, 96, 0.25), 0 10px 30px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 96, 0.1)',
              }}
            >
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 border-b border-emerald-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <IndianRupee size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Payment Status</p>
                    <p className="text-[10px] text-white/60">Super Admin Action</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Effective Status</p>
                  <span className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold
                    ${paymentDisplay.config.bg} ${paymentDisplay.config.text}
                  `}>
                    {paymentDisplay.effectiveStatus === 'PAID' && <CheckCircle2 size={12} />}
                    {paymentDisplay.effectiveStatus === 'PARTIALLY_PAID' && <Wallet size={12} />}
                    {paymentDisplay.effectiveStatus === 'UNPAID' && <AlertCircle size={12} />}
                    {paymentDisplay.config.label || paymentDisplay.effectiveStatus}
                  </span>
                </div>

                {paymentDisplay.thresholdApplied && (
                  <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-blue-50 rounded border border-blue-200">
                    <Info size={12} className="text-blue-600" />
                    <span className="text-[10px] text-blue-700">
                      Balance ₹{rawBalance.toFixed(2)} ≤ ₹{PAYMENT_BALANCE_THRESHOLD} threshold
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <p className="text-gray-500">Paid</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(paidAmount)}</p>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p className="text-gray-500">Balance</p>
                    <p className={`font-bold ${paymentDisplay.showBalance ? 'text-red-600' : 'text-gray-400'}`}>
                      {paymentDisplay.showBalance 
                        ? formatCurrency(rawBalance)
                        : paymentDisplay.thresholdApplied 
                          ? <span className="line-through">{formatCurrency(rawBalance)}</span>
                          : formatCurrency(0)
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                {options.map((option, index) => {
                  const isCurrentStatus = option.value === paymentDisplay.effectiveStatus;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (!isCurrentStatus) {
                          onSelect(option.value);
                          onClose();
                        }
                      }}
                      disabled={isCurrentStatus}
                      className={`
                        w-full px-4 py-3 flex items-start gap-3 text-left transition-all duration-150
                        ${isCurrentStatus 
                          ? 'bg-gray-50 opacity-50 cursor-not-allowed' 
                          : 'hover:bg-gray-50 active:bg-gray-100'}
                        ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${option.value === 'PAID' ? 'bg-emerald-100' : 
                          option.value === 'PARTIALLY_PAID' ? 'bg-amber-100' : 
                          'bg-red-100'}
                      `}>
                        <option.icon 
                          size={16} 
                          className={
                            option.value === 'PAID' ? 'text-emerald-600' : 
                            option.value === 'PARTIALLY_PAID' ? 'text-amber-600' : 
                            'text-red-600'
                          } 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`
                          text-sm font-semibold
                          ${option.value === 'PAID' ? 'text-emerald-700' : 
                            option.value === 'PARTIALLY_PAID' ? 'text-amber-700' : 
                            'text-red-700'}
                        `}>
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                      {isCurrentStatus && (
                        <span className="text-xs text-gray-400 mt-1">Current</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    Balance ≤ ₹{PAYMENT_BALANCE_THRESHOLD} is treated as fully paid.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const ViewSalesInvoiceModal = ({
  open,
  onClose,
  invoice,
  onPrint,
  onEdit,
  onDelete,
  onRefresh,
  isSuperAdmin = false,
  initialMode = 'view',
}) => {
  const toast = useToast();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [mode, setMode] = useState('view');
  const [editRows, setEditRows] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState({});
  const [medicinesLoading, setMedicinesLoading] = useState(false);
  
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const [showPaymentStatusMenu, setShowPaymentStatusMenu] = useState(false);
  const [isChangingPaymentStatus, setIsChangingPaymentStatus] = useState(false);
  
  const [linkedReturns, setLinkedReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
  });

  const tableBodyRef = useRef(null);
  const statusButtonRef = useRef(null);
  const paymentStatusButtonRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED: Effective Payment Display
  // ═══════════════════════════════════════════════════════════════════════════

  const effectivePaymentDisplay = useMemo(() => {
    return getEffectivePaymentDisplay(invoice);
  }, [invoice]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (open && invoice) {
      setShowStatusMenu(false);
      setShowPaymentStatusMenu(false);
      
      if (initialMode === 'edit') {
        const rows = transformInvoiceToRows(invoice);
        while (rows.length < 5) rows.push(makeEmptyRow());
        setEditRows(rows);
        setOriginalData(JSON.parse(JSON.stringify(invoice)));
        setMode('edit');
        
        if (medicines.length === 0) loadMedicines();
      } else {
        setMode('view');
        setEditRows([]);
        setOriginalData(null);
      }
    }
  }, [open, invoice?.invoice_id, initialMode]);

  // Fetch linked returns
  useEffect(() => {
    const fetchLinkedReturns = async () => {
      if (!invoice || !invoice.invoice_id || invoice.is_return) {
        setLinkedReturns([]);
        return;
      }

      try {
        setLoadingReturns(true);
        const response = await salesAPI.getAllReturns({
          parent_invoice_id: invoice.invoice_id,
          limit: 100,
        });
        
        if (response.success && response.data?.returns) {
          const filteredReturns = response.data.returns.filter(ret => 
            ret.parent_invoice_id === invoice.invoice_id
          );
          const approvedReturns = filteredReturns.filter(
            ret => ret.status === 'CONFIRMED' || ret.return_approval_status === 'APPROVED'
          );
          setLinkedReturns(approvedReturns);
        } else {
          setLinkedReturns([]);
        }
      } catch (error) {
        console.error('Error fetching linked returns:', error);
        setLinkedReturns([]);
      } finally {
        setLoadingReturns(false);
      }
    };

    if (open && invoice) {
      fetchLinkedReturns();
    } else {
      setLinkedReturns([]);
    }
  }, [open, invoice?.invoice_id]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) {
        if (showStatusMenu) {
          setShowStatusMenu(false);
        } else if (showPaymentStatusMenu) {
          setShowPaymentStatusMenu(false);
        } else if (mode === 'edit') {
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
  }, [open, onClose, mode, showStatusMenu, showPaymentStatusMenu]);

  useEffect(() => {
    if (mode === 'edit' && medicines.length === 0) loadMedicines();
  }, [mode]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadMedicines = async () => {
  try {
    setMedicinesLoading(true);
    // ✅ FIXED: Use medicinesAPI instead of inventoryAPI
    const response = await medicinesAPI.getAll({ isActive: true, limit: 1000 });

    // ✅ FIXED: Handle both response formats
    const medicinesList = response.data?.medicines || response.data || [];
    
    if (!Array.isArray(medicinesList)) {
      console.error("Invalid medicines response format:", response.data);
      setMedicines([]);
      return [];
    }

    const formattedMedicines = medicinesList.map((med) => ({
      id: med.medicine_id,
      medicine_id: med.medicine_id,
      name: med.name,
      genericName: med.generic_name,
      manufacturer: med.manufacturer,
      hsnCode: med.hsn_code,
      packSize: med.pack_size,
      cgstPercent: "0", // ✅ Not used (MRP is inclusive)
      sgstPercent: "0", // ✅ Not used
    }));

    setMedicines(formattedMedicines);
    return formattedMedicines;
  } catch (error) {
    console.error("Load medicines error:", error);
    toast.error("Failed to load medicines");
    setMedicines([]);
    return [];
  } finally {
    setMedicinesLoading(false);
  }
};

  const loadBatchesForMedicine = useCallback(async (medicineId) => {
  try {
    console.log("🔄 Loading batches for medicine:", medicineId);
    console.log("🔄 Invoice branch:", invoice?.branch_id);
    
    // ✅ FIXED: Use invoice's branch_id (this is the correct branch for editing)
    const targetBranchId = invoice?.branch_id;
    
    if (!targetBranchId) {
      console.error("❌ No branch ID available from invoice");
      toast.warning("No Branch Context", "Cannot load batches - invoice has no branch information.");
      return [];
    }

    console.log(`📤 Fetching batches for medicine ${medicineId} in branch ${targetBranchId}`);

    const response = await salesAPI.getAvailableBatches(medicineId, {
      includeLowStock: true,
      includeExpiring: true,
    });

    if (response.success && response.data) {
      const batchesData = response.data.batches || response.data || [];
      console.log(`✅ Loaded ${batchesData.length} batches:`, batchesData);
      
      setBatches(prev => ({
        ...prev,
        [medicineId]: batchesData,
      }));
      
      return batchesData;
    }
    
    console.log("⚠️ No batches returned from API");
    return [];
  } catch (error) {
    console.error("❌ Load batches error:", error);
    
    if (error.response?.status === 404) {
      console.log("📭 No batches found - might be out of stock");
      setBatches(prev => ({ ...prev, [medicineId]: [] }));
      toast.info("No Stock Available", "No batches found for this medicine in the current branch.");
      return [];
    }
    
    if (error.response?.data?.code === "BRANCH_REQUIRED") {
      toast.error("Branch Required", "Cannot fetch batches without branch context.");
      return [];
    }
    
    toast.error("Failed to load batches", error.response?.data?.message || error.message);
    return [];
  }
}, [invoice, toast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS CHANGE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleStatusChange = useCallback(async (newStatus) => {
    if (!invoice || !isSuperAdmin || mode !== 'edit') return;
    
    const currentStatus = invoice.status?.toUpperCase();
    const invoiceNumber = invoice.invoice_number;
    
    setShowStatusMenu(false);

    let confirmMessage = null;
    let confirmTitle = '';
    let confirmType = 'warning';
    let confirmButtonText = '';

    if (newStatus === 'CONFIRMED' && (currentStatus === 'DRAFT' || currentStatus === 'PARKED')) {
      confirmTitle = 'Confirm Invoice';
      confirmButtonText = 'Confirm Invoice';
      confirmMessage = (
        <div className="space-y-3">
          <p>You are about to <strong>confirm</strong> this sales invoice.</p>
          <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
            <p className="font-semibold text-gray-900">Invoice: {invoiceNumber}</p>
            <p className="text-gray-600">Amount: ₹{parseFloat(invoice.net_amount || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-sm text-green-800 font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              This will:
            </p>
            <ul className="text-xs text-green-700 mt-2 list-disc list-inside space-y-1">
              <li>Deduct stock from inventory</li>
              <li>Lock the invoice for regular editing</li>
              <li>Record confirmation in audit trail</li>
            </ul>
          </div>
        </div>
      );
    } else if (newStatus === 'DRAFT' && currentStatus === 'CONFIRMED') {
      confirmTitle = 'Revert to Draft';
      confirmButtonText = 'Revert to Draft';
      confirmType = 'danger';
      confirmMessage = (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <Shield className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">Super Admin Action</p>
              <p className="text-sm text-red-700 mt-1">
                You are reverting a confirmed invoice to draft.
              </p>
            </div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-medium flex items-center gap-2">
              <AlertTriangle size={16} />
              Warning: Stock Restoration
            </p>
            <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
              <li>All stock deducted by this invoice will be <strong>restored</strong></li>
              <li>Action is logged in audit trail</li>
            </ul>
          </div>
        </div>
      );
    } else if (newStatus === 'PARKED') {
      confirmTitle = 'Park Invoice';
      confirmButtonText = 'Park Invoice';
      confirmMessage = (
        <div className="space-y-3">
          <p>You are about to <strong>park</strong> this invoice for later.</p>
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              Parked invoices can be resumed later without losing data.
            </p>
          </div>
        </div>
      );
    } else if (newStatus === 'CANCELLED') {
      confirmTitle = 'Cancel Invoice';
      confirmButtonText = 'Cancel Invoice';
      confirmType = 'danger';
      confirmMessage = (
        <div className="space-y-3">
          <p>You are about to <strong>cancel</strong> this invoice.</p>
          {currentStatus === 'CONFIRMED' && (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                Stock Restoration Warning
              </p>
              <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                <li>All stock from this invoice will be <strong>restored</strong></li>
                <li>This action <strong>cannot be undone</strong></li>
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (confirmMessage) {
      setConfirmDialog({
        isOpen: true,
        type: confirmType,
        title: confirmTitle,
        message: confirmMessage,
        confirmText: confirmButtonText,
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          await performStatusChange(newStatus);
        },
      });
    }
  }, [invoice, isSuperAdmin, mode]);

  const performStatusChange = useCallback(async (newStatus) => {
    setIsChangingStatus(true);
    
    try {
      if (newStatus === 'CONFIRMED') {
        await salesAPI.confirm(invoice.invoice_id);
      } else if (newStatus === 'CANCELLED') {
        await salesAPI.cancel(invoice.invoice_id, "Cancelled by Super Admin");
      } else if (newStatus === 'PARKED') {
        await salesAPI.park(invoice.invoice_id);
      } else if (newStatus === 'DRAFT') {
        await salesAPI.update(invoice.invoice_id, { status: 'DRAFT' });
      }

      const statusLabels = { 
        CONFIRMED: 'confirmed', 
        DRAFT: 'reverted to draft', 
        CANCELLED: 'cancelled',
        PARKED: 'parked',
      };
      toast.success("Status Updated", `Invoice ${invoice.invoice_number} has been ${statusLabels[newStatus]}.`);
      
      onRefresh?.();
      onClose();

    } catch (error) {
      console.error("Status change error:", error);
      toast.error("Status Change Failed", error.response?.data?.message || error.message);
    } finally {
      setIsChangingStatus(false);
    }
  }, [invoice, toast, onRefresh, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT STATUS CHANGE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getPaymentStatusMenuOptions = useCallback(() => {
    return [
      {
        value: 'PAID',
        label: 'Mark as Paid',
        icon: CheckCircle2,
        description: 'Set full amount as paid',
      },
      {
        value: 'PARTIALLY_PAID',
        label: 'Partially Paid',
        icon: Wallet,
        description: `Balance must be > ₹${PAYMENT_BALANCE_THRESHOLD}`,
      },
      {
        value: 'UNPAID',
        label: 'Mark as Unpaid',
        icon: AlertCircle,
        description: 'Reset payment to zero',
      },
    ];
  }, []);

  const handlePaymentStatusChange = useCallback(async (newStatus) => {
    if (!invoice || !isSuperAdmin || mode !== 'edit') return;
    
    const netAmount = parseFloat(invoice.net_amount) || 0;
    const currentPaid = parseFloat(invoice.paid_amount) || 0;
    const rawBalance = netAmount - currentPaid;
    
    setShowPaymentStatusMenu(false);

    let confirmMessage = null;
    let confirmTitle = '';
    let confirmType = 'warning';
    let confirmButtonText = '';

    if (newStatus === 'PAID') {
      confirmTitle = 'Mark as Paid';
      confirmButtonText = 'Mark as Paid';
      confirmMessage = (
        <div className="space-y-3">
          <p>You are marking this invoice as <strong>fully paid</strong>.</p>
          <div className="bg-emerald-50 p-3 rounded border border-emerald-200 text-sm">
            <div className="flex justify-between mt-2">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(netAmount)}</span>
            </div>
          </div>
        </div>
      );
    } else if (newStatus === 'UNPAID') {
      confirmTitle = 'Mark as Unpaid';
      confirmButtonText = 'Mark as Unpaid';
      confirmType = 'danger';
      confirmMessage = (
        <div className="space-y-3">
          <p>This will reset the payment to zero.</p>
          <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Paid:</span>
              <span className="text-red-600 line-through">{formatCurrency(currentPaid)}</span>
            </div>
          </div>
        </div>
      );
    } else if (newStatus === 'PARTIALLY_PAID') {
      if (rawBalance <= PAYMENT_BALANCE_THRESHOLD && currentPaid > 0) {
        toast.warning("Cannot Set", `Balance ₹${rawBalance.toFixed(2)} is below threshold.`);
        return;
      }

      confirmTitle = 'Mark as Partially Paid';
      confirmButtonText = 'Update Status';
      confirmMessage = (
        <div className="space-y-3">
          <p>You are marking this invoice as <strong>partially paid</strong>.</p>
          <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Balance:</span>
              <span className="font-bold text-amber-700">{formatCurrency(rawBalance)}</span>
            </div>
          </div>
        </div>
      );
    }

    if (confirmMessage) {
      setConfirmDialog({
        isOpen: true,
        type: confirmType,
        title: confirmTitle,
        message: confirmMessage,
        confirmText: confirmButtonText,
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          await performPaymentStatusChange(newStatus);
        },
      });
    }
  }, [invoice, isSuperAdmin, mode, toast]);

  const performPaymentStatusChange = useCallback(async (newStatus) => {
    setIsChangingPaymentStatus(true);
    
    try {
      const netAmount = parseFloat(invoice.net_amount) || 0;
      
      const payload = {
        payment_status: newStatus,
        payment_mode: 'CASH',
      };

      if (newStatus === 'PAID') {
        payload.paid_amount = netAmount;
      } else if (newStatus === 'UNPAID') {
        payload.paid_amount = 0;
      }

      await salesAPI.updatePaymentStatus(invoice.invoice_id, payload);

      const statusLabels = {
        PAID: 'marked as paid',
        UNPAID: 'marked as unpaid',
        PARTIALLY_PAID: 'marked as partially paid',
      };

      toast.success("Payment Updated", `Invoice ${invoice.invoice_number} has been ${statusLabels[newStatus]}.`);

      onRefresh?.();
      onClose();

    } catch (error) {
      console.error("Payment status change error:", error);
      toast.error("Update Failed", error.response?.data?.message || error.message);
    } finally {
      setIsChangingPaymentStatus(false);
    }
  }, [invoice, toast, onRefresh, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT MODE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleEnterEditMode = useCallback(() => {
    const rows = transformInvoiceToRows(invoice);
    while (rows.length < 5) rows.push(makeEmptyRow());
    
    setEditRows(rows);
    setOriginalData(JSON.parse(JSON.stringify(invoice)));
    setMode('edit');
  }, [invoice]);

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
            <p className="text-sm text-amber-600 font-medium">All changes will be lost.</p>
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
  }, [editRows, originalData]);

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
        cgstPercent: product.cgstPercent || "6",
        sgstPercent: product.sgstPercent || "6",
        // Clear batch info when product changes
        batch_id: null,
        batch: "",
        expiry: "",
        mrp: "",
        price: "",
        availableStock: 0,
      };
      return newRows;
    });
  }, []);

  const handleBatchSelect = useCallback((index, batch) => {
  setEditRows(prev => {
    const newRows = [...prev];
    
    // ✅ Parse expiry_date from backend (ISO format: "2027-03-31T00:00:00.000Z")
    let expiry = "";
    if (batch.expiry_date) {
      const expDate = new Date(batch.expiry_date);
      if (!isNaN(expDate.getTime())) {
        const month = String(expDate.getMonth() + 1).padStart(2, "0");
        const year = String(expDate.getFullYear()).slice(-2);
        expiry = `${month}/${year}`;
      }
    }

    const mrp = parseFloat(batch.mrp) || 0;
    const sellingRate = parseFloat(batch.selling_rate) || mrp;

    newRows[index] = {
      ...newRows[index],
      batch_id: batch.inventory_id || batch.batch_id,
      inventory_id: batch.inventory_id,
      batch: batch.batch_number || "",
      expiry: expiry,
      mrp: mrp.toFixed(2),
      price: sellingRate.toFixed(2),
      availableStock: parseFloat(batch.available_stock || 0),
      cgstPercent: "0",
      sgstPercent: "0",
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
    const filledRows = editRows.filter(r => r.name && r.qty && parseFloat(r.qty) > 0);
    
    if (filledRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return;
    }

    // Check stock availability
    const stockIssues = filledRows.filter(r => parseInt(r.qty) > (r.availableStock || 0));
    if (stockIssues.length > 0) {
      toast.error("Stock Exceeded", `${stockIssues.length} item(s) exceed available stock.`);
      return;
    }

    const missingBatches = filledRows.filter(r => !r.batch_id);
    if (missingBatches.length > 0) {
      toast.warning("Missing Batches", `${missingBatches.length} item(s) need batch selection.`);
      return;
    }

    const isConfirmed = invoice.status === "CONFIRMED";

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
                <p className="text-sm text-amber-700 mt-1">You are updating a confirmed invoice.</p>
              </div>
            </div>
            
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                Stock Adjustment Warning
              </p>
              <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                <li>Original stock will be <strong>restored</strong></li>
                <li>New stock based on updated quantities will be <strong>deducted</strong></li>
              </ul>
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
      const lineItems = filledRows.map((row) => ({
  medicine_id: row.medicine_id,
  inventory_id: row.inventory_id || row.batch_id,
  batch_number: row.batch,
  expiry_date: row.expiry, // Keep MM/YY format, backend will parse
  quantity: parseFloat(row.qty) || 1,
  mrp: parseFloat(row.mrp) || 0,
  selling_price: parseFloat(row.price) || parseFloat(row.mrp) || 0,
  discount_percent: parseFloat(row.discountPercent) || 0,
  cgst_percent: 0, // ✅ MRP is inclusive
  sgst_percent: 0, // ✅ MRP is inclusive
}));
      const payload = {
        customer_id: invoice.customer_id,
        invoice_date: invoice.invoice_date,
        payment_mode: invoice.payment_mode || 'CASH',
        paid_amount: parseFloat(invoice.paid_amount) || 0,
        remarks: invoice.remarks || null,
        lineItems,
      };

      await salesAPI.update(invoice.invoice_id, payload);

      toast.success(
        "Invoice Updated",
        invoice.status === "CONFIRMED" 
          ? `Confirmed invoice ${invoice.invoice_number} updated. Stock adjusted.`
          : `Invoice ${invoice.invoice_number} updated successfully.`
      );

      setMode('view');
      setEditRows([]);
      setOriginalData(null);
      onRefresh?.();
      onClose();

    } catch (error) {
      console.error("Save error:", error);
      
      if (error.response?.data?.code === 'APPROVED_RETURNS_EXIST') {
        handleApprovedReturnsError(error.response.data);
        return;
      }
      
      toast.error("Update Failed", error.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  }, [invoice, toast, onRefresh, onClose]);

  // Returns error handler
  const handleApprovedReturnsError = useCallback((errorData) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Cannot Edit Invoice with Returns',
      message: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <XCircle size={24} className="text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-red-900">Editing Blocked</h4>
              <p className="text-sm text-red-700 mt-1">
                This invoice has approved returns and cannot be edited.
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium">Solutions:</p>
            <ol className="list-decimal list-inside text-sm text-green-700 mt-2 space-y-1">
              <li>Cancel the return(s) first</li>
              <li>Create a new invoice instead</li>
            </ol>
          </div>
        </div>
      ),
      confirmText: 'Close',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  const editSummary = useMemo(() => {
  const subtotal = editRows.reduce((sum, r) => {
    const qty = parseFloat(r.qty) || 0;
    const mrp = parseFloat(r.mrp) || 0;
    return sum + (qty * mrp);
  }, 0);

   const discount = editRows.reduce((sum, r) => {
    return sum + (parseFloat(r.discountAmount) || 0);
  }, 0);
  
  const total = editRows.reduce((sum, r) => {
    return sum + (parseFloat(r.amount) || 0);
  }, 0);
  
  const totalItems = editRows.filter(r => r.name).length;
  const totalQty = editRows.reduce((s, r) => s + (Number(r.qty) || 0), 0);

  return {
    subTotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    total: total.toFixed(2),
    cgst: "0.00", // ✅ Not used
    sgst: "0.00", // ✅ Not used
    totalItems,
    totalQty,
  };
}, [editRows]);

  const getStatusMenuOptions = useCallback(() => {
    const currentStatusValue = invoice?.status?.toUpperCase();
    const options = [];

    if (currentStatusValue === 'DRAFT') {
      options.push({ value: 'CONFIRMED', label: 'Confirm Invoice', icon: CheckCircle2, description: 'Deduct stock from inventory' });
      options.push({ value: 'PARKED', label: 'Park Invoice', icon: PauseCircle, description: 'Save for later' });
      options.push({ value: 'CANCELLED', label: 'Cancel Invoice', icon: Ban, description: 'Cancel without affecting stock' });
    } else if (currentStatusValue === 'PARKED') {
      options.push({ value: 'CONFIRMED', label: 'Confirm Invoice', icon: CheckCircle2, description: 'Deduct stock from inventory' });
      options.push({ value: 'DRAFT', label: 'Resume as Draft', icon: Play, description: 'Continue editing' });
      options.push({ value: 'CANCELLED', label: 'Cancel Invoice', icon: Ban, description: 'Cancel without affecting stock' });
    } else if (currentStatusValue === 'CONFIRMED') {
      options.push({ value: 'DRAFT', label: 'Revert to Draft', icon: RotateCcw, description: 'Restore stock and unlock for editing' });
      options.push({ value: 'CANCELLED', label: 'Cancel Invoice', icon: Ban, description: 'Restore stock and cancel' });
    }

    return options;
  }, [invoice?.status]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDS & COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  if (!open || !invoice) return null;

  const isConfirmed = invoice.status === "CONFIRMED";
  const isCancelled = invoice.status === "CANCELLED";
  const canEdit = isSuperAdmin && !isCancelled;
  const canDelete = !isConfirmed && !isCancelled;
  
  const canChangeStatus = isSuperAdmin && !isCancelled && mode === 'edit';
  const canChangePaymentStatus = isSuperAdmin && !isCancelled && mode === 'edit';

  const showCreateReturnButton = isConfirmed && linkedReturns.length === 0;

  const currentStatus = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT;
  const currentPayment = effectivePaymentDisplay.config;
  const effectivePaymentStatus = effectivePaymentDisplay.effectiveStatus;
  
  const StatusIcon = currentStatus.icon;
  const PaymentIcon = currentPayment.icon;

  const totalQty = invoice.lineItems?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
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
            variants={ANIMATION_VARIANTS.backdrop}
            onClick={mode === 'view' && !showStatusMenu && !showPaymentStatusMenu ? onClose : undefined}
          />

          {/* Main Panel */}
          <motion.div
            className={`relative w-full max-w-[95vw] h-[95vh] rounded-2xl overflow-hidden flex flex-col bg-white ${
              mode === 'edit' && isConfirmed ? 'ring-2 ring-amber-400' : ''
            }`}
            style={{ boxShadow: "0 25px 80px rgba(0, 0, 96, 0.25), 0 0 0 1px rgba(0, 0, 96, 0.1)" }}
            variants={ANIMATION_VARIANTS.panel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Decorative element */}
            <div
              className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-[0.03]"
              style={{ background: `radial-gradient(circle, ${NAVY} 0%, transparent 70%)` }}
            />

            {/* Loading Overlay */}
            {(isChangingStatus || isChangingPaymentStatus) && (
              <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                  <Loader2 size={32} className="text-[#000060] animate-spin" />
                  <p className="text-sm font-medium text-gray-700">
                    {isChangingPaymentStatus ? "Updating payment status..." : "Updating status..."}
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ════════════════════════════════════════════════════════════════ */}
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
                      style={mode === 'view' ? { background: NAVY, boxShadow: "0 8px 24px rgba(0, 0, 96, 0.3)" } : {}}
                    >
                      {mode === 'edit' ? <Pencil size={24} className="text-white" /> : <Receipt size={24} className="text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[#000060]/50 text-xs uppercase tracking-widest mb-1">
                        {mode === 'edit' ? (
                          <><Shield size={12} className="text-amber-600" /><span className="text-amber-600">Editing Invoice</span></>
                        ) : (
                          <><Sparkles size={12} /><span>Sales Invoice</span></>
                        )}
                      </div>
                      <h1 className="text-2xl font-bold text-[#000060] tracking-tight">{invoice.invoice_number}</h1>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {/* Invoice Status Badge */}
                    <button
                      ref={statusButtonRef}
                      onClick={() => canChangeStatus && setShowStatusMenu(!showStatusMenu)}
                      disabled={!canChangeStatus}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                        ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}
                        ${canChangeStatus ? `cursor-pointer ${currentStatus.hoverBg} hover:shadow-md active:scale-95` : 'cursor-default'}
                      `}
                    >
                      <StatusIcon size={12} />
                      {currentStatus.label}
                      {canChangeStatus && <ChevronDown size={12} className={`transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />}
                    </button>

                    <StatusDropdownPortal
                      isOpen={showStatusMenu}
                      anchorRef={statusButtonRef}
                      options={getStatusMenuOptions()}
                      onSelect={handleStatusChange}
                      onClose={() => setShowStatusMenu(false)}
                      currentStatus={invoice.status}
                    />

                    {/* Payment Status Badge */}
                    <button
                      ref={paymentStatusButtonRef}
                      onClick={() => canChangePaymentStatus && setShowPaymentStatusMenu(!showPaymentStatusMenu)}
                      disabled={!canChangePaymentStatus}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                        ${currentPayment.bg} ${currentPayment.text} ${currentPayment.border || 'border-current/30'}
                        ${canChangePaymentStatus ? `cursor-pointer ${currentPayment.hoverBg} hover:shadow-md active:scale-95` : 'cursor-default'}
                      `}
                    >
                      <PaymentIcon size={12} />
                      {currentPayment.label}
                      {effectivePaymentDisplay.showBalance && (
                        <span className="text-[10px] opacity-75 ml-0.5">
                          ({formatCurrency(effectivePaymentDisplay.balance)})
                        </span>
                      )}
                      {effectivePaymentDisplay.thresholdApplied && (
                        <span className="text-[10px] opacity-60 ml-0.5">≈</span>
                      )}
                      {canChangePaymentStatus && <ChevronDown size={12} className={`transition-transform ${showPaymentStatusMenu ? 'rotate-180' : ''}`} />}
                    </button>

                    <PaymentStatusDropdownPortal
                      isOpen={showPaymentStatusMenu}
                      anchorRef={paymentStatusButtonRef}
                      options={getPaymentStatusMenuOptions()}
                      onSelect={handlePaymentStatusChange}
                      onClose={() => setShowPaymentStatusMenu(false)}
                      currentStatus={invoice.payment_status}
                      invoice={invoice}
                    />

                    {loadingReturns && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        <Loader2 size={10} className="animate-spin" />
                        Loading...
                      </span>
                    )}

                    {!loadingReturns && linkedReturns.length > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        <Package size={10} />
                        {linkedReturns.length} Return{linkedReturns.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {mode === 'edit' && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                        <Shield size={10} />Editing
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-[#000060]/5 border border-[#000060]/10">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#000060]">{mode === 'edit' ? editSummary.totalItems : itemCount}</div>
                      <div className="text-[10px] text-[#000060]/50 uppercase">Items</div>
                    </div>
                    <div className="w-px h-8 bg-[#000060]/10" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#000060]">{mode === 'edit' ? formatCurrency(editSummary.total) : formatCurrency(invoice.net_amount)}</div>
                      <div className="text-[10px] text-[#000060]/50 uppercase">Total</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {mode === 'view' ? (
                      <>
                        <button onClick={onPrint} className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-[#000060]/10 text-[#000060] transition-all border border-[#000060]/10" title="Print">
                          <Printer size={18} />
                        </button>
                        <button className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-[#000060]/10 text-[#000060] transition-all border border-[#000060]/10" title="Download">
                          <Download size={18} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={handleEnterEditMode}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all border ${
                              isConfirmed
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300"
                                : "bg-[#000060]/10 hover:bg-[#000060]/20 text-[#000060] border-[#000060]/20"
                            }`}
                          >
                            {isConfirmed ? <Shield size={16} /> : <Pencil size={16} />}
                            <span className="text-sm font-medium">{isConfirmed ? "Admin Edit" : "Edit"}</span>
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => onDelete?.(invoice)} className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-red-50 text-[#000060]/60 hover:text-red-600 transition-all border border-[#000060]/10" title="Delete">
                            <Trash2 size={18} />
                          </button>
                        )}
                        <button onClick={onClose} className="p-2.5 rounded-xl bg-[#000060] text-white hover:bg-[#000060]/90 transition-all ml-2" title="Close">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={handleCancelEdit} disabled={isSaving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all border border-gray-300">
                          <ArrowLeft size={16} /><span className="text-sm font-medium">Cancel</span>
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-lg ${
                            isConfirmed ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-[#000060] hover:bg-[#000060]/90 text-white"
                          }`}
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          <span className="text-sm font-medium">{isSaving ? "Saving..." : "Save Changes"}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-6 mt-4 text-sm text-[#000060]/60">
                <div className="flex items-center gap-2"><Calendar size={14} className="text-[#000060]/40" /><span>{formatDate(invoice.invoice_date)}</span></div>
                {invoice.customer && (<><span className="text-[#000060]/20">•</span><div className="flex items-center gap-2"><User size={14} className="text-[#000060]/40" /><span>{invoice.customer.name || 'Walk-in'}</span></div></>)}
                {invoice.branch && (<><span className="text-[#000060]/20">•</span><div className="flex items-center gap-2"><MapPin size={14} className="text-[#000060]/40" /><span>{invoice.branch.branch_name}</span></div></>)}
                {mode === 'edit' && isConfirmed && (<><span className="text-[#000060]/20">•</span><div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-700"><AlertTriangle size={12} /><span className="text-xs font-medium">Stock will be recalculated on save</span></div></>)}
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* CONTENT */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {mode === 'view' ? (
              <ViewModeContent
                invoice={{
                  ...invoice,
                  returnInvoices: linkedReturns,
                }}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                totalQty={totalQty}
                itemCount={itemCount}
                canEdit={canEdit}
                isConfirmed={isConfirmed}
                onEnterEditMode={handleEnterEditMode}
                onCreateReturn={() => {/* TODO: Add create return modal */}}
                showCreateReturnButton={showCreateReturnButton}
                onViewReturn={() => {/* TODO: Add view return modal */}}
              />
            ) : (
              <EditModeContent
                invoice={{
                  ...invoice,
                  returnInvoices: linkedReturns,
                }}
                editRows={editRows}
                editSummary={editSummary}
                medicines={medicines}
                batches={batches}
                medicinesLoading={medicinesLoading}
                isConfirmed={isConfirmed}
                formatCurrency={formatCurrency}
                onRowChange={handleRowChange}
                onProductSelect={handleProductSelect}
                onBatchSelect={handleBatchSelect}
                onBatchesLoad={loadBatchesForMedicine}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
                tableBodyRef={tableBodyRef}
                onCreateReturn={() => {/* TODO */}}
                showCreateReturnButton={showCreateReturnButton}
                onViewReturn={() => {/* TODO */}}
              />
            )}
          </motion.div>

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

export default ViewSalesInvoiceModal;