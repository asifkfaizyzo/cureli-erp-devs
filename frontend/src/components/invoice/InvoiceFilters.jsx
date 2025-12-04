// import { useMenuStore } from "../../store/useMenuStore";
// import { Search } from "lucide-react";

// const InvoiceFilters = ({ filters, onChange }) => {
//   const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

//   const inputBase =
//     "border border-gray-300 rounded-lg px-3 py-2 transition-all duration-300";

//   const inputNormal =
//     "text-xs w-40 py-2 px-3";

//   const inputShrunk =
//     "text-[10px] w-28 py-1.5 px-2";

//   const labelNormal =
//     "text-xs font-semibold text-[#000060] whitespace-nowrap";

//   const labelShrunk =
//     "text-[10px] font-medium text-[#000060] whitespace-nowrap";

//   return (
//     <div
//       className={`
//         bg-white rounded-xl shadow-sm mb-4 flex items-center gap-3 px-4 py-2
//         transition-all duration-300
//         ${sidebarExpanded ? "py-1 gap-2" : "py-3 gap-4"}
//       `}
//     >

//       {/* NAME */}
//       <div className="flex items-center gap-2">
//         <label className={sidebarExpanded ? labelShrunk : labelNormal}>Name:</label>
//         <input
//           type="text"
//           placeholder="Search customer name"
//           className={`${inputBase} ${sidebarExpanded ? inputShrunk : inputNormal}`}
//           value={filters.name}
//           onChange={(e) => onChange("name", e.target.value)}
//         />
//       </div>

//       {/* BILL NO */}
//       <div className="flex items-center gap-2">
//         <label className={sidebarExpanded ? labelShrunk : labelNormal}>Bill No:</label>
//         <input
//           type="text"
//           placeholder="Search bill number"
//           className={`${inputBase} ${sidebarExpanded ? inputShrunk : inputNormal}`}
//           value={filters.billNo}
//           onChange={(e) => onChange("billNo", e.target.value)}
//         />
//       </div>

//       {/* PHONE */}
//       <div className="flex items-center gap-2">
//         <label className={sidebarExpanded ? labelShrunk : labelNormal}>PH No:</label>
//         <input
//           type="text"
//           placeholder="Search phone number"
//           className={`${inputBase} ${sidebarExpanded ? inputShrunk : inputNormal}`}
//           value={filters.phone}
//           onChange={(e) => onChange("phone", e.target.value)}
//         />
//       </div>

//       {/* DATE RANGE */}
//       <div className="flex items-center gap-2">
//         <label className={sidebarExpanded ? labelShrunk : labelNormal}>Date:</label>
//         <input
//           type="date"
//           className={`${inputBase} ${sidebarExpanded ? "w-24 px-2 py-1.5 text-[10px]" : "w-32 px-3 py-2 text-xs"}`}
//           value={filters.fromDate}
//           onChange={(e) => onChange("fromDate", e.target.value)}
//         />
//       </div>

//       {/* TO */}
//       <span className={sidebarExpanded ? "text-[10px] font-medium" : "text-xs font-semibold"}>
//         TO
//       </span>

//       <input
//         type="date"
//         className={`${inputBase} ${sidebarExpanded ? "w-24 px-2 py-1.5 text-[10px]" : "w-32 px-3 py-2 text-xs"}`}
//         value={filters.toDate}
//         onChange={(e) => onChange("toDate", e.target.value)}
//       />

//       {/* SEARCH BUTTON */}
//       <button
//         className={`
//           bg-[#000060] text-white rounded-lg flex items-center gap-2 ml-auto
//           transition-all duration-300
//           ${sidebarExpanded ? "px-3 py-1.5 text-[11px]" : "px-5 py-2 text-sm"}
//         `}
//       >
//         <Search size={sidebarExpanded ? 14 : 16} /> Search
//       </button>
//     </div>
//   );
// };

// export default InvoiceFilters;

import React from "react";
import { useMenuStore } from "../../store/useMenuStore";
import {
  Search,
  User,
  Hash,
  Phone,
  Calendar,
  RotateCcw,
  ChevronRight,
} from "lucide-react";

