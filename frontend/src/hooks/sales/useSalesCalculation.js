// src/hooks/sales/useSalesCalculation.js

import { useMemo } from "react";

export function calculateSalesRow(item) {
  const qty = parseFloat(item.qty) || 0;
  const rate = parseFloat(item.rate) || parseFloat(item.mrp) || 0;
  const discountPercent = parseFloat(item.discountPercent) || 0;
  const cgstPercent = parseFloat(item.cgstPercent) || 6;
  const sgstPercent = parseFloat(item.sgstPercent) || 6;

  const grossAmount = qty * rate;
  const discountAmount = (grossAmount * discountPercent) / 100;
  const taxableAmount = grossAmount - discountAmount;
  const cgstAmount = (taxableAmount * cgstPercent) / 100;
  const sgstAmount = (taxableAmount * sgstPercent) / 100;
  const amount = taxableAmount + cgstAmount + sgstAmount;

  return {
    ...item,
    discountAmount: discountAmount.toFixed(2),
    taxableAmount: taxableAmount.toFixed(2),
    cgstAmount: cgstAmount.toFixed(2),
    sgstAmount: sgstAmount.toFixed(2),
    amount: amount.toFixed(2),
  };
}

export function useSalesCalculation(rows, customerDiscountPercent = 0) {
  const summary = useMemo(() => {
    let subtotal = 0;
    let itemDiscountAmount = 0;
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;

    rows.forEach((row) => {
      if (!row.name || !row.qty) return;
      
      const qty = parseFloat(row.qty) || 0;
      const rate = parseFloat(row.rate) || parseFloat(row.mrp) || 0;
      const discountPercent = parseFloat(row.discountPercent) || 0;
      
      const gross = qty * rate;
      const itemDiscount = (gross * discountPercent) / 100;
      const itemTaxable = gross - itemDiscount;
      
      subtotal += gross;
      itemDiscountAmount += itemDiscount;
      taxableAmount += itemTaxable;
      cgstAmount += parseFloat(row.cgstAmount) || 0;
      sgstAmount += parseFloat(row.sgstAmount) || 0;
    });

    // Customer discount (applied after item discounts)
    const afterItemDiscount = subtotal - itemDiscountAmount;
    const customerDiscountAmount = (afterItemDiscount * customerDiscountPercent) / 100;
    const finalTaxable = afterItemDiscount - customerDiscountAmount;

    // Recalculate tax proportionally
    const taxRatio = taxableAmount > 0 ? finalTaxable / taxableAmount : 0;
    const finalCgst = cgstAmount * taxRatio;
    const finalSgst = sgstAmount * taxRatio;
    const totalTax = finalCgst + finalSgst;

    const totalDiscount = itemDiscountAmount + customerDiscountAmount;
    const grossTotal = finalTaxable + totalTax;
    const roundOff = Math.round(grossTotal) - grossTotal;
    const netAmount = Math.round(grossTotal);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      itemDiscountAmount: Number(itemDiscountAmount.toFixed(2)),
      customerDiscountPercent: Number(customerDiscountPercent),
      customerDiscountAmount: Number(customerDiscountAmount.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      taxableAmount: Number(finalTaxable.toFixed(2)),
      cgstAmount: Number(finalCgst.toFixed(2)),
      sgstAmount: Number(finalSgst.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      roundOff: Number(roundOff.toFixed(2)),
      netAmount,
    };
  }, [rows, customerDiscountPercent]);

  return { summary };
}