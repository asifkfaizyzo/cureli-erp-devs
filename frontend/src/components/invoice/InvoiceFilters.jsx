import { useMenuStore } from "../../store/useMenuStore";
import { Search } from "lucide-react";

const InvoiceFilters = ({ filters, onChange }) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

  const inputBase =
    "border border-gray-300 rounded-lg px-3 py-2 transition-all duration-300";

  const inputNormal =
    "text-xs w-40 py-2 px-3";

  const inputShrunk =
    "text-[10px] w-28 py-1.5 px-2";

  const labelNormal =
    "text-xs font-semibold text-[#000060] whitespace-nowrap";

  const labelShrunk =
    "text-[10px] font-medium text-[#000060] whitespace-nowrap";

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm mb-4 flex items-center gap-3 px-4 py-2
        transition-all duration-300
        ${sidebarExpanded ? "py-1 gap-2" : "py-3 gap-4"}
      `}
    >

      {/* NAME */}
      <div className="flex items-center gap-2">
        <label className={sidebarExpanded ? labelShrunk : labelNormal}>Name:</label>
        <input
          type="text"
          placeholder="Search customer name"
          className={`${inputBase} ${sidebarExpanded ? inputShrunk : inputNormal}`}
          value={filters.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      {/* BILL NO */}
      <div className="flex items-center gap-2">
        <label className={sidebarExpanded ? labelShrunk : labelNormal}>Bill No:</label>
        <input
          type="text"
          placeholder="Search bill number"
          className={`${inputBase} ${sidebarExpanded ? inputShrunk : inputNormal}`}
          value={filters.billNo}
          onChange={(e) => onChange("billNo", e.target.value)}
        />
      </div>

      {/* PHONE */}
      <div className="flex items-center gap-2">
        <label className={sidebarExpanded ? labelShrunk : labelNormal}>PH No:</label>
        <input
          type="text"
          placeholder="Search phone number"
          className={`${inputBase} ${sidebarExpanded ? inputShrunk : inputNormal}`}
          value={filters.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </div>

      {/* DATE RANGE */}
      <div className="flex items-center gap-2">
        <label className={sidebarExpanded ? labelShrunk : labelNormal}>Date:</label>
        <input
          type="date"
          className={`${inputBase} ${sidebarExpanded ? "w-24 px-2 py-1.5 text-[10px]" : "w-32 px-3 py-2 text-xs"}`}
          value={filters.fromDate}
          onChange={(e) => onChange("fromDate", e.target.value)}
        />
      </div>

      {/* TO */}
      <span className={sidebarExpanded ? "text-[10px] font-medium" : "text-xs font-semibold"}>
        TO
      </span>

      <input
        type="date"
        className={`${inputBase} ${sidebarExpanded ? "w-24 px-2 py-1.5 text-[10px]" : "w-32 px-3 py-2 text-xs"}`}
        value={filters.toDate}
        onChange={(e) => onChange("toDate", e.target.value)}
      />

      {/* SEARCH BUTTON */}
      <button
        className={`
          bg-[#000060] text-white rounded-lg flex items-center gap-2 ml-auto
          transition-all duration-300
          ${sidebarExpanded ? "px-3 py-1.5 text-[11px]" : "px-5 py-2 text-sm"}
        `}
      >
        <Search size={sidebarExpanded ? 14 : 16} /> Search
      </button>
    </div>
  );
};

export default InvoiceFilters;
