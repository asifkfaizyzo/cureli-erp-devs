// frontend/src/pages/tickets/components/TicketFilters.jsx

import { Search, X, Calendar } from "lucide-react";
import StyledSelect from "../../../components/common/StyledSelect";
import { 
  TICKET_STATUS_OPTIONS, 
  TICKET_CATEGORY_OPTIONS 
} from "../../../constant/tickets";
import { useAuthStore } from "../../../store/useAuthStore";

const TicketFilters = ({
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  branchFilter,
  setBranchFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onClear,
}) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  const hasActiveFilters =
    searchText ||
    statusFilter ||
    categoryFilter ||
    (isSuperAdmin && branchFilter) ||
    dateFrom ||
    dateTo;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs text-gray-500 font-medium">Search</label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Ticket number or subject..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-10 pl-9 pr-8 border border-gray-200 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 
                         focus:border-indigo-500 transition-all"
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

        {/* Status Filter */}
        <div className="min-w-[150px]">
          <StyledSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Status"
            options={[
              { value: "", label: "All Status" },
              ...TICKET_STATUS_OPTIONS,
            ]}
          />
        </div>

        {/* Category Filter */}
        <div className="min-w-[180px]">
          <StyledSelect
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="All Categories"
            options={[
              { value: "", label: "All Categories" },
              ...TICKET_CATEGORY_OPTIONS,
            ]}
          />
        </div>

        {/* Date From */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <label className="text-xs text-gray-500 font-medium">From Date</label>
          <div className="relative">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 
                         focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <label className="text-xs text-gray-500 font-medium">To Date</label>
          <div className="relative">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 
                         focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="h-10 px-4 text-sm text-gray-500 hover:text-red-600 
                       hover:bg-red-50 rounded-lg border border-gray-200
                       flex items-center gap-2 transition-colors"
          >
            <X size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketFilters;
