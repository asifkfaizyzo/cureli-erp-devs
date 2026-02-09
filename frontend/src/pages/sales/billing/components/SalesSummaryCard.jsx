// src/pages/sales/billing/components/SalesSummaryCard.jsx

import { Wallet, TrendingUp, Percent, Calculator, Receipt, IndianRupee } from "lucide-react";

const SalesSummaryCard = ({ summary, customer, isLoading = false }) => {
  const netAmount = summary?.netAmount || 0;
  const cashReceived = parseFloat(customer?.cashReceived) || 0;
  const balance = netAmount - cashReceived;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 w-full flex flex-col overflow-hidden h-full">
        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-200 rounded animate-pulse" />
          <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="p-3 flex-1 flex flex-col justify-center gap-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
            </div>
          ))}
        </div>
        <div className="bg-slate-100 px-3 py-2 mt-auto">
          <div className="flex justify-between items-center">
            <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
            <div className="w-24 h-6 bg-slate-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 w-full flex flex-col overflow-hidden h-full">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Receipt size={12} className="text-indigo-600" />
        </div>
        <h3 className="text-xs font-bold text-gray-800">Bill Summary</h3>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col justify-center gap-2">
        {/* Sub Total */}
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Calculator size={10} />
            Sub Total
          </span>
          <span className="font-semibold text-gray-900">₹ {(summary?.subtotal || 0).toFixed(2)}</span>
        </div>

        {/* Item Discount */}
        {(summary?.itemDiscountAmount || 0) > 0 && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Percent size={10} />
              Item Discount
            </span>
            <span className="font-medium text-rose-600">- ₹ {(summary?.itemDiscountAmount || 0).toFixed(2)}</span>
          </div>
        )}

        {/* Customer Discount */}
        {(summary?.customerDiscountAmount || 0) > 0 && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500 flex items-center gap-1.5">
              <TrendingUp size={10} />
              Customer Disc ({customer?.discountPercent || 0}%)
            </span>
            <span className="font-medium text-rose-600">- ₹ {(summary?.customerDiscountAmount || 0).toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-dashed border-gray-200 my-1" />

        {/* Taxable Amount */}
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-500">Taxable Amount</span>
          <span className="font-medium text-gray-800">₹ {(summary?.taxableAmount || 0).toFixed(2)}</span>
        </div>

        {/* CGST */}
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-500">CGST</span>
          <span className="font-medium text-gray-700">₹ {(summary?.cgstAmount || 0).toFixed(2)}</span>
        </div>

        {/* SGST */}
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-500">SGST</span>
          <span className="font-medium text-gray-700">₹ {(summary?.sgstAmount || 0).toFixed(2)}</span>
        </div>

        {/* Round Off */}
        {(summary?.roundOff || 0) !== 0 && (
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-400">Round Off</span>
            <span className="text-gray-500">{(summary?.roundOff || 0) >= 0 ? '+' : ''} ₹ {(summary?.roundOff || 0).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Net Amount */}
      <div className="bg-[#05015A] px-3 py-2.5 text-white">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-medium opacity-90">Net Amount</span>
          <span className="text-xl font-bold">₹ {netAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Summary */}
      {cashReceived > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className="text-gray-500">Cash Received</span>
            <span className="font-semibold text-green-600">₹ {cashReceived.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className={`font-medium ${balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {balance > 0 ? 'Balance Due' : balance < 0 ? 'Return Change' : 'Settled'}
            </span>
            <span className={`font-bold ${balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
              ₹ {Math.abs(balance).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSummaryCard;