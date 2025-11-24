const CustomerDetailsCard = ({ customer, setCustomer }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-xs flex-1">

      <div className="grid grid-cols-12 gap-3 mb-1">

        {/* CUST ID READ ONLY */}
        <div className="col-span-2">
          <label className="block text-[11px] text-gray-500 mb-1">Cust ID</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs bg-gray-100 cursor-not-allowed"
            value={customer.id}
            readOnly
          />
        </div>

        {/* Cust Name */}
        <div className="col-span-5">
          <label className="block text-[11px] text-gray-500 mb-1">Cust Name</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            placeholder="Enter Customer Name"
            value={customer.name || ""}
            onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        {/* Phone */}
        <div className="col-span-3">
          <label className="block text-[11px] text-gray-500 mb-1">Cust Ph</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            placeholder="Phone Number"
            value={customer.phone || ""}
            onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        {/* eWay Optional */}
        <div className="col-span-2">
          <label className="block text-[11px] text-gray-500 mb-1">e-Way</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            placeholder="Optional"
            value={customer.eway || ""}
            onChange={(e) => setCustomer((prev) => ({ ...prev, eway: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 items-center">
        <div className="col-span-8">
          <label className="block text-[11px] text-gray-500 mb-1">Address</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            placeholder="Customer Address"
            value={customer.address || ""}
            onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="col-span-4">
          <label className="block text-[11px] text-gray-500 mb-1">Payment Methods</label>
          <select
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
            value={customer.payment || "Cash"}
            onChange={(e) => setCustomer((prev) => ({ ...prev, payment: e.target.value }))}
          >
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
