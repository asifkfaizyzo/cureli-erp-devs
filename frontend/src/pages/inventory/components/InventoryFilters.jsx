import React from "react";
import { Search, Package } from "lucide-react";

const InventoryFilters = ({ filters, onChange }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2 flex items-end gap-3">
      <div className="relative">
        <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
        <input
          className="h-8 pl-7 pr-3 border border-slate-200 rounded text-xs"
          placeholder="Search medicine, supplier..."
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
        />
      </div>

      <button className="ml-auto h-8 px-4 bg-[#000060] text-white text-xs rounded flex items-center gap-1">
        <Package size={13} />
        Search
      </button>
    </div>
  );
};

export default InventoryFilters;
