import { Search } from "lucide-react";

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
    <div className="w-full bg-white p-4 rounded-xl flex flex-wrap gap-3 items-center shadow-md">

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search users"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 min-w-[180px] px-4 py-2 rounded-lg border focus:outline-none"
      />

      {/* Status Dropdown */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-4 py-2 rounded-lg border min-w-[120px]"
      >
        <option value="">Status</option>
        <option value="approved">Approved</option>
        <option value="pending">Pending</option>
        <option value="partiallyRejected">Partially Rejected</option>
        <option value="rejected">Rejected</option>
      </select>

      {/* Count */}
      <input
        type="number"
        placeholder="Count"
        value={count}
        onChange={(e) => setCount(e.target.value)}
        className="px-4 py-2 rounded-lg border min-w-[120px]"
      />

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="px-4 py-2 rounded-lg border min-w-[150px]"
      />

      {/* Search Button */}
      <button
        onClick={onSearch}
        className="flex items-center gap-2 bg-[#05015A] text-white px-5 py-2 rounded-lg"
      >
        <Search size={18} />
        Search
      </button>
    </div>
  );
};

export default VerificationHeader;
