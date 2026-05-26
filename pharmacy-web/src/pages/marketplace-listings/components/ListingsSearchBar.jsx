// src/pages/marketplace-listings/components/ListingsSearchBar.jsx

import { Search, SlidersHorizontal, X } from "lucide-react";
import DarkSelect from "./DarkSelect";

const ListingsSearchBar = ({
  searchQuery,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterVisibility,
  onVisibilityChange,
  filterStock,
  onStockChange,
  sortBy,
  onSortChange,
  categories,
  resultCount,
}) => {
  const hasActiveFilters =
    filterCategory !== "all" ||
    filterVisibility !== "all" ||
    filterStock !== "all" ||
    searchQuery.trim() !== "";

  const clearAll = () => {
    onSearchChange("");
    onCategoryChange("all");
    onVisibilityChange("all");
    onStockChange("all");
  };

  return (
    <div className="flex items-center gap-3 px-1">
      {/* ── Search Input ── */}
      <div className="relative flex-1 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search medicines, brand, manufacturer..."
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
        />
      </div>

      {/* ── Filter Dropdowns ── */}
      <div className="flex items-center gap-2">
        <DarkSelect
          value={filterCategory}
          onChange={onCategoryChange}
          options={[
            { value: "all", label: "All Categories" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          placeholder="Category"
        />

        <SegmentedFilter
          value={filterVisibility}
          onChange={onVisibilityChange}
          options={[
            { value: "all", label: "All" },
            { value: "visible", label: "Visible" },
            { value: "hidden", label: "Hidden" },
          ]}
        />

        <SegmentedFilter
          value={filterStock}
          onChange={onStockChange}
          options={[
            { value: "all", label: "Any Stock" },
            { value: "in_stock", label: "In Stock" },
            { value: "out_of_stock", label: "Out of Stock" },
          ]}
        />

        <DarkSelect
          value={sortBy}
          onChange={onSortChange}
          options={[
            { value: "name_asc", label: "Name A–Z" },
            { value: "name_desc", label: "Name Z–A" },
            { value: "price_asc", label: "Price ↑" },
            { value: "price_desc", label: "Price ↓" },
            { value: "stock_asc", label: "Stock ↑" },
          ]}
          placeholder="Sort by"
          prefix="Sort: "
        />
      </div>

      {/* ── Result count + Clear ── */}
      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        <span className="text-[11px] text-white/25 font-medium tabular-nums">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-all"
          >
            <X size={11} />
            Clear filters
          </button>
        )}
        <div className="flex items-center gap-1 text-white/20">
          <SlidersHorizontal size={13} />
        </div>
      </div>
    </div>
  );
};

// ─── Segmented Filter ─────────────────────────────────────────────────────────

const SegmentedFilter = ({ value, onChange, options }) => (
  <div className="flex items-center h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] overflow-hidden">
    {options.map((opt, i) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-3 h-full text-xs font-medium transition-all whitespace-nowrap ${
          i > 0 ? "border-l border-white/[0.07]" : ""
        } ${
          value === opt.value
            ? "bg-white/[0.1] text-white"
            : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default ListingsSearchBar;