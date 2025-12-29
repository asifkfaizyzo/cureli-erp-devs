// cureli-admin/src/pages/Tickets/TicketsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { Search, X, Filter, Calendar, RefreshCw } from "lucide-react";
import { getAllTickets, getTicketStats } from "../../api/cadminTickets";
import TicketsHeader from "./components/TicketsHeader";
import TicketsTable from "./components/TicketsTable";
import TicketDetailsModal from "./components/TicketDetailsModal";
import StyledSelect from "../../components/common/StyledSelect";

const TicketsPage = () => {
  // Tickets data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState(null);

  // Search & Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filter options
  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Resolved", value: "RESOLVED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Closed", value: "CLOSED" },
  ];

  const categoryOptions = [
    { label: "All Categories", value: "" },
    { label: "Technical Issue", value: "TECHNICAL_ISSUE" },
    { label: "Billing Issue", value: "BILLING_ISSUE" },
    { label: "Feature Request", value: "FEATURE_REQUEST" },
    { label: "Account Issue", value: "ACCOUNT_ISSUE" },
    { label: "Other", value: "OTHER" },
  ];

  const activeFiltersCount = [
    statusFilter,
    categoryFilter,
    shopFilter,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const resp = await getTicketStats();
      setStats(resp.data?.data);
    } catch (err) {
      console.error("Failed to fetch ticket stats:", err);
    }
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        shop_name: shopFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort_by: sortConfig.sortBy,
        sort_order: sortConfig.order,
      };

      const resp = await getAllTickets(params);
      const data = resp.data?.data;

      setTickets(data?.tickets || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    searchText,
    statusFilter,
    categoryFilter,
    shopFilter,
    dateFrom,
    dateTo,
    sortConfig,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handlers
  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      order: prev.sortBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setCategoryFilter("");
    setShopFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsModalOpen(true);
  };

  const handleRefresh = () => {
    fetchStats();
    fetchTickets();
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6 bg-gray-50">
      {/* Header with Stats */}
      <TicketsHeader stats={stats} onRefresh={handleRefresh} />

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by ticket number, subject, or shop..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 
                         focus:border-indigo-500 transition-all"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                           text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 h-11 bg-indigo-600 text-white rounded-lg text-sm font-medium
                       hover:bg-indigo-700 transition-all shadow-sm"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 h-11 rounded-lg text-sm font-medium flex items-center gap-2
                       transition-all shadow-sm relative
                       ${
                         showFilters || activeFiltersCount > 0
                           ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200"
                           : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                       }`}
          >
            <Filter size={18} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white 
                               text-xs font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 h-11 bg-white text-gray-700 border border-gray-300 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </form>

        {/* Filter Options */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Status Filter */}
              <StyledSelect
                label="Status"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={statusOptions}
                placeholder="All Status"
              />

              {/* Category Filter */}
              <StyledSelect
                label="Category"
                value={categoryFilter}
                onChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
                options={categoryOptions}
                placeholder="All Categories"
              />

              {/* Shop Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">Shop</label>
                <input
                  type="text"
                  value={shopFilter}
                  onChange={(e) => {
                    setShopFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Shop name..."
                  className={`h-10 px-3 border rounded-lg text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all
                             ${
                               shopFilter
                                 ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                                 : "bg-white border-gray-200 text-gray-700"
                             }`}
                />
              </div>

              {/* Date From */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  max={dateTo || undefined}
                  className={`h-10 px-3 border rounded-lg text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all
                             ${
                               dateFrom
                                 ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                                 : "bg-white border-gray-200 text-gray-700"
                             }`}
                />
              </div>

              {/* Date To */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  min={dateFrom || undefined}
                  className={`h-10 px-3 border rounded-lg text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all
                             ${
                               dateTo
                                 ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                                 : "bg-white border-gray-200 text-gray-700"
                             }`}
                />
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-3 flex items-center justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 
                             hover:bg-red-50 rounded-lg transition-all flex items-center gap-2"
                >
                  <X size={16} />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <TicketsTable
          tickets={tickets}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onViewTicket={handleViewTicket}
        />
      </div>

      {/* Details Modal */}
      <TicketDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onRefresh={fetchTickets}
      />
    </div>
  );
};

export default TicketsPage;
