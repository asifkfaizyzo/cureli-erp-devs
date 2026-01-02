// cureli-admin/src/pages/Tickets/TicketsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { Search, X, Filter, Calendar, RefreshCw, Ticket } from "lucide-react";
import { getAllTickets, getTicketById } from "../../api/cadminTickets";
import TicketsTable from "./components/TicketsTable";
import TicketDetailsModal from "./components/TicketDetailsModal";
import Pagination from "../../components/common/Pagination";
import StyledSelect from "../../components/common/StyledSelect";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";
import toast from "react-hot-toast";

const TicketsPage = () => {
  // Data state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination meta from server
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Sort
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = useDynamicRowCount();

  // Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);

  // Filter options
  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Resolved", value: "RESOLVED" },
    { label: "Closed", value: "CLOSED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const categoryOptions = [
    { label: "All Categories", value: "" },
    { label: "Technical Issue", value: "TECHNICAL_ISSUE" },
    { label: "Billing Issue", value: "BILLING_ISSUE" },
    { label: "Feature Request", value: "FEATURE_REQUEST" },
    { label: "Account Issue", value: "ACCOUNT_ISSUE" },
    { label: "Other", value: "OTHER" },
  ];

  const activeFiltersCount = [statusFilter, categoryFilter, dateFrom, dateTo].filter(Boolean).length;

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        sort_by: sortConfig.sortBy,
        sort_order: sortConfig.order,
      };

      if (searchText.trim()) params.search = searchText.trim();
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await getAllTickets(params);
      const { tickets: data, pagination } = response.data.data;

      setTickets(data);
      setTotalItems(pagination.total);
      setTotalPages(pagination.totalPages);

      if (currentPage > pagination.totalPages && pagination.totalPages > 0) {
        setCurrentPage(pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError(err.response?.data?.message || "Failed to fetch tickets");
      toast.error("Failed to load tickets");
      setTickets([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchText, statusFilter, categoryFilter, dateFrom, dateTo, sortConfig]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, categoryFilter, dateFrom, dateTo, sortConfig]);

  // Handlers
  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      order: prev.sortBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTickets();
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleViewTicket = async (ticket) => {
    setLoadingTicketDetails(true);
    setIsDetailsModalOpen(true);
    
    try {
      const response = await getTicketById(ticket.ticket_id);
      setSelectedTicket(response.data.data.ticket);
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
      toast.error("Failed to load ticket details");
      setSelectedTicket(ticket);
    } finally {
      setLoadingTicketDetails(false);
    }
  };

  const handleRefresh = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCloseModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedTicket(null);
  }, []);

  const startIndex = (currentPage - 1) * rowsPerPage;

  return (
    // ✅ FIXED: Match UserPage structure exactly
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header - No horizontal padding, let content flow */}
      <div className="flex-shrink-0 flex flex-col gap-3 px-4 pt-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center flex-shrink-0">
              <Ticket size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">Support Tickets</h1>
              <p className="text-sm text-gray-500">
                {totalItems} total ticket{totalItems !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
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
              className="px-4 sm:px-6 h-10 sm:h-11 bg-[#05015A] text-white rounded-lg text-sm font-medium
                         hover:bg-[#0a0280] transition-all shadow-sm flex-shrink-0"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm font-medium flex items-center gap-2
                         transition-all shadow-sm relative flex-shrink-0
                         ${
                           showFilters || activeFiltersCount > 0
                             ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200"
                             : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                         }`}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white 
                                 text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </form>

          {/* Filter Options - ✅ FIXED: Better responsive grid */}
          {showFilters && (
            <div className="pt-3 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={handleRefresh}
              className="text-red-700 hover:text-red-900 font-medium underline text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ✅ FIXED: Table container matches UserPage structure */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden px-4 pb-4">
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
        onClose={handleCloseModal}
        ticket={selectedTicket}
        loading={loadingTicketDetails}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default TicketsPage;