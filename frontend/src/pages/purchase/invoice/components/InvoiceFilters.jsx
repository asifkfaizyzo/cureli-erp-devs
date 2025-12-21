// frontend\src\pages\purchase\invoice\components\InvoiceFilter.jsx
import React from "react";
import { useMenuStore } from "../../../../store/useMenuStore";
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
        <FilterField label="supplier" icon={User}>
          <input
            type="text"
            className={`${inputBase} w-32`}
            placeholder="Name..."
            value={filters.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </FilterField>

        {/* BILL NUMBER */}
        <FilterField label="purchse id #" icon={Hash}>
          <input
            type="text"
            className={`${inputBase} w-24`}
            placeholder="Purch..."
            value={filters.billNo}
            onChange={(e) => onChange("billNo", e.target.value)}
          />
        </FilterField>

        {/* PHONE */}
        <FilterField label="Phone" icon={Phone}>
          <input
            type="number"
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
              bg-[#000060] text-white text-xs font-semibold
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