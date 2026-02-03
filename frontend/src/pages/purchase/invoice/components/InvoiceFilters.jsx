// frontend/src/pages/purchase/invoice/components/InvoiceFilters.jsx
import React from "react";
import { Search, Building2, Hash, Calendar, RotateCcw, ChevronRight, Filter } from "lucide-react";

const FilterField = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-[9px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
      {Icon && <Icon size={10} />}
      {label}
    </label>
    <div className="relative group">
      {children}
    </div>
  </div>
);

const InvoiceFilters = ({ filters, onChange, onSearch, onReset }) => {
  const inputBase = `
    h-9 px-3 w-full
    bg-white border border-gray-200 rounded-lg
    text-xs text-gray-700 placeholder:text-gray-400
    focus:outline-none focus:border-indigo-500 
    focus:ring-2 focus:ring-indigo-500/20
    hover:border-gray-300
    transition-all duration-150
  `;

  const selectBase = `
    h-9 px-3 w-full
    bg-white border border-gray-200 rounded-lg
    text-xs text-gray-700
    focus:outline-none focus:border-indigo-500 
    focus:ring-2 focus:ring-indigo-500/20
    hover:border-gray-300
    transition-all duration-150
    cursor-pointer
  `;

  const hasActiveFilters = Object.values(filters).some(
    (val) => val && val.toString().trim() !== ""
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        
        {/* Filter Icon & Title */}
        <div className="flex items-center gap-2 text-gray-700 shrink-0">
          <Filter size={16} className="text-indigo-600" />
          <span className="text-sm font-semibold">Filters</span>
        </div>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* Supplier Name */}
        <FilterField label="Supplier" icon={Building2}>
          <input
            type="text"
            className={`${inputBase} w-40`}
            placeholder="Supplier name..."
            value={filters.supplierName || ""}
            onChange={(e) => onChange("supplierName", e.target.value)}
          />
        </FilterField>

        {/* Invoice Number */}
        <FilterField label="Invoice #" icon={Hash}>
          <input
            type="text"
            className={`${inputBase} w-32`}
            placeholder="PUR-000001..."
            value={filters.invoiceNumber || ""}
            onChange={(e) => onChange("invoiceNumber", e.target.value)}
          />
        </FilterField>

        {/* Status Filter */}
        <FilterField label="Status">
          <select
            className={selectBase + " w-32"}
            value={filters.status || ""}
            onChange={(e) => onChange("status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </FilterField>

        {/* Payment Status */}
        <FilterField label="Payment">
          <select
            className={selectBase + " w-32"}
            value={filters.paymentStatus || ""}
            onChange={(e) => onChange("paymentStatus", e.target.value)}
          >
            <option value="">All Payments</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
          </select>
        </FilterField>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* From Date */}
        <FilterField label="From" icon={Calendar}>
          <input
            type="date"
            className={`${inputBase} w-36`}
            value={filters.fromDate || ""}
            onChange={(e) => onChange("fromDate", e.target.value)}
          />
        </FilterField>

        {/* Arrow */}
        <div className="flex items-center h-9 text-gray-300 mt-4">
          <ChevronRight size={14} />
        </div>

        {/* To Date */}
        <FilterField label="To" icon={Calendar}>
          <input
            type="date"
            className={`${inputBase} w-36`}
            value={filters.toDate || ""}
            onChange={(e) => onChange("toDate", e.target.value)}
          />
        </FilterField>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto mt-4">
          {/* Reset */}
          <button
            onClick={onReset}
            className="
              flex items-center justify-center
              h-9 w-9 rounded-lg
              text-gray-500 bg-gray-50 border border-gray-200
              hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300
              active:scale-95 transition-all duration-150
            "
            title="Reset Filters"
          >
            <RotateCcw size={14} />
          </button>

          {/* Search */}
          <button
            onClick={onSearch}
            className="
              flex items-center gap-2 h-9 px-5
              bg-indigo-600 text-white text-sm font-semibold
              rounded-lg shadow-sm
              hover:bg-indigo-700
              active:scale-95 transition-all duration-150
            "
          >
            <Search size={14} />
            Search
          </button>
        </div>

        {/* Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shrink-0" />
        )}
      </div>
    </div>
  );
};

export default InvoiceFilters;