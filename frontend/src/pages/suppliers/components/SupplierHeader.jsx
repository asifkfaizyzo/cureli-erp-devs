// src/pages/supplier/components/SupplierHeader.jsx
import React from "react";
import { 
  User, 
  Phone, 
  Plus, 
  RotateCcw,
  Hash,
  Users
} from "lucide-react";

const FilterField = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
      <Icon size={10} />
      {label}
    </label>
    {children}
  </div>
);

const SupplierHeader = ({ filters, onChange, onReset, onAdd }) => {
  const inputBase = `
    h-8 px-3
    bg-white border border-slate-300 rounded-lg
    text-xs text-slate-700 placeholder:text-slate-400
    focus:outline-none focus:border-indigo-500 
    focus:ring-2 focus:ring-indigo-500/20
    hover:border-slate-400
    transition-all duration-150
  `;

  const hasActiveFilters = filters && Object.values(filters).some(
    (val) => val && val.trim() !== ""
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm font-poppins overflow-hidden">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Supplier Filters</h3>
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 h-7 px-4 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
          >
            <Plus size={12} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Filter Fields */}
      <div className="flex flex-wrap items-end gap-4 p-4">
        
        <FilterField label="Supplier Name" icon={User}>
          <input
            type="text"
            className={`${inputBase} w-48`}
            placeholder="Search by name..."
            value={filters?.name || ""}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </FilterField>

        <FilterField label="Supplier ID" icon={Hash}>
          <input
            type="text"
            className={`${inputBase} w-32`}
            placeholder="ID..."
            value={filters?.supplierId || ""}
            onChange={(e) => onChange("supplierId", e.target.value)}
          />
        </FilterField>

        <FilterField label="Contact" icon={Phone}>
          <input
            type="text"
            className={`${inputBase} w-40`}
            placeholder="Phone number..."
            value={filters?.contact || ""}
            onChange={(e) => onChange("contact", e.target.value)}
          />
        </FilterField>

      </div>
    </div>
  );
};

export default SupplierHeader;