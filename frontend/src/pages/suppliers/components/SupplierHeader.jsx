import React from "react";
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  Plus, 
  RotateCcw,
  Hash
} from "lucide-react";
import { useMenuStore } from "../../../store/useMenuStore"; // Assuming store

/* ─────────────────── FILTER FIELD COMPONENT (Reused Pattern) ─────────────────── */
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

const SupplierHeader = ({ filters, onChange, onSearch, onReset, onAdd }) => {
  // Reusing input styles from InvoiceFilters
  const inputBase = `
    h-8 pl-9 pr-2
    bg-white border border-slate-200 rounded
    text-xs text-slate-700 placeholder:text-slate-400
    focus:outline-none focus:border-blue-500 
    focus:ring-1 focus:ring-blue-500/20
    hover:border-slate-300
    transition-all duration-150
  `;

  // Check if any filter is active
  const hasActiveFilters = filters && Object.values(filters).some(
    (val) => val && val.trim() !== ""
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm font-poppins">
      {/* ─────────── SINGLE ROW LAYOUT ─────────── */}
      <div className="flex flex-wrap items-end gap-3 px-3 py-2">
        
        {/* SUPPLIER NAME */}
        <FilterField label="Supplier" icon={User}>
          <input
            type="text"
            className={`${inputBase} w-32`}
            placeholder="Name..."
            value={filters?.name || ""}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </FilterField>

        {/* SUPPLIER ID */}
        <FilterField label="Supplier ID" icon={Hash}>
          <input
            type="text"
            className={`${inputBase} w-24`}
            placeholder="ID..."
            value={filters?.supplierId || ""}
            onChange={(e) => onChange("supplierId", e.target.value)}
          />
        </FilterField>

        {/* PHONE */}
        <FilterField label="Phone" icon={Phone}>
          <input
            type="text"
            className={`${inputBase} w-28`}
            placeholder="98765..."
            value={filters?.contact || ""}
            onChange={(e) => onChange("contact", e.target.value)}
          />
        </FilterField>

        {/* DIVIDER */}
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

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

          {/* EXPORT (Previously in your snippet) */}
          <button
            onClick={() => navigator.clipboard?.writeText("")}
            className="
              flex items-center justify-center
              h-8 w-8 rounded
              text-slate-500 bg-slate-50 border border-slate-200
              hover:bg-slate-100 hover:text-slate-700
              active:scale-95 transition-all duration-150
            "
            title="Export"
          >
            <Mail size={13} />
          </button>

          {/* SEARCH */}
          <button
            onClick={onSearch}
            className="
              flex items-center gap-1.5 h-8 px-3
              bg-white text-[#000060] border border-[#000060] text-xs font-semibold
              rounded shadow-sm
              hover:bg-blue-50
              active:scale-95 transition-all duration-150
            "
          >
            <Search size={13} />
            Search
          </button>

          {/* ADD SUPPLIER (Primary Action) */}
          <button
            onClick={onAdd}
            className="
              flex items-center gap-1.5 h-8 px-4
              bg-[#000060] text-white text-xs font-semibold
              rounded shadow-sm
              hover:bg-blue-700
              active:scale-95 transition-all duration-150
            "
          >
            <Plus size={13} />
            Add Supplier
          </button>
        </div>

        {/* ACTIVE FILTER INDICATOR */}
        {hasActiveFilters && (
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mb-4 sm:mb-0" />
        )}
      </div>
    </div>
  );
};

export default SupplierHeader;
