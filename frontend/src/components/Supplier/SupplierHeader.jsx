import { Mail, Plus } from "lucide-react";

const SupplierHeader = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div className="flex items-center gap-3 w-full md:w-1/2">
        <div className="relative w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search supplier ID, name, contact or GST..."
            className="w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#05015A]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button
          className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:shadow-sm"
          onClick={() => navigator.clipboard?.writeText("")}
        >
          <Mail size={16} /> Export
        </button>

        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#05015A] text-white hover:opacity-95"
          onClick={() => {
            /* open add supplier modal (implement separately) */
          }}
        >
          <Plus size={16} /> Add Supplier
        </button>
      </div>
    </div>
  );
};

export default SupplierHeader;
