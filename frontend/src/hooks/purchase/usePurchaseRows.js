// src/hooks/usePurchaseRows.js
import { useState, useEffect, useCallback } from "react";
import { makeEmptyPurchaseRow, calculateRow } from "./usePurchaseCalculation";

export const usePurchaseRows = (targetRowCount) => {
  const [rows, setRows] = useState([]);
  const [importVersion, setImportVersion] = useState(0);

  // Ensure minimum row count
  useEffect(() => {
    setRows((prev) => {
      if (prev.length < targetRowCount) {
        const needed = targetRowCount - prev.length;
        return [...prev, ...Array.from({ length: needed }).map(makeEmptyPurchaseRow)];
      }
      return prev.length > 0 ? prev : Array.from({ length: targetRowCount }).map(makeEmptyPurchaseRow);
    });
  }, [targetRowCount]);

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

  const clearAllRows = useCallback(() => {
    setRows(Array.from({ length: targetRowCount }).map(makeEmptyPurchaseRow));
  }, [targetRowCount]);

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
  };
};

export default usePurchaseRows;