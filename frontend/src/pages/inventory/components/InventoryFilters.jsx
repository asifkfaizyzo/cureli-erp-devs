// src/pages/inventory/components/InventoryFilters.jsx

import React, { useRef, useMemo } from "react";
import { Search, Filter, X, Package, AlertTriangle, Clock } from "lucide-react";
import StyledSelect from "../../../components/common/StyledSelect";

const InventoryFilters = ({ 
  filters, 
  onChange, 
  suppliers = [], 
  categories = [],
  branches = [],
  showBranchFilter = false,
}) => {
  const searchInputRef = useRef(null);

  // Build filter options
  const statusOptions = useMemo(() => [
    { value: "", label: "All Stock Status" },
    { value: "In Stock", label: "In Stock" },
    { value: "Low Stock", label: "Low Stock" },
    { value: "Out of Stock", label: "Out of Stock" },
    { value: "Expired", label: "Expired" },
    { value: "Expiring Soon", label: "Expiring Soon" },
  ], []);

  const expiryOptions = useMemo(() => [
    { value: "", label: "All Expiry" },
    { value: "expired", label: "Expired" },
    { value: "30days", label: "Expiring in 30 days" },
    { value: "90days", label: "Expiring in 90 days" },
    { value: "valid", label: "Valid (Not Expiring)" },
  ], []);

  const supplierOptions = useMemo(() => [
    { value: "", label: `All Suppliers${suppliers.length > 0 ? ` (${suppliers.length})` : ''}` },
    ...suppliers.map(s => ({ value: s, label: s }))
  ], [suppliers]);

  const categoryOptions = useMemo(() => [
    { value: "", label: `All Categories${categories.length > 0 ? ` (${categories.length})` : ''}` },
    ...categories.map(c => ({ value: c, label: c }))
  ], [categories]);

  const branchOptions = useMemo(() => [
    { value: "", label: `All Branches${branches.length > 0 ? ` (${branches.length})` : ''}` },
    ...branches.map(b => ({ value: b, label: b }))
  ], [branches]);

  // Calculate active filters
  const hasActiveFilters = Boolean(
    filters.search || 
    filters.status || 
    filters.expiry || 
    filters.supplier || 
    filters.category || 
    filters.branch ||
    filters.lowStock || 
    filters.includeExpired
  );

  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.expiry,
    filters.supplier,
    filters.category,
    filters.branch,
    filters.lowStock,
    filters.includeExpired,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onChange("search", "");
    onChange("status", "");
    onChange("expiry", "");
    onChange("supplier", "");
    onChange("category", "");
    onChange("branch", "");
    onChange("lowStock", false);
    onChange("includeExpired", false);
  };

  const clearSearch = () => {
    onChange("search", "");
    searchInputRef.current?.focus();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Main Filter Bar */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search 
            size={14} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" 
          />
          <input
            ref={searchInputRef}
            type="text"
            className={`
              w-full h-10 pl-9 pr-8 border rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
              transition-all duration-200
              ${filters.search 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }
            `}
            placeholder="Search name, batch, manufacturer, supplier..."
            value={filters.search}
            onChange={(e) => onChange("search", e.target.value)}
          />
          
          {filters.search && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-indigo-200 rounded-full transition-colors z-10"
            >
              <X size={12} className="text-indigo-500" />
            </button>
          )}
        </div>

        {/* Stock Status Filter */}
        <div className="w-[160px]">
          <StyledSelect
            value={filters.status}
            onChange={(val) => onChange("status", val)}
            options={statusOptions}
            placeholder="Stock Status"
          />
        </div>

        {/* Expiry Filter */}
        <div className="w-[170px]">
          <StyledSelect
            value={filters.expiry}
            onChange={(val) => onChange("expiry", val)}
            options={expiryOptions}
            placeholder="Expiry Status"
          />
        </div>

        {/* Supplier Filter - Only show if suppliers exist */}
        {suppliers.length > 0 && (
          <div className="w-[160px]">
            <StyledSelect
              value={filters.supplier}
              onChange={(val) => onChange("supplier", val)}
              options={supplierOptions}
              placeholder="Supplier"
            />
          </div>
        )}

        {/* Category Filter - Only show if categories exist */}
        {categories.length > 0 && (
          <div className="w-[150px]">
            <StyledSelect
              value={filters.category}
              onChange={(val) => onChange("category", val)}
              options={categoryOptions}
              placeholder="Category"
            />
          </div>
        )}

        {/* Branch Filter - Only show in global mode */}
        {showBranchFilter && branches.length > 0 && (
          <div className="w-[150px]">
            <StyledSelect
              value={filters.branch}
              onChange={(val) => onChange("branch", val)}
              options={branchOptions}
              placeholder="Branch"
            />
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-10 px-3 flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-slate-200 hover:border-red-200"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        )}
      </div>

      {/* Quick Filters Row */}
      <div className="px-4 py-2 flex items-center gap-4 bg-slate-50 rounded-b-lg border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-slate-500" />
          <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
            Quick Filters:
          </span>
        </div>

        {/* Low Stock Toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.lowStock || false}
            onChange={(e) => onChange("lowStock", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className={`text-xs transition-colors flex items-center gap-1 ${
            filters.lowStock ? 'text-yellow-600 font-medium' : 'text-slate-600 group-hover:text-yellow-600'
          }`}>
            <AlertTriangle size={12} />
            Low Stock Only
          </span>
        </label>

        {/* Include Expired Toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.includeExpired || false}
            onChange={(e) => onChange("includeExpired", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className={`text-xs transition-colors flex items-center gap-1 ${
            filters.includeExpired ? 'text-red-600 font-medium' : 'text-slate-600 group-hover:text-red-600'
          }`}>
            <Clock size={12} />
            Include Expired
          </span>
        </label>

        {/* Active Filters Badge */}
        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              <Package size={10} />
              <span className="text-[10px] font-semibold">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;