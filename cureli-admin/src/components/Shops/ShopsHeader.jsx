import { Search, X, Download, FileSpreadsheet, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ShopsHeader = ({
  search,
  setSearch,
  shops = [],
  totalItems = 0,
  onAddShop,
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

  // CSV generation (Same format system used in UserHeader)
  const generateCSV = (data) => {
    if (!data || data.length === 0) return null;

    const headers = [
      "Business Name",
      "Owner Name",
      "Business Type",
      "Plan",
      "Status",
      "Pincode",
    ];

    const rows = data.map((shop) => [
      shop.businessName ?? "",
      shop.ownerName ?? "",
      shop.businessType ?? "",
      shop.plan ?? "",
      shop.subscriptionStatus ?? "",
      shop.location?.pin ?? "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((c) => `"${String(c)}"`).join(",")),
    ].join("\n");

    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  };

  const exportVisible = () => {
    const blob = generateCSV(shops);
    if (!blob) return alert("No shops available to export.");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `shops_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  return (
    <div className="flex justify-between bg-white shadow-sm rounded-xl border border-gray-100 p-3">

      {/* Search */}
      <div className="flex flex-col gap-1.5 flex-1 max-w-[320px]">
        <label className="text-xs text-gray-500 font-medium">Search</label>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Business or owner name..."
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

      {/* Right Actions */}
      <div className="flex items-end gap-2">

        {/* Export Menu */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="h-10 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium 
                       flex items-center gap-2 hover:bg-gray-200 transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={exportVisible}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 
                           flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-blue-600" />
                <div>
                  <div className="font-medium">Export Visible</div>
                  <div className="text-xs text-gray-400">{shops.length} shops</div>
                </div>
              </button>

              <div className="h-px bg-gray-100" />
            </div>
          )}
        </div>

        {/* Add Shop Button */}
        <button
          onClick={onAddShop}
          className="h-10 px-5 bg-[#05015A] text-white rounded-lg text-sm font-medium 
                     flex items-center gap-2 hover:bg-[#0a0280] active:scale-[0.98]
                     transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Shop
        </button>
      </div>
    </div>
  );
};

export default ShopsHeader;
