// src/pages/inventory/components/InventoryFilters.jsx

import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  Search,
  Filter,
  X,
  Package,
  AlertTriangle,
  Clock,
  Plus,
  ChevronDown,
  SlidersHorizontal,
  RefreshCw,
  Building2,
  Tag,
  Truck,
  Calendar,
  CheckCircle2,
  Check,
} from "lucide-react";
import StyledSelect from "../../../components/common/StyledSelect";

// ════════════════════════════════════════════════════════════════════════════
// SEARCHABLE DROPDOWN COMPONENT (CSS FIX VERSION - NO PORTAL)
// ════════════════════════════════════════════════════════════════════════════

const SearchableDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  icon: Icon,
  emptyMessage = "No results found",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label?.toLowerCase().includes(query) ||
        opt.value?.toLowerCase().includes(query),
    );
  }, [options, search]);

  // Find selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Scroll selected into view
  useEffect(() => {
    if (isOpen && listRef.current && value) {
      const selectedEl = listRef.current.querySelector(
        `[data-value="${value}"]`,
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, value]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
      if (e.key === "Enter" && filteredOptions.length > 0) {
        e.preventDefault();
        const firstOption = filteredOptions[0];
        onChange(firstOption.value);
        setIsOpen(false);
        setSearch("");
      }
    },
    [filteredOptions, onChange],
  );

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  const hasValue = value && value !== "";

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ zIndex: isOpen ? 100 : 1 }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full h-10 flex items-center justify-between gap-2 px-3 rounded-lg border text-sm
          transition-all duration-200 text-left
          ${
            disabled
              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              : isOpen
                ? "bg-white border-indigo-400 ring-2 ring-indigo-100 shadow-sm"
                : hasValue
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:border-indigo-300"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
          }
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && (
            <Icon
              size={14}
              className={`shrink-0 ${hasValue ? "text-indigo-500" : "text-slate-400"}`}
            />
          )}
          <span
            className={`truncate ${hasValue ? "font-medium" : "text-slate-500"}`}
          >
            {selectedOption?.label || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
            >
              <X size={12} className="text-indigo-500" />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Panel - Absolute positioned */}
      {isOpen && (
        <div
          className="absolute z-[9999] top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl"
          style={{
            boxShadow:
              "0 10px 40px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
            minWidth: "100%",
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-8 pr-8 text-sm bg-white border border-slate-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                  placeholder:text-slate-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={12} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Search Stats */}
          {search && (
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Searching for "{search}"</span>
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                  {filteredOptions.length} found
                </span>
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto py-1 overscroll-contain"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isAllOption = option.value === "";

                return (
                  <button
                    key={option.value || `option-${idx}`}
                    type="button"
                    data-value={option.value}
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-3 py-2.5 flex items-center gap-3 text-left text-sm
                      transition-all duration-100
                      ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500"
                          : "hover:bg-slate-50 border-l-2 border-transparent"
                      }
                      ${isAllOption && !isSelected ? "text-slate-500 italic" : ""}
                    `}
                  >
                    <span
                      className={`flex-1 truncate ${isSelected ? "font-medium" : ""}`}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {emptyMessage}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try a different search term
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {options.length > 5 && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] text-slate-500 text-center">
                {options.length} total options • Type to search
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN INVENTORY FILTERS COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const InventoryFilters = ({
  filters,
  onChange,
  suppliers = [],
  categories = [],
  branches = [],
  showBranchFilter = false,
  onAddMedicine,
  onRefresh,
  isRefreshing = false,
  totalItems = 0,
}) => {
  const searchInputRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);

  // Build filter options
  const statusOptions = useMemo(
    () => [
      { value: "", label: "All Stock Status" },
      { value: "In Stock", label: "In Stock" },
      { value: "Low Stock", label: "Low Stock" },
      { value: "Out of Stock", label: "Out of Stock" },
      { value: "Expired", label: "Expired" },
      { value: "Expiring Soon", label: "Expiring Soon" },
    ],
    [],
  );

  const expiryOptions = useMemo(
    () => [
      { value: "", label: "All Expiry" },
      { value: "expired", label: "Expired" },
      { value: "30days", label: "Expiring in 30 days" },
      { value: "90days", label: "Expiring in 90 days" },
      { value: "valid", label: "Valid (Not Expiring)" },
    ],
    [],
  );

  const supplierOptions = useMemo(
    () => [
      { value: "", label: `All Suppliers (${suppliers.length})` },
      ...suppliers.map((s) => ({ value: s, label: s })),
    ],
    [suppliers],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "", label: `All Categories (${categories.length})` },
      ...categories.map((c) => ({ value: c, label: c })),
    ],
    [categories],
  );

  const branchOptions = useMemo(
    () => [
      { value: "", label: `All Branches (${branches.length})` },
      ...branches.map((b) => ({ value: b, label: b })),
    ],
    [branches],
  );

  // Calculate active filters
  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.search)
      active.push({
        key: "search",
        label: `"${filters.search}"`,
        value: filters.search,
      });
    if (filters.status)
      active.push({
        key: "status",
        label: filters.status,
        value: filters.status,
      });
    if (filters.expiry) {
      const expiryLabel =
        expiryOptions.find((o) => o.value === filters.expiry)?.label ||
        filters.expiry;
      active.push({ key: "expiry", label: expiryLabel, value: filters.expiry });
    }
    if (filters.supplier)
      active.push({
        key: "supplier",
        label: filters.supplier,
        value: filters.supplier,
      });
    if (filters.category)
      active.push({
        key: "category",
        label: filters.category,
        value: filters.category,
      });
    if (filters.branch)
      active.push({
        key: "branch",
        label: filters.branch,
        value: filters.branch,
      });
    if (filters.lowStock)
      active.push({ key: "lowStock", label: "Low Stock", value: true });
    if (filters.includeExpired)
      active.push({
        key: "includeExpired",
        label: "Include Expired",
        value: true,
      });
    return active;
  }, [filters, expiryOptions]);

  const hasActiveFilters = activeFilters.length > 0;
  const activeFilterCount = activeFilters.length;

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

  const removeFilter = (key) => {
    if (key === "lowStock" || key === "includeExpired") {
      onChange(key, false);
    } else {
      onChange(key, "");
    }
  };

  const clearSearch = () => {
    onChange("search", "");
    searchInputRef.current?.focus();
  };

  return (
    //  KEY FIX: Changed overflow-hidden to overflow-visible
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible">
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PRIMARY HEADER BAR */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left Section - Search */}
        <div className="flex-1 flex items-center gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-colors ${
                filters.search ? "text-indigo-500" : "text-slate-400"
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              className={`
                w-full h-10 sm:h-9 pl-10 pr-9 border rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                transition-all duration-200 placeholder:text-slate-400
                ${
                  filters.search
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
                }
              `}
              placeholder="Search medicine, batch, supplier..."
              value={filters.search}
              onChange={(e) => onChange("search", e.target.value)}
            />

            {filters.search && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-indigo-200 rounded-full transition-colors z-10"
              >
                <X size={14} className="text-indigo-500" />
              </button>
            )}
          </div>

          {/* Toggle Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              h-10 sm:h-9 px-3 flex items-center gap-2 rounded-lg border transition-all duration-200
              shrink-0 text-sm font-medium
              ${
                showFilters
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : hasActiveFilters
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }
            `}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`hidden sm:block transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Results Badge */}
          {totalItems > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
              <Package size={12} />
              <span>{totalItems.toLocaleString()} items</span>
            </div>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-10 sm:h-9 w-10 sm:w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>
          )}

          {/* Add Medicine Button */}
          {onAddMedicine && (
            <button
              onClick={null}
              // onClick={onAddMedicine}
              className="h-10 sm:h-9 px-3 sm:px-4 flex items-center gap-2 text-sm font-semibold text-white bg-[#05015A] hover:bg-[#0a0280] rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Upload Inventory</span>
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* EXPANDABLE FILTERS SECTION - overflow-visible when open */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${showFilters ? "opacity-100 overflow-visible" : "max-h-0 opacity-0 overflow-hidden"}
        `}
        style={{
          maxHeight: showFilters ? "500px" : "0px",
        }}
      >
        <div className="px-3 sm:px-4 py-4 border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white overflow-visible">
          {/* Filter Grid - overflow-visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 overflow-visible">
            {/* Stock Status */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                <Package size={11} />
                Stock Status
              </label>
              <StyledSelect
                value={filters.status}
                onChange={(val) => onChange("status", val)}
                options={statusOptions}
                placeholder="All Status"
              />
            </div>

            {/* Expiry Status */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                <Calendar size={11} />
                Expiry Status
              </label>
              <StyledSelect
                value={filters.expiry}
                onChange={(val) => onChange("expiry", val)}
                options={expiryOptions}
                placeholder="All Expiry"
              />
            </div>

            {/* SEARCHABLE Supplier Filter */}
            {suppliers.length > 0 && (
              <div className="space-y-1.5 overflow-visible">
                <label className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                  <Truck size={11} />
                  Supplier
                </label>
                <SearchableDropdown
                  value={filters.supplier}
                  onChange={(val) => onChange("supplier", val)}
                  options={supplierOptions}
                  placeholder="All Suppliers"
                  searchPlaceholder="Search suppliers..."
                  icon={Truck}
                  emptyMessage="No suppliers found"
                />
              </div>
            )}

            {/* SEARCHABLE Category Filter */}
            {categories.length > 0 && (
              <div className="space-y-1.5 overflow-visible">
                <label className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                  <Tag size={11} />
                  Category
                </label>
                <SearchableDropdown
                  value={filters.category}
                  onChange={(val) => onChange("category", val)}
                  options={categoryOptions}
                  placeholder="All Categories"
                  searchPlaceholder="Search categories..."
                  icon={Tag}
                  emptyMessage="No categories found"
                />
              </div>
            )}

            {/* Branch Filter */}
            {showBranchFilter && branches.length > 0 && (
              <div className="space-y-1.5 overflow-visible">
                <label className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                  <Building2 size={11} />
                  Branch
                </label>
                <SearchableDropdown
                  value={filters.branch}
                  onChange={(val) => onChange("branch", val)}
                  options={branchOptions}
                  placeholder="All Branches"
                  searchPlaceholder="Search branches..."
                  icon={Building2}
                  emptyMessage="No branches found"
                />
              </div>
            )}
          </div>

          {/* Quick Toggles */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wide shrink-0">
              <Filter size={11} />
              Quick Filters
            </span>

            <div className="flex flex-wrap items-center gap-4">
              {/* Low Stock Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.lowStock || false}
                    onChange={(e) => onChange("lowStock", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className={`
                    w-9 h-5 rounded-full transition-all duration-200
                    ${
                      filters.lowStock
                        ? "bg-amber-500"
                        : "bg-slate-200 group-hover:bg-slate-300"
                    }
                  `}
                  />
                  <div
                    className={`
                    absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200
                    ${filters.lowStock ? "translate-x-4" : "translate-x-0"}
                  `}
                  />
                </div>
                <span
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filters.lowStock
                      ? "text-amber-600"
                      : "text-slate-600 group-hover:text-amber-600"
                  }`}
                >
                  <AlertTriangle size={14} />
                  Low Stock Only
                </span>
              </label>

              {/* Include Expired Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.includeExpired || false}
                    onChange={(e) =>
                      onChange("includeExpired", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div
                    className={`
                    w-9 h-5 rounded-full transition-all duration-200
                    ${
                      filters.includeExpired
                        ? "bg-red-500"
                        : "bg-slate-200 group-hover:bg-slate-300"
                    }
                  `}
                  />
                  <div
                    className={`
                    absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200
                    ${filters.includeExpired ? "translate-x-4" : "translate-x-0"}
                  `}
                  />
                </div>
                <span
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filters.includeExpired
                      ? "text-red-600"
                      : "text-slate-600 group-hover:text-red-600"
                  }`}
                >
                  <Clock size={14} />
                  Include Expired
                </span>
              </label>
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200"
              >
                <X size={14} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ACTIVE FILTERS CHIPS (Always visible when filters active) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {hasActiveFilters && !showFilters && (
        <div className="px-3 sm:px-4 py-2.5 border-t border-slate-100 bg-gradient-to-r from-indigo-50/50 to-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide shrink-0 flex items-center gap-1">
              <CheckCircle2 size={10} />
              Active:
            </span>

            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium group"
              >
                <span className="max-w-[120px] truncate">{filter.label}</span>
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </span>
            ))}

            <button
              onClick={clearFilters}
              className="ml-auto text-[11px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1 hover:underline"
            >
              <X size={10} />
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE ACTIVE FILTER COUNT (When collapsed and has filters) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {hasActiveFilters && showFilters && (
        <div className="sm:hidden px-3 py-2 border-t border-slate-100 bg-indigo-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-600 font-medium">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
              active
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <X size={12} />
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryFilters;
