// src/hooks/sales/useSalesCalculation.js

import { useMemo } from "react";

export function calculateSalesRow(item) {
  const qty = parseFloat(item.qty) || 0;
  
  // ✅ Use rate (selling price) - this is GST-inclusive
  const inclusiveRate = parseFloat(item.rate) || parseFloat(item.mrp) || 0;
  const discountPercent = parseFloat(item.discountPercent) || 0;
  const cgstPercent = parseFloat(item.cgstPercent) || 6;
  const sgstPercent = parseFloat(item.sgstPercent) || 6;

  const grossAmount = qty * inclusiveRate;
  const discountAmount = (grossAmount * discountPercent) / 100;
  const amountAfterDiscount = grossAmount - discountAmount;

  // ✅ Back-calculate tax (for display only)
  const totalGstPercent = cgstPercent + sgstPercent;
  const taxableAmount = amountAfterDiscount / (1 + totalGstPercent / 100);
  const cgstAmount = (taxableAmount * cgstPercent) / 100;
  const sgstAmount = (taxableAmount * sgstPercent) / 100;

  // ✅ Amount = rate × qty - discount (NO tax added)
  const amount = amountAfterDiscount;

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
    let totalTaxableAmount = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;

    rows.forEach((row) => {
      if (!row.name || !row.qty) return;
      
      const qty = parseFloat(row.qty) || 0;
      
      // ✅ Use rate (selling price)
      const inclusiveRate = parseFloat(row.rate) || parseFloat(row.mrp) || 0;
      const discountPercent = parseFloat(row.discountPercent) || 0;
      
      const gross = qty * inclusiveRate;
      const itemDiscount = (gross * discountPercent) / 100;
      const amountAfterItemDiscount = gross - itemDiscount;

      // Back-calculate tax
      const cgstPct = parseFloat(row.cgstPercent) || 6;
      const sgstPct = parseFloat(row.sgstPercent) || 6;
      const totalGstPct = cgstPct + sgstPct;
      
      const itemTaxable = amountAfterItemDiscount / (1 + totalGstPct / 100);
      const itemCgst = (itemTaxable * cgstPct) / 100;
      const itemSgst = (itemTaxable * sgstPct) / 100;
      
      subtotal += gross;
      itemDiscountAmount += itemDiscount;
      totalTaxableAmount += itemTaxable;
      totalCgstAmount += itemCgst;
      totalSgstAmount += itemSgst;
    });

    // Customer discount
    const afterItemDiscount = subtotal - itemDiscountAmount;
    const customerDiscountAmount = (afterItemDiscount * customerDiscountPercent) / 100;

    // Final net (already inclusive)
    const netAmountBeforeRounding = subtotal - itemDiscountAmount - customerDiscountAmount;

    // Recalculate tax proportionally
    const discountRatio = afterItemDiscount > 0 ? netAmountBeforeRounding / afterItemDiscount : 0;
    const finalTaxable = totalTaxableAmount * discountRatio;
    const finalCgst = totalCgstAmount * discountRatio;
    const finalSgst = totalSgstAmount * discountRatio;
    const totalTax = finalCgst + finalSgst;

    const totalDiscount = itemDiscountAmount + customerDiscountAmount;
    const roundOff = Math.round(netAmountBeforeRounding) - netAmountBeforeRounding;
    const netAmount = Math.round(netAmountBeforeRounding);

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