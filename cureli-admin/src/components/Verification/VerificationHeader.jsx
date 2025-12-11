// cureli-admin/src/components/Verification/VerificationHeader.jsx

import { Search, X, Download, FileSpreadsheet, ShieldCheck, Filter } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import StyledSelect from "../common/StyledSelect";
import StyledDateFilter from "../common/StyledDateFilter";

const VerificationHeader = ({
  search,
  setSearch,
  status,
  setStatus,
  resubmissionCount,
  setResubmissionCount,
  date,
  setDate,
  shops = [],
  totalItems = 0,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = !!status || !!resubmissionCount || !!date || !!search;

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setResubmissionCount("");
    setDate("");
  };

  // CSV generator
  const generateCSV = (data) => {
    if (!data || data.length === 0) return null;

    const headers = [
      "Shop ID",
      "Business Name",
      "Owner Name",
      "Owner Email",
      "Status",
      "Files Approved",
      "Files Rejected",
      "Resubmission Count",
      "Submitted Date",
    ];

    const rows = data.map((shop) => [
      shop.shop_id ?? "",
      shop.business_name ?? "",
      shop.owner_name ?? "",
      shop.owner_email ?? "",
      shop.verification_status ?? "",
      shop.files_approved ?? 0,
      shop.files_rejected ?? 0,
      shop.resubmission_count ?? 0,
      shop.created_at ? new Date(shop.created_at).toLocaleDateString() : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c ?? "")}"`).join(",")),
    ].join("\n");

    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  };

  const exportVisibleShops = () => {
    const blob = generateCSV(shops);
    if (!blob) return alert("No shops available to export.");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `verification_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportAllShops = () => {
    // For now, export visible. Implement backend endpoint for full export if needed.
    exportVisibleShops();
  };

  return (
    <div className="flex justify-between bg-white shadow-sm rounded-xl border border-gray-100 p-2">
      {/* Left Section - Filters */}
      <div className="flex items-end gap-3">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[250px]">
          <label className="text-xs text-gray-500 font-medium">Search</label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Shop name, owner, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 border border-gray-200 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         placeholder:text-gray-400 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded
                           text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <StyledSelect
          label="Status"
          value={status}
          onChange={setStatus}
          placeholder="All Status"
          options={[
            { value: "", label: "All Status" },
            { value: "pending_review", label: "Pending Review" },
            { value: "verified", label: "Verified" },
            { value: "partially_rejected", label: "Partially Rejected" },
            { value: "rejected", label: "Rejected" },
          ]}
        />

        {/* Resubmission Count Filter */}
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <label className="text-xs text-gray-500 font-medium">Min Resub</label>
          <div className="relative">
            <Filter
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="number"
              placeholder="0"
              value={resubmissionCount}
              onChange={(e) => setResubmissionCount(e.target.value)}
              min="0"
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         placeholder:text-gray-400 transition-all
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="min-w-[160px]">
          <StyledDateFilter
            label="Submitted After"
            date={date}
            setDate={setDate}
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-10 px-3 text-sm text-gray-500 hover:text-red-600 
                       hover:bg-red-50 rounded-lg
                       flex items-center gap-1.5 transition-colors self-end"
          >
            <X size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2 self-center">
        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="h-10 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium 
                       flex items-center gap-2 hover:bg-gray-200 transition-all"
          >
            <Download size={16} />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={exportVisibleShops}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 
                           flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-blue-600" />
                <div>
                  <div className="font-medium">Export Visible</div>
                  <div className="text-xs text-gray-400">
                    {shops.length} shops
                  </div>
                </div>
              </button>

              <div className="h-px bg-gray-100" />

              <button
                onClick={exportAllShops}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 
                           flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-green-600" />
                <div>
                  <div className="font-medium">Export All</div>
                  <div className="text-xs text-gray-400">
                    {totalItems} total shops
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Stats Badge */}
        <div className="h-10 px-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">
            {totalItems}
          </span>
          <span className="text-sm text-indigo-500">shops</span>
        </div>
      </div>
    </div>
  );
};

export default VerificationHeader;