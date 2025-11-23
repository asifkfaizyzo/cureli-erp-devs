// src/components/billing/BillingSummaryCard.jsx

const BillingSummaryCard = () => {
  // ---- Dummy Billing Data (replace with real calculations later) ----
  const dummySummary = {
    subTotal: 96.00,
    sgst: 11.00,
    cgst: 10.00,
    total: 127.00,
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-80 text-sm">

      {/* Summary Values */}
      <div className="space-y-1 text-xs text-gray-700">
        <div className="flex justify-between">
          <span>Sub Total</span>
          <span>₹ {dummySummary.subTotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>SGST</span>
          <span>₹ {dummySummary.sgst.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>CGST</span>
          <span>₹ {dummySummary.cgst.toFixed(2)}</span>
        </div>
      </div>

      {/* Total Amount */}
      <div className="mt-1 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center text-base font-medium">
          <span>Total Amount:</span>
          <span>₹ {dummySummary.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default BillingSummaryCard;
