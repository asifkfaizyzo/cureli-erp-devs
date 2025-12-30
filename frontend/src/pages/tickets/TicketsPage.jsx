// frontend/src/pages/tickets/TicketsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, X, Filter, Calendar } from "lucide-react";
import { getTickets, reopenTicket } from "../../api/tickets";
import TicketListTable from "./components/TicketListTable";
import CreateTicketModal from "./components/CreateTicketModal";
import ViewTicketModal from "./components/ViewTicketModal";
import CancelTicketModal from "./components/CancelTicketModal";
import StyledSelect from "../../components/common/StyledSelect";
import toast from "react-hot-toast";
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
} from "../../constant/tickets";
import { format } from "date-fns";

const TicketsPage = () => {
  // Tickets data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Search & Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Status options for filter
  const statusOptions = [
    { label: "All Status", value: "" },
    ...Object.entries(TICKET_STATUSES).map(([key, label]) => ({
      label,
      value: key,
    })),
  ];

  // Category options for filter
  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...Object.entries(TICKET_CATEGORIES).map(([key, label]) => ({
      label,
      value: key,
    })),
  ];

  // Count active filters
  const activeFiltersCount = [
    statusFilter,
    categoryFilter,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  // Responsive rows per page
  useEffect(() => {
    const updateRows = () => {
      const width = window.innerWidth;
      if (width >= 2560) setRowsPerPage(14);
      else if (width >= 1920) setRowsPerPage(12);
      else if (width >= 1440) setRowsPerPage(9);
      else if (width >= 1366) setRowsPerPage(8);
      else setRowsPerPage(6);
    };

    updateRows();
    window.addEventListener("resize", updateRows);
    return () => window.removeEventListener("resize", updateRows);
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
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort_by: sortConfig.sortBy,
        sort_order: sortConfig.order,
      };

      const resp = await getTickets(params);
      const data = resp.data?.data;

      setTickets(data?.tickets || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    searchText,
    statusFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    sortConfig,
  ]);

  // Initial fetch
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
    fetchTickets();
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleCancelTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsCancelModalOpen(true);
  };

  // ✅ New: Handle ticket reopen
  const handleReopenTicket = async (ticket, reason) => {
    try {
      await reopenTicket(ticket.ticket_id, { reason });
      toast.success("Ticket reopened successfully");
      setIsViewModalOpen(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error("Failed to reopen ticket:", error);
      toast.error(error.response?.data?.message || "Failed to reopen ticket");
    }
  };

  const handleTicketCreated = () => {
    setIsCreateModalOpen(false);
    fetchTickets();
  };

  const handleTicketCancelled = () => {
    setIsCancelModalOpen(false);
    setSelectedTicket(null);
    fetchTickets();
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          {/* <p className="text-sm text-gray-500 mt-1">
            {totalItems} {totalItems === 1 ? "ticket" : "tickets"} found
          </p> */}
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-medium 
                     flex items-center gap-2 hover:bg-[#06027a] transition-all shadow-sm"
        >
          <Plus size={18} />
          <span>Create Ticket</span>
        </button>
      </div>

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
              placeholder="Search by ticket number or subject..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 
                         focus:border-indigo-500 transition-all"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => {
                  setSearchText("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                           text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 h-11 bg-[#000060] text-white rounded-lg text-sm font-medium
                       hover:bg-indigo-900 transition-all shadow-sm"
          >
            Search
          </button>

          {/* Toggle Filters Button */}
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
        </form>

        {/* Filter Options */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 px-4 py-2 text-sm font-medium">
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

            {/* Clear Filters Button */}
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
        <TicketListTable
          tickets={tickets}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onViewTicket={handleViewTicket}
          onCancelTicket={handleCancelTicket}
          onRefresh={fetchTickets}
        />
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTicketCreated}
      />

      <ViewTicketModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onCancelClick={handleCancelTicket}
        onReopenClick={handleReopenTicket} // ✅ Pass reopen handler
        onRefresh={fetchTickets}
      />

      <CancelTicketModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onSuccess={handleTicketCancelled}
      />
    </div>
  );
};

export default TicketsPage;
