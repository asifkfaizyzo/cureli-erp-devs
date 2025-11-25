// src/components/pending/PendingUsersFilters.jsx
import { Search } from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

const PendingUsersFilters = ({ filters, onChange }) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm mb-4 flex items-center gap-3 px-4 py-3 transition-all duration-300 ${
        sidebarExpanded ? "py-2 gap-2" : "py-3 gap-4"
      }`}
    >
      <div className="flex items-center gap-2">
        <label className={sidebarExpanded ? "text-[12px]" : "text-sm font-semibold text-[#000060]"}>
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search name, phone or id"
            className="pl-10 pr-3 py-2 w-64 border border-gray-300 rounded-lg text-sm"
            value={filters.q}
            onChange={(e) => onChange("q", e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <label className={sidebarExpanded ? "text-[12px]" : "text-sm font-semibold text-[#000060]"}>
          Status
        </label>
        <select
          value={filters.status}
          onChange={(e) => onChange("status", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>
    </div>
  );
};

export default PendingUsersFilters;
