import { Search, Calendar, Filter, Hash } from "lucide-react";

const VerificationHeader = ({
  search,
  setSearch,
  status,
  setStatus,
  count,
  setCount,
  date,
  setDate,
  onSearch
}) => {
  return (
    // 'flex-nowrap' prevents wrapping (expanding down)
    // 'min-w-0' allows the container to shrink below its content's intrinsic width if needed
    <div className="w-full mb-3 bg-white p-3 rounded-xl border border-gray-100 flex flex-nowrap items-center gap-2 shadow-sm min-w-0">

      {/* 
        Search Box: 
        'flex-1' makes it take up all available space. 
        'min-w-[120px]' ensures it doesn't disappear completely but shrinks significantly before breaking layout.
      */}
      <div className="relative flex-1 min-w-[120px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 placeholder:text-gray-400"
        />
      </div>

      {/* Status Dropdown - Fixed reasonable width */}
      <div className="relative shrink-0">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="pl-8 pr-8 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 appearance-none cursor-pointer"
        >
          <option value="">Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="partiallyRejected">Partially</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Count Input - Compact width */}
      <div className="relative shrink-0 w-[90px]">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          type="number"
          placeholder="Count"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="w-full pl-8 pr-2 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 placeholder:text-gray-400"
        />
      </div>

      {/* Date Input - Auto width based on browser date picker */}
      <div className="relative shrink-0">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="pl-3 pr-2 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 text-gray-500"
        />
      </div>

      {/* Search Button - Navy Blue */}
      <button
        onClick={onSearch}
        className="shrink-0 flex items-center gap-2 bg-[#05015A] hover:bg-[#0a0280] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <Search size={16} />
        <span className="hidden xl:inline">Search</span>
      </button>
    </div>
  );
};

export default VerificationHeader;