import { Search } from "lucide-react";

const UserHeader = ({
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  dateFilter,
  setDateFilter
}) => {
  return (
    <div
      className="
        bg-white shadow-md rounded-xl p-3
        flex flex-wrap items-center gap-4
        relative
      "
    >
      {/* LEFT SECTION */}
      <div className="flex flex-wrap items-center gap-4 pr-36">

        {/* Search Input */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 w-full sm:w-64 h-11">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search users"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
        </div>

        {/* Status Filter */}
        <select
          className="h-11 px-3 border border-gray-300 rounded-lg text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {/* Role Filter */}
        <select
          className="h-11 px-3 border border-gray-300 rounded-lg text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Roles</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Branch Admin">Branch Admin</option>
          <option value="Staff">Staff</option>
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-11 px-3 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* RIGHT SEARCH BUTTON */}
      <button
        className="
          h-11 px-6 bg-[#05015A] text-white rounded-lg
          flex items-center gap-2 text-sm hover:bg-[#02013D] transition
          absolute right-4 top-1/2 -translate-y-1/2
        "
      >
        <Search size={18} />
        Search
      </button>
    </div>
  );
};

export default UserHeader;
