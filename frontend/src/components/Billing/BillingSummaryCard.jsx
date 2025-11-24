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
