import { Download, Plus } from "lucide-react";

const ShopsHeader = ({ search, setSearch }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-sm">

      {/* Search */}
      <div className="flex items-center w-full md:w-1/3">
        <input
          type="text"
          placeholder="Search business, owner or GST..."
          className="
            w-full px-4 py-3 rounded-lg border focus:outline-none
            bg-gray-50 text-gray-700
          "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">

        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white shadow-sm"
        >
          <Download size={18} /> Export
        </button>

        <button
          className="flex items-center gap-2 bg-[#05015A] text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Add Shop
        </button>
      </div>
    </div>
  );
};

export default ShopsHeader;

