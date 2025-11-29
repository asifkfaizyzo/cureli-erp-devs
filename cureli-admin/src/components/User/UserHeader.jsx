import { Search, Plus, X, Download, FileSpreadsheet } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import StyledSelect from "../common/StyledSelect";
import StyledDateFilter from "../common/StyledDateFilter";

const UserHeader = ({
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  dateFilter,
  setDateFilter,
  onAddUser,
  dummyUsers = [],
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

  const hasActiveFilters = statusFilter || roleFilter || dateFilter || searchText;

  const clearFilters = () => {
    setStatusFilter("");
    setRoleFilter("");
    setDateFilter("");
    setSearchText("");
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!dummyUsers || dummyUsers.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["ID", "Name", "Username", "Email", "Role", "Status", "Last Login"];
    const rows = dummyUsers.map((u) => [
      u.id,
      u.name,
      u.username,
      u.email,
      u.role,
      u.status,
      u.lastLogin,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  return (
    <div className="flex justify-between bg-white shadow-sm rounded-xl border border-gray-100 p-2">
      
      {/* Left Side: Filters */}
      <div className="flex items-end gap-3 ">
        
        {/* Search */}
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

        {/* Status */}
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

        {/* Role */}
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

        {/* Date */}
        <div className="min-w-[160px]">
          <StyledDateFilter
            label="Last Login"
            date={dateFilter}
            setDate={setDateFilter}
          />
        </div>

        {/* Clear */}
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

      {/* Right Side: Actions */}
      <div className="flex items-center gap-2 self-center">
        
        {/* Export Button */}
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
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-green-600" />
                <div>
                  <div className="font-medium">Export CSV</div>
                  <div className="text-xs text-gray-400">{dummyUsers.length} users</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Add User */}
        <button
          onClick={onAddUser}
          className="h-10 px-5 bg-[#05015A] text-white rounded-lg text-sm font-medium 
                     flex items-center gap-2 hover:bg-[#0a0280] active:scale-[0.98]
                     transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add User</span>
        </button>
      </div>
    </div>
  );
};

export default UserHeader;