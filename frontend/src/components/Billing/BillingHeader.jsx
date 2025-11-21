const BillingHeader = () => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">
          Bill No : <span className="font-bold tracking-wide">123456</span>
        </h1>

        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600">
          <span>
            Billed by: <span className="font-medium text-gray-800">Amith</span>
          </span>
          <span>
            Date: <span className="font-medium text-gray-800">12/04/25</span>
          </span>
          <span>
            Time: <span className="font-medium text-gray-800">12:35 PM</span>
          </span>
        </div>
      </div>

      <button className="bg-[#000060] text-white text-sm px-5 py-2 rounded-lg shadow-sm hover:bg-[#000060d1] transition">
        Save &amp; Print (F5)
      </button>
    </div>
  );
};

export default BillingHeader;
