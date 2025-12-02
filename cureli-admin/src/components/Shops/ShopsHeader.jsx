import { Download, Plus } from "lucide-react";

const ShopsHeader = ({ search, setSearch }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-lg shadow-sm">

      {/* Search */}
      <div className="flex items-center w-full md:w-1/3">
        <input
          type="text"
          placeholder="Search business or owner"
          className="
            w-full px-3 py-2 rounded-md border text-sm
            focus:outline-none bg-gray-50 text-gray-700
          "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">

        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-md border bg-white shadow-sm text-sm"
        >
          <Download size={16} /> Export
        </button>

        <button
          className="flex items-center gap-1 bg-[#05015A] text-white px-3 py-1.5 rounded-md text-sm"
        >
          <Plus size={16} /> Add Shop
        </button>
      </div>
    </div>
  );
};

export default ShopsHeader;
