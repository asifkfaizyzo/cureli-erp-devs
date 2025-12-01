import ShopRow from "./ShopRow";

const ShopsTable = ({ shops }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#05015A] text-white">
          <tr>
            <th className="py-4 px-3 text-left">#</th>
            <th className="py-4 px-3 text-left">Business Name</th>
            <th className="py-4 px-3 text-left">Owner Name</th>
            <th className="py-4 px-3 text-left">GST Number</th>
            <th className="py-4 px-3 text-left">Business Type</th>
            <th className="py-4 px-3 text-left">Verification</th>
            <th className="py-4 px-3 text-left">Location</th>
            <th className="py-4 px-3 text-left">Subscription</th>
            <th className="py-4 px-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {shops.map((shop, idx) => (
            <ShopRow key={idx} index={idx + 1} shop={shop} />
          ))}
        </tbody>
      </table>

      {/* footer text */}
      <div className="p-4 text-sm text-gray-500">
        Showing {shops.length > 0 ? 1 : 0} to {shops.length} results
      </div>
    </div>
  );
};

export default ShopsTable;
