// src/hooks/usePurchaseCalculation.js
import { useMemo, useCallback } from "react";

export const calculateRow = (row) => {
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

  return { ...row, schemeAmount, discountAmount, taxableValue, cgstAmount, sgstAmount, amount };
};

export const makeEmptyPurchaseRow = () => ({
  mfac: "", rack: "", name: "", hsn: "", pack: "", batch: "", exp: "",
  qty: "", sch: "", mrp: "", price: "", schemePercent: "", schemeAmount: "",
  discountPercent: "", discountAmount: "", taxableValue: "", cgstPercent: "9",
  cgstAmount: "", sgstPercent: "9", sgstAmount: "", amount: "",
});

export const usePurchaseCalculation = (rows) => {
  const summary = useMemo(() => {
    const taxable = rows.reduce((s, r) => s + (Number(r.taxableValue) || 0), 0);
    const cgst = rows.reduce((s, r) => s + (Number(r.cgstAmount) || 0), 0);
    const sgst = rows.reduce((s, r) => s + (Number(r.sgstAmount) || 0), 0);
    const totalItems = rows.filter(r => r.name).length;
    const totalQty = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    
    return {
      subTotal: +taxable.toFixed(2),
      cgst: +cgst.toFixed(2),
      sgst: +sgst.toFixed(2),
      total: +(taxable + cgst + sgst).toFixed(2),
      totalItems,
      totalQty,
    };
  }, [rows]);

  const recalculateRow = useCallback((row) => calculateRow(row), []);

  return { summary, recalculateRow, calculateRow };
};

export default usePurchaseCalculation;