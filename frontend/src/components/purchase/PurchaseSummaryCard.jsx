// src/components/purchase/PurchaseSummaryCard.jsx
import { Wallet } from "lucide-react";

const PurchaseSummaryCard = ({ summary }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 w-64 2xl:w-72 flex flex-col overflow-hidden h-full">
      
      {/* Header */}
      <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-2">
        <Wallet size={12} className="text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-700">Purchase Summary</h3>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col justify-center gap-1.5">
        <div className="flex justify-between text-[11px] text-gray-600">
          <span>Sub Total</span>
          <span className="font-medium text-gray-900">₹ {summary.subTotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-[11px] text-gray-600">
          <span>SGST (2.5%)</span>
          <span className="font-medium text-gray-900">₹ {summary.sgst.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-[11px] text-gray-600">
          <span>CGST (2.5%)</span>
          <span className="font-medium text-gray-900">₹ {summary.cgst.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#05015A] px-3 py-2 text-white mt-auto">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-medium opacity-90">Grand Total</span>
          <span className="text-lg font-bold">₹ {summary.total.toFixed(2)}</span>
        </div>
      </div>
      
    </div>
  );
};

export default PurchaseSummaryCard;
