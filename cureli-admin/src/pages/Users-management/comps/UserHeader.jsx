import { Search, Plus, X, Download, FileSpreadsheet } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import StyledSelect from "../../../components/common/StyledSelect";
import StyledDateFilter from "../../../components/common/StyledDateFilter";

const UserHeader = ({
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  dateFilter,
  setDateFilter,
  users = [],
  totalItems = 0,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters =
    !!statusFilter || !!roleFilter || !!dateFilter || !!searchText;

  const clearFilters = () => {
    setStatusFilter("");
    setRoleFilter("");
    setDateFilter("");
    setSearchText("");
  };

  // CSV generator uses server list (users) passed by parent
  const generateCSV = (data) => {
    if (!data || data.length === 0) return null;

    const headers = [
      "ID",
      "Name",
      "Username",
      "Email",
      "Role",
      "Status",
      "Last Login",
    ];

    const rows = data.map((u) => [
      u.id ?? "",
      u.name ?? "",
      u.username ?? "",
      u.email ?? "",
      u.role ?? "",
      u.is_active ? "Active" : "Inactive",
      u.lastLogin ?? "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c ?? "")}"`).join(",")),
    ].join("\n");

    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  };

  const exportFilteredUsers = () => {
    // Parent already fetched filtered users (current page). If you require "all filtered across pages",
    // implement an export backend endpoint. For now we export current users array.
    const blob = generateCSV(users);
    if (!blob) return alert("No users available to export.");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportAllUsers = () => {
    // Same as above; export currently loaded users. Use backend export for larger datasets.
    exportFilteredUsers();
  };

  return (
    <div className="flex justify-between bg-white shadow-sm rounded-xl border border-gray-100 p-2">
      <div className="flex items-end gap-3 ">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[230px]">
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
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                       placeholder:text-gray-400 transition-all"
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

        <StyledSelect
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="All Roles"
          options={[
            { value: "", label: "All Roles" },
            { value: "Super Admin", label: "Super Admin" },
            { value: "Branch Admin", label: "Branch Admin" },
            { value: "Staff", label: "Staff" },
          ]}
        />

        <div className="min-w-[160px]">
          <StyledDateFilter
            label="Last Login"
            date={dateFilter}
            setDate={setDateFilter}
          />
        </div>

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
      </div>

      <div className="flex items-center gap-2 self-center">
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="h-10 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium 
                       flex items-center gap-2 hover:bg-gray-200 transition-all"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={exportFilteredUsers}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 
                           flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-blue-600" />
                <div>
                  <div className="font-medium">Export Visible</div>
                  <div className="text-xs text-gray-400">
                    {users.length} users
                  </div>
                </div>
              </button>

              <div className="h-px bg-gray-100" />

              <button
                onClick={exportAllUsers}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 
                           flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-green-600" />
                <div>
                  <div className="font-medium">Export All (Visible)</div>
                  <div className="text-xs text-gray-400">
                    {totalItems} total
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHeader;
