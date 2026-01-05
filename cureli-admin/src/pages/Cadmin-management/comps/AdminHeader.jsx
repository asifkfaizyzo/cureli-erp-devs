import { Search, Plus, X, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import StyledSelect from "../../../components/common/StyledSelect";

const AdminHeader = ({
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  admins = [],
  totalItems = 0,
  onAddAdmin,
  loading = false,
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

  const hasActiveFilters = !!searchText || !!statusFilter || !!roleFilter;

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setRoleFilter("");
  };

  // CSV EXPORT
  const generateCSV = (data) => {
    if (!data || data.length === 0) return null;

    const headers = [
      "ID",
      "Name",
      "Username",
      "Phone",
      "Email",
      "Role",
      "Status",
      "Last Login",
      "Created At",
    ];

    const rows = data.map((a) => [
      a.id ?? "",
      a.name ?? "",
      a.username ?? "",
      a.phone ?? "",
      a.email ?? "",
      a.role ?? "",
      a.status ?? "",
      a.lastLogin ?? "",
      a.createdAt ?? "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  };

  const exportVisibleAdmins = () => {
    const blob = generateCSV(admins);
    if (!blob) return alert("No admins available to export.");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `admins_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  return (
    <div className="flex justify-between bg-white shadow-sm rounded-xl border border-gray-100 p-2">
      {/* LEFT — FILTERS */}
      <div className="flex items-end gap-3">
        {/* SEARCH */}
        <div className="flex flex-col gap-1.5 min-w-[230px]">
          <label className="text-xs text-gray-500 font-medium">Search</label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Name, username or email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-10 pl-9 pr-8 border border-gray-200 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                         focus:border-indigo-500 placeholder:text-gray-400 transition-all"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded
                           text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* STATUS FILTER */}
        <StyledSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={[
            { value: "", label: "All Status" },
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ]}
        />

        {/* ROLE FILTER (NEW) */}
        <StyledSelect
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="All Roles"
          options={[
            { value: "", label: "All Roles" },
            { value: "Super Admin", label: "Super Admin" },
            { value: "Analyst", label: "Analyst" },
            { value: "Accounting", label: "Accounting" },
          ]}
        />

        {/* CLEAR FILTERS */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-10 px-3 text-sm text-gray-500 hover:text-red-600 
                       hover:bg-red-50 rounded-lg
                       flex items-center gap-1.5 transition-colors"
          >
            <X size={14} />
            <span>Clear</span>
          </button>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="h-10 flex items-center px-2">
            <Loader2 size={16} className="text-indigo-600 animate-spin" />
          </div>
        )}
      </div>

      {/* RIGHT — ACTIONS */}
      <div className="flex items-center gap-2 self-center">
        {/* TOTAL COUNT */}
        <span className="text-sm text-gray-500 mr-2">
          {loading ? "..." : `${totalItems} admin${totalItems !== 1 ? "s" : ""}`}
        </span>

        {/* EXPORT */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={loading || admins.length === 0}
            className="h-10 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium 
                       flex items-center gap-2 hover:bg-gray-200 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-56 bg-white 
                            border border-gray-200 rounded-xl shadow-xl 
                            z-50 overflow-hidden"
            >
              <button
                onClick={exportVisibleAdmins}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 
                           hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-blue-600" />
                <div>
                  <div className="font-medium">Export Visible</div>
                  <div className="text-xs text-gray-400">{admins.length} admins</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* ADD ADMIN */}
        <button
          onClick={onAddAdmin}
          className="h-10 px-4 bg-[#05015A] text-white rounded-lg text-sm font-medium 
                     flex items-center gap-2 hover:bg-[#06027a] transition-all"
        >
          <Plus size={16} />
          <span>Add Admin</span>
        </button>
      </div>
    </div>
  );
};

export default AdminHeader;