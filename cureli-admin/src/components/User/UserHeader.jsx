import { Search, Plus, X } from "lucide-react";
import StyledSelect from "../common/StyledSelect"; // Adjust path if needed

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
}) => {
  // Check if any filter is active
  const hasActiveFilters =
    statusFilter || roleFilter || dateFilter || searchText;

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("");
    setRoleFilter("");
    setDateFilter("");
    setSearchText("");
  };

  return (
    <div className="flex justify-between bg-white shadow-sm rounded-xl border border-gray-100 p-2">
      {/* Main Flex Container */}
      <div className="flex flex-wrap items-end gap-6">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[230px] ">
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

        {/* 2. Status Filter (Using StyledSelect) */}
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

        {/* 3. Role Filter (Using StyledSelect) */}
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

        {/* 4. Date Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-medium">
            Last Login
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`h-10 px-3 border rounded-lg text-sm cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                       transition-all
                       ${
                         dateFilter
                           ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                           : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                       }`}
          />
        </div>

        {/* 5. Clear Filters Button */}
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

        {/* Spacer pushes "Add User" to the right */}
        <div className="flex-1" />
      </div>
      {/* 6. Add User Button */}
      <button
        onClick={onAddUser}
        className="h-10 px-5 bg-[#05015A] text-white rounded-lg text-sm font-medium 
                     flex items-center gap-2 hover:bg-[#0a0280] active:scale-[0.98]
                     transition-all shadow-sm hover:shadow-md self-center"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Add User</span>
      </button>
    </div>
  );
};

export default UserHeader;
