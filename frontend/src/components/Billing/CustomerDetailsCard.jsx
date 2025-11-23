const CustomerDetailsCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-xs flex-1">
      <div className="grid grid-cols-12 gap-3 mb-1">
        <div className="col-span-2">
          <label className="block text-[11px] text-gray-500 mb-1">Cust ID</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            defaultValue="123564"
          />
        </div>
        <div className="col-span-5">
          <label className="block text-[11px] text-gray-500 mb-1">
            Cust Name
          </label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            defaultValue="Zyan Medicals"
          />
        </div>
        <div className="col-span-3">
          <label className="block text-[11px] text-gray-500 mb-1">Cust Ph</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            defaultValue="9845349642"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] text-gray-500 mb-1">e-Way</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            defaultValue="1255736"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 items-center">
        <div className="col-span-8">
          <label className="block text-[11px] text-gray-500 mb-1">
            Address
          </label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            defaultValue="Bank Road, Super Bazar complex, Ernakulam"
          />
        </div>
        <div className="col-span-4">
          <label className="block text-[11px] text-gray-500 mb-1">
            Payment Methods
          </label>
          <select className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs">
            <option>Cash</option>
            <option>Card</option>
            <option>UPI</option>
            <option>Credit</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsCard;
