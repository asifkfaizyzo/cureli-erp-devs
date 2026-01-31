// src/hooks/purchase/usePurchaseRows.js
import { useState, useEffect, useCallback, useRef } from "react";
import { makeEmptyPurchaseRow, calculateRow } from "./usePurchaseCalculation";

const STORAGE_KEY = 'cureli_purchase_rows';
const STORAGE_VERSION = 1;

/**
 * Load rows from localStorage
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Version check for future migrations
    if (parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // Check if data is not too old (24 hours)
    const savedAt = new Date(parsed.savedAt);
    const now = new Date();
    const hoursDiff = (now - savedAt) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      console.log('🗑️ Stored purchase data expired (>24 hours), clearing...');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return parsed.rows;
  } catch (error) {
    console.error('Failed to load purchase rows from storage:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

/**
 * Save rows to localStorage
 */
const saveToStorage = (rows) => {
  try {
    // Only save if there are filled rows
    const filledRows = rows.filter(r => r.name || r.qty || r.price);
    if (filledRows.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    
    const data = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      rows: rows,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save purchase rows to storage:', error);
  }
};

export const usePurchaseRows = (targetRowCount) => {
  const [rows, setRows] = useState([]);
  const [importVersion, setImportVersion] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Initialize from localStorage or create empty rows
  useEffect(() => {
    if (isInitialized) return;
    
    const storedRows = loadFromStorage();
    
    if (storedRows && storedRows.length > 0) {
      console.log('📦 Loaded', storedRows.length, 'rows from storage');
      setRows(storedRows);
    } else {
      setRows(Array.from({ length: targetRowCount }).map(makeEmptyPurchaseRow));
    }
    
    setIsInitialized(true);
  }, [targetRowCount, isInitialized]);

  // Ensure minimum row count
  useEffect(() => {
    if (!isInitialized) return;
    
    setRows((prev) => {
      if (prev.length < targetRowCount) {
        const needed = targetRowCount - prev.length;
        return [...prev, ...Array.from({ length: needed }).map(makeEmptyPurchaseRow)];
      }
      return prev;
    });
  }, [targetRowCount, isInitialized]);

  // Debounced save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save after 500ms of no changes
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(rows);
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [rows, isInitialized]);

  const updateRow = useCallback((index, updates) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = calculateRow({ ...newRows[index], ...updates });
      return newRows;
    });
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, makeEmptyPurchaseRow()]);
  }, []);

  const removeRow = useCallback((index) => {
    setRows(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /**
   * Clear all rows - resets to empty state
   */
  const clearAllRows = useCallback(() => {
    setRows(Array.from({ length: targetRowCount }).map(makeEmptyPurchaseRow));
    localStorage.removeItem(STORAGE_KEY);
  }, [targetRowCount]);

  /**
   * Import rows from file - merges with existing or replaces
   */
  const importRows = useCallback((parsedRows) => {
    setRows(prevRows => {
      const merged = [...prevRows];
      parsedRows.forEach((importedRow, idx) => {
        if (idx < merged.length) {
          merged[idx] = calculateRow({ ...merged[idx], ...importedRow });
        } else {
          merged.push(calculateRow(importedRow));
        }
      });
      while (merged.length < targetRowCount) merged.push(makeEmptyPurchaseRow());
      return merged;
    });
    setImportVersion(v => v + 1);
  }, [targetRowCount]);

  const getFilledRows = useCallback(() => {
    return rows.filter(r => r.name);
  }, [rows]);

  /**
   * Check if there are any unsaved rows
   */
  const hasUnsavedData = useCallback(() => {
    return rows.some(r => r.name || r.qty || r.price);
  }, [rows]);

  return {
    rows,
    setRows,
    updateRow,
    addRow,
    removeRow,
    clearAllRows,
    importRows,
    getFilledRows,
    importVersion,
    isInitialized,
    hasUnsavedData,
  };
};

export default usePurchaseRows;