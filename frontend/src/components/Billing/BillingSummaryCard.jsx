const BillingSummaryCard = ({ summary }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-80 text-sm">

      <div className="space-y-1 text-xs text-gray-700">
        <div className="flex justify-between">
          <span>Sub Total</span>
          <span>₹ {summary.subTotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>SGST</span>
          <span>₹ {summary.sgst.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>CGST</span>
          <span>₹ {summary.cgst.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-1 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center text-base font-medium">
          <span>Total Amount:</span>
          <span>₹ {summary.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default BillingSummaryCard;

// const BillingSummaryCard = ({ summary }) => {
//   return (
//     <div className="h-full flex flex-col p-3">
      
//       <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">
//         Payment Summary
//       </h3>

//       {/* Reduced text size to text-[11px] and gap-1.5 */}
//       <div className="flex-1 flex flex-col gap-1.5 text-[11px] justify-center">
//         <div className="flex justify-between text-gray-600">
//           <span>Sub Total</span>
//           <span className="font-semibold text-gray-900">₹ {summary.subTotal.toFixed(2)}</span>
//         </div>

//         <div className="flex justify-between text-gray-600">
//           <span>SGST <span className="text-[9px] text-gray-400">(2.5%)</span></span>
//           <span className="font-semibold text-gray-900">₹ {summary.sgst.toFixed(2)}</span>
//         </div>

//         <div className="flex justify-between text-gray-600">
//           <span>CGST <span className="text-[9px] text-gray-400">(2.5%)</span></span>
//           <span className="font-semibold text-gray-900">₹ {summary.cgst.toFixed(2)}</span>
//         </div>
//       </div>

//       {/* Compact Total Section */}
//       <div className="mt-auto pt-2 border-t-2 border-dashed border-gray-200 bg-gray-50/50 rounded-lg p-2 -mx-1">
//         <div className="flex justify-between items-end">
//           <span className="text-xs font-bold text-gray-600 mb-0.5">Net Payable</span>
//           {/* Reduced total size from 3xl to 2xl */}
//           <span className="text-2xl font-extrabold text-[#05015A] leading-none">
//             ₹ {Math.round(summary.total).toFixed(2)}
//           </span>
//         </div>
//         <div className="text-right text-[9px] text-gray-400 mt-0.5 font-medium">
//           (Inclusive of all taxes)
//         </div>
//       </div>

//     </div>
//   );
// };

// export default BillingSummaryCard;