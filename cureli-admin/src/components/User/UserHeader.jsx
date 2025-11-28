import { Search } from "lucide-react";

const UserHeader = () => {
  return (
    <div
      className="
        bg-white shadow-md rounded-xl p-3
        flex flex-wrap items-center gap-4
        relative   /* Needed for absolute positioning */
      "
    >
      {/* LEFT SECTION (Auto-wrap) */}
      <div className="flex flex-wrap items-center gap-4 pr-36">

        {/* Search Input */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 w-full sm:w-64 h-11">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search users"
            className="flex-1 outline-none text-sm"
          />
        </div>

        {/* Status Filter */}
        <select className="h-11 px-3 border border-gray-300 rounded-lg text-sm">
          <option>Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        {/* Role Filter */}
        <select className="h-11 px-3 border border-gray-300 rounded-lg text-sm">
          <option>Roles</option>
          <option>Super Admin</option>
          <option>Branch Admin</option>
          <option>Staff</option>
        </select>

        {/* Date */}
        <input
          type="date"
          className="h-11 px-3 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* RIGHT-FIXED SEARCH BUTTON */}
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
