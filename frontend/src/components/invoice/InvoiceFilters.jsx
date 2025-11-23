const InvoiceFilters = ({ filters, onChange }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex flex-wrap gap-4 items-end">

      {/* NAME */}
      <div>
        <label className="block text-xs font-semibold mb-1">Name:</label>
        <input
          type="text"
          placeholder="Search customer name"
          className="border rounded-lg px-3 py-2 text-sm w-48"
          value={filters.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      {/* BILL NO */}
      <div>
        <label className="block text-xs font-semibold mb-1">Bill No:</label>
        <input
          type="text"
          placeholder="Search bill number"
          className="border rounded-lg px-3 py-2 text-sm w-40"
          value={filters.billNo}
          onChange={(e) => onChange("billNo", e.target.value)}
        />
      </div>

      {/* PHONE */}
      <div>
        <label className="block text-xs font-semibold mb-1">PH No:</label>
        <input
          type="text"
          placeholder="Search phone number"
          className="border rounded-lg px-3 py-2 text-sm w-40"
          value={filters.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </div>

      {/* DATE RANGE */}
      <div>
        <label className="block text-xs font-semibold mb-1">Date:</label>
        <input
          type="date"
          className="border rounded-lg px-3 py-2 text-sm w-36"
          value={filters.fromDate}
          onChange={(e) => onChange("fromDate", e.target.value)}
        />
      </div>

      <span className="mt-4 font-semibold">TO</span>

      <div>
        <label className="block text-xs font-semibold mb-1">&nbsp;</label>
        <input
          type="date"
          className="border rounded-lg px-3 py-2 text-sm w-36"
          value={filters.toDate}
          onChange={(e) => onChange("toDate", e.target.value)}
        />
      </div>

      <button className="bg-[#05015A] text-white rounded-lg px-5 py-2 h-[42px] text-sm hover:bg-[#05015Ad1]">
        🔍 Search
      </button>

    </div>
  );
};

export default InvoiceFilters;
