// src/hooks/sales/useSalesRows.js

import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = 'sales_billing_rows';
const STORAGE_EXPIRY_KEY = 'sales_billing_rows_expiry';
const EXPIRY_HOURS = 24; // Data expires after 24 hours

const makeEmptyRow = () => ({
  medicine_id: null,
  inventory_id: null,
  name: "",
  manufacturer: "",
  batch: "",
  exp: "",
  qty: "",
  mrp: "",
  rate: "",
  rack: "",
  stock: "",
  discountPercent: "0",
  cgstPercent: "6",
  sgstPercent: "6",
  amount: "",
  availableBatches: [],
});

// Helper to check if data is expired
const isDataExpired = () => {
  const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry);
};

// Helper to set expiry
const setExpiry = () => {
  const expiryTime = Date.now() + (EXPIRY_HOURS * 60 * 60 * 1000);
  localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());
};

// Helper to load from storage
const loadFromStorage = () => {
  try {
    if (isDataExpired()) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      return null;
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load sales rows from storage:', error);
  }
  return null;
};

// Helper to save to storage
const saveToStorage = (rows) => {
  try {
    // Only save rows with data
    const hasData = rows.some(row => row.name && row.name.trim() !== "");
    if (hasData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      setExpiry();
    } else {
      // Clear storage if no data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
    }
  } catch (error) {
    console.error('Failed to save sales rows to storage:', error);
  }
};

export function useSalesRows(initialRowCount = 8) {
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef(null);
  
  // Initialize rows from storage or create empty
  const [rows, setRows] = useState(() => {
    const storedRows = loadFromStorage();
    if (storedRows && storedRows.length > 0) {
      // Ensure minimum row count
      if (storedRows.length < initialRowCount) {
        const needed = initialRowCount - storedRows.length;
        return [...storedRows, ...Array.from({ length: needed }).map(makeEmptyRow)];
      }
      return storedRows;
    }
    return Array.from({ length: initialRowCount }).map(makeEmptyRow);
  });

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Ensure minimum rows when initialRowCount changes
  useEffect(() => {
    if (rows.length < initialRowCount) {
      const needed = initialRowCount - rows.length;
      setRows(prev => [...prev, ...Array.from({ length: needed }).map(makeEmptyRow)]);
    }
  }, [initialRowCount, rows.length]);

  // Debounced save to storage
  useEffect(() => {
    if (!isInitialized) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(rows);
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [rows, isInitialized]);

  // Get rows with actual data
  const getFilledRows = useCallback(() => {
    return rows.filter(row => 
      row.name && 
      row.name.trim() !== "" && 
      row.medicine_id &&
      row.inventory_id &&
      parseFloat(row.qty) > 0
    );
  }, [rows]);

  // Clear all rows and storage
  const clearAllRows = useCallback(() => {
    setRows(Array.from({ length: initialRowCount }).map(makeEmptyRow));
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
  }, [initialRowCount]);

  // Check if there's unsaved data
  const hasUnsavedData = useCallback(() => {
    return rows.some(row => row.name && row.name.trim() !== "");
  }, [rows]);

  // Import rows (replace all)
  const importRows = useCallback((newRows) => {
    const paddedRows = [...newRows];
    if (paddedRows.length < initialRowCount) {
      const needed = initialRowCount - paddedRows.length;
      paddedRows.push(...Array.from({ length: needed }).map(makeEmptyRow));
    }
    setRows(paddedRows);
  }, [initialRowCount]);

  // Force save (for before navigation)
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveToStorage(rows);
  }, [rows]);

  return {
    rows,
    setRows,
    getFilledRows,
    clearAllRows,
    hasUnsavedData,
    isInitialized,
    importRows,
    forceSave,
  };
}

// ============================================
// CUSTOMER DATA PERSISTENCE
// ============================================

const CUSTOMER_STORAGE_KEY = 'sales_billing_customer';

export function useSalesCustomer() {
  const [customer, setCustomer] = useState(() => {
    try {
      const stored = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if it has data
        if (parsed.name || parsed.phone || parsed.patientName) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load customer from storage:', error);
    }
    
    return {
      customer_id: null,
      name: "",
      phone: "",
      address: "",
      doctorName: "",
      patientName: "",
      paymentType: "CASH",
      cashReceived: "",
      gstNumber: "",
      discountPercent: 0,
      eWayBillNo: "",
      sameAsCustomer: false,
    };
  });

  // Save to storage on change
  useEffect(() => {
    const hasData = customer.name || customer.phone || customer.patientName || customer.doctorName;
    if (hasData) {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
    } else {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    }
  }, [customer]);

  const clearCustomer = useCallback(() => {
    setCustomer({
      customer_id: null,
      name: "",
      phone: "",
      address: "",
      doctorName: "",
      patientName: "",
      paymentType: "CASH",
      cashReceived: "",
      gstNumber: "",
      discountPercent: 0,
      eWayBillNo: "",
      sameAsCustomer: false,
    });
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  }, []);

  return {
    customer,
    setCustomer,
    clearCustomer,
  };
}