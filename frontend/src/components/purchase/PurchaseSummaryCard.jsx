// src/components/purchase/PurchaseSummaryCard.jsx
const PurchaseSummaryCard = ({ summary }) => {
  return (
    <div className="bg-[#F5F6FA] shadow-sm border border-gray-200 rounded-xl p-3 w-60 text-sm">
      <div className="flex justify-between">
        <span>Sub Total</span>
        <span>₹ {summary.subTotal}</span>
      </div>

      <div className="flex justify-between">
        <span>SGST</span>
        <span>₹ {summary.sgst}</span>
      </div>

      <div className="flex justify-between">
        <span>CGST</span>
        <span>₹ {summary.cgst}</span>
      </div>

      <hr className="my-2" />

      <div className="flex justify-between font-semibold text-base">
        <span>Grand Total</span>
        <span>₹ {summary.total}</span>
      </div>
    </div>
  );
};

export default PurchaseSummaryCard;

