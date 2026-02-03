// src/hooks/purchase/usePurchaseSupplier.js
import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = 'cureli_purchase_supplier';
const STORAGE_VERSION = 2; // ✅ Incremented version for new fields

const DEFAULT_SUPPLIERS = [
  { id: 1, name: "ABC Pharma Ltd", gst: "27AABCA1234C1Z5", phone: "+91 98765 43210", address: "Mumbai, MH" },
  { id: 2, name: "XYZ Medicals", gst: "07AAFCX5678D1Z2", phone: "+91 98765 43211", address: "Delhi, NCR" },
  { id: 3, name: "PQR Distributors", gst: "29AAPCP5678R1Z3", phone: "+91 98765 43212", address: "Bangalore, KA" },
  { id: 4, name: "LMN Healthcare", gst: "03AABCL1234M1Z4", phone: "+91 98765 43213", address: "Chandigarh, PB" },
  { id: 5, name: "Global Pharma Inc", gst: "24AABCG5678P1Z5", phone: "+91 98765 43214", address: "Ahmedabad, GJ" },
];

const getDefaultSupplier = () => ({
  supplier_id: null,
  purchaseId: "",
  supplierName: "",
  invoiceNo: "",
  invoiceDate: new Date().toISOString().split("T")[0],
  receivedOn: new Date().toISOString().split("T")[0],
  supplierGST: "",
  supplierPhone: "",
  creditDays: "30",
  amountPaid: "",
  paymentMode: "", // ✅ NEW: Payment mode field
  balance: "0.00",
  address: "",
});

/**
 * Load supplier from localStorage
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // ✅ UPDATED: Check version compatibility
    if (parsed.version !== STORAGE_VERSION) {
      console.log('📦 Storage version mismatch, clearing old data');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // Check expiry (24 hours)
    const savedAt = new Date(parsed.savedAt);
    const now = new Date();
    const hoursDiff = (now - savedAt) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      console.log('📦 Storage expired, clearing old data');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // ✅ NEW: Ensure new fields exist with defaults
    const supplier = {
      ...getDefaultSupplier(),
      ...parsed.supplier,
    };
    
    return supplier;
  } catch (error) {
    console.error('Failed to load supplier from storage:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

/**
 * Save supplier to localStorage
 */
const saveToStorage = (supplier) => {
  try {
    // Only save if supplier is selected
    if (!supplier.supplierName && !supplier.invoiceNo) {
      return;
    }
    
    const data = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      supplier: supplier,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save supplier to storage:', error);
  }
};

export const usePurchaseSupplier = (total = 0) => {
  const [supplier, setSupplier] = useState(getDefaultSupplier);
  const [suppliersList, setSuppliersList] = useState(DEFAULT_SUPPLIERS);
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Initialize from localStorage
  useEffect(() => {
    if (isInitialized) return;
    
    const storedSupplier = loadFromStorage();
    
    if (storedSupplier) {
      console.log('📦 Loaded supplier from storage:', storedSupplier.supplierName);
      setSupplier(storedSupplier);
    }
    
    setIsInitialized(true);
  }, [isInitialized]);

  // Auto-calculate balance
  useEffect(() => {
    const paid = parseFloat(supplier.amountPaid) || 0;
    const balance = Math.max(0, total - paid).toFixed(2);
    setSupplier(prev => {
      if (prev.balance === balance) return prev;
      return { ...prev, balance };
    });
  }, [total, supplier.amountPaid]);

  // ✅ NEW: Auto-set payment mode to CASH if amount is paid but mode is not selected
  useEffect(() => {
    const paid = parseFloat(supplier.amountPaid) || 0;
    if (paid > 0 && !supplier.paymentMode) {
      setSupplier(prev => ({
        ...prev,
        paymentMode: "CASH" // Default to CASH if not specified
      }));
    }
  }, [supplier.amountPaid, supplier.paymentMode]);

  // Debounced save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(supplier);
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [supplier, isInitialized]);

  const selectSupplier = useCallback((selected) => {
    if (selected) {
      setSupplier(prev => ({
        ...prev,
        supplier_id: selected.supplier_id || selected.id,
        supplierName: selected.name,
        supplierGST: selected.gst || selected.gstNumber || "",
        supplierPhone: selected.phone || selected.officePhone || "",
        address: selected.address || "",
        creditDays: selected.creditDays?.toString() || prev.creditDays,
      }));
    }
  }, []);

  const validateSupplier = useCallback(() => {
    const errors = [];
    
    if (!supplier.supplierName?.trim()) {
      errors.push("Supplier name is required");
    }
    
    if (!supplier.supplier_id) {
      errors.push("Please select a valid supplier from the list");
    }

    // ✅ NEW: Validate payment mode if amount is paid
    const paid = parseFloat(supplier.amountPaid) || 0;
    if (paid > 0 && !supplier.paymentMode) {
      errors.push("Payment mode is required when amount is paid");
    }

    // ✅ NEW: Validate amount paid doesn't exceed total
    if (paid > total) {
      errors.push(`Amount paid (₹${paid.toFixed(2)}) cannot exceed total amount (₹${total.toFixed(2)})`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [supplier, total]);

  /**
   * Reset supplier to default state
   */
  const resetSupplier = useCallback(() => {
    setSupplier(getDefaultSupplier());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Clear all stored data (for New Invoice)
   */
  const clearStoredData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * ✅ NEW: Update a single field
   */
  const updateField = useCallback((field, value) => {
    setSupplier(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * ✅ NEW: Get payment status summary
   */
  const getPaymentStatus = useCallback(() => {
    const paid = parseFloat(supplier.amountPaid) || 0;
    const balance = parseFloat(supplier.balance) || 0;
    
    if (paid === 0) {
      return {
        status: 'UNPAID',
        statusText: 'Unpaid',
        color: 'red',
      };
    }
    
    if (balance === 0) {
      return {
        status: 'PAID',
        statusText: 'Fully Paid',
        color: 'green',
      };
    }
    
    return {
      status: 'PARTIALLY_PAID',
      statusText: 'Partially Paid',
      color: 'yellow',
    };
  }, [supplier.amountPaid, supplier.balance]);

  return {
    supplier,
    setSupplier,
    suppliersList,
    setSuppliersList,
    selectSupplier,
    validateSupplier,
    resetSupplier,
    clearStoredData,
    updateField, // ✅ NEW
    getPaymentStatus, // ✅ NEW
    isInitialized,
  };
};

export default usePurchaseSupplier;