/* ─────────────────── FILTER FIELD COMPONENT ─────────────────── */
const FilterField = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">
      {label}
    </label>
    <div className="relative group">
      <div
        className="
          absolute left-0 top-0 h-full w-7
          flex items-center justify-center
          bg-slate-50 border-r border-slate-200
          rounded-l text-slate-400
          group-focus-within:bg-blue-50 
          group-focus-within:text-blue-600
          transition-all duration-150
        "
      >
        <Icon size={12} />
      </div>
      {children}
    </div>
  </div>
);

/* ─────────────────── MAIN COMPONENT ─────────────────── */
const InvoiceFilters = ({ filters, onChange, onSearch, onReset }) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

  const inputBase = `
    h-8 pl-9 pr-2
    bg-white border border-slate-200 rounded
    text-xs text-slate-700 placeholder:text-slate-400
    focus:outline-none focus:border-blue-500 
    focus:ring-1 focus:ring-blue-500/20
    hover:border-slate-300
    transition-all duration-150
  `;

  const dateInput = `
    h-8 pl-9 pr-2 w-28
    bg-white border border-slate-200 rounded
    text-xs text-slate-700
    focus:outline-none focus:border-blue-500 
    focus:ring-1 focus:ring-blue-500/20
    hover:border-slate-300
    transition-all duration-150
    cursor-pointer
  `;

  const hasActiveFilters = Object.values(filters).some(
    (val) => val && val.trim() !== ""
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* ─────────── SINGLE ROW LAYOUT ─────────── */}
      <div className="flex items-end gap-3 px-3 py-2">
        
        {/* CUSTOMER */}
        <FilterField label="Customer" icon={User}>
          <input
            type="text"
            className={`${inputBase} w-32`}
            placeholder="Name..."
            value={filters.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </FilterField>

        {/* BILL NUMBER */}
        <FilterField label="Invoice #" icon={Hash}>
          <input
            type="text"
            className={`${inputBase} w-24`}
            placeholder="INV..."
            value={filters.billNo}
            onChange={(e) => onChange("billNo", e.target.value)}
          />
        </FilterField>

        {/* PHONE */}
        <FilterField label="Phone" icon={Phone}>
          <input
            type="text"
            className={`${inputBase} w-28`}
            placeholder="98765..."
            value={filters.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </FilterField>

        {/* DIVIDER */}
        <div className="h-8 w-px bg-slate-200" />

        {/* FROM DATE */}
        <FilterField label="From" icon={Calendar}>
          <input
            type="date"
            className={dateInput}
            value={filters.fromDate}
            onChange={(e) => onChange("fromDate", e.target.value)}
          />
        </FilterField>

        {/* Arrow */}
        <div className="flex items-center h-8 text-slate-300">
          <ChevronRight size={14} />
        </div>

        {/* TO DATE */}
        <FilterField label="To" icon={Calendar}>
          <input
            type="date"
            className={dateInput}
            value={filters.toDate}
            onChange={(e) => onChange("toDate", e.target.value)}
          />
        </FilterField>

        {/* ─────────── ACTION BUTTONS ─────────── */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* RESET */}
          <button
            onClick={onReset}
            className="
              flex items-center justify-center
              h-8 w-8 rounded
              text-slate-500 bg-slate-50 border border-slate-200
              hover:bg-slate-100 hover:text-slate-700
              active:scale-95 transition-all duration-150
            "
            title="Reset Filters"
          >
            <RotateCcw size={13} />
          </button>

          {/* SEARCH */}
          <button
            onClick={onSearch}
            className="
              flex items-center gap-1.5 h-8 px-4
              bg-blue-600 text-white text-xs font-semibold
              rounded shadow-sm
              hover:bg-blue-700
              active:scale-95 transition-all duration-150
            "
          >
            <Search size={13} />
            Search
          </button>
        </div>

        {/* ACTIVE FILTER INDICATOR */}
        {hasActiveFilters && (
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default InvoiceFilters;