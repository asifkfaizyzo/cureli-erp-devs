const BillingSummaryCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 w-80 text-sm">
      <div className="space-y-1 text-xs text-gray-700">
        <div className="flex justify-between">
          <span>Sub Total</span>
          <span>₹ 96.00</span>
        </div>
        <div className="flex justify-between">
          <span>SGST</span>
          <span>₹ 11.00</span>
        </div>
        <div className="flex justify-between">
          <span>CGST</span>
          <span>₹ 10.00</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-base font-semibold">
          <span>Total Amount:</span>
          <span>₹ 127.00</span>
        </div>
      </div>
    </div>
  );
};

export default BillingSummaryCard;
