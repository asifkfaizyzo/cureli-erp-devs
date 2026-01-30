// src/pages/inventory/components/InventoryFilters.jsx
import React, { useRef } from "react";
import { Search, Filter, X } from "lucide-react";

const InventoryFilters = ({ filters, onChange, suppliers = [], categories = [] }) => {
  const searchInputRef = useRef(null);

  const hasActiveFilters = filters.search || filters.status || filters.expiry || filters.supplier || filters.category || filters.lowStock || filters.includeExpired;

  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.expiry,
    filters.supplier,
    filters.category,
    filters.lowStock,
    filters.includeExpired,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onChange("search", "");
    onChange("status", "");
    onChange("expiry", "");
    onChange("supplier", "");
    onChange("category", "");
    onChange("lowStock", false);
    onChange("includeExpired", false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Main Filter Bar */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-slate-100">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full h-9 pl-9 pr-8 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Search name & manufacturer..."
            value={filters.search}
            onChange={(e) => onChange("search", e.target.value)}
          />
          
          {filters.search && (
            <button
              onClick={() => {
                onChange("search", "");
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={12} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Stock Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onChange("status", e.target.value)}
          className="h-9 px-3 pr-8 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white cursor-pointer"
        >
          <option value="">All Stock Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        {/* Expiry Filter */}
        <select
          value={filters.expiry}
          onChange={(e) => onChange("expiry", e.target.value)}
          className="h-9 px-3 pr-8 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white cursor-pointer"
        >
          <option value="">All Expiry</option>
          <option value="expired">Expired</option>
          <option value="30days">Expiring in 30 days</option>
          <option value="90days">Expiring in 90 days</option>
        </select>

        {/* Supplier Filter - Only show if suppliers exist */}
        {suppliers.length > 0 && (
          <select
            value={filters.supplier}
            onChange={(e) => onChange("supplier", e.target.value)}
            className="h-9 px-3 pr-8 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white cursor-pointer max-w-[150px] truncate"
          >
            <option value="">All Suppliers ({suppliers.length})</option>
            {suppliers.map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>
        )}

        {/* Category Filter - Only show if categories exist */}
        {categories.length > 0 && (
          <select
            value={filters.category}
            onChange={(e) => onChange("category", e.target.value)}
            className="h-9 px-3 pr-8 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white cursor-pointer max-w-[140px] truncate"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-9 px-3 flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters Row */}
      <div className="px-4 py-2 flex items-center gap-4 bg-slate-50 rounded-b-lg">
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-slate-500" />
          <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Quick Filters:</span>
        </div>

        {/* Low Stock Toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.lowStock}
            onChange={(e) => onChange("lowStock", e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs text-slate-600 group-hover:text-yellow-600 transition-colors">
            Low Stock Only
          </span>
        </label>

        {/* Include Expired Toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.includeExpired}
            onChange={(e) => onChange("includeExpired", e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs text-slate-600 group-hover:text-red-600 transition-colors">
            Include Expired
          </span>
        </label>

        {/* Right side info */}
        <div className="ml-auto flex items-center gap-2">
          {/* Active Filters Count */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              <span className="text-[10px] font-semibold">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
            </div>
          )}

          {/* Search Tip */}
          {!filters.search && (
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px]">
    
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;
