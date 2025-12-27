// frontend/src/pages/tickets/TicketsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { 
  Ticket, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle 
} from "lucide-react";
import { getTickets, getTicketStats } from "../../api/tickets";
import { useAuthStore } from "../../store/useAuthStore";
import TicketFilters from "./components/TicketFilters";
import TicketListTable from "./components/TicketListTable";
import CreateTicketModal from "./components/CreateTicketModal";
import ViewTicketModal from "./components/ViewTicketModal";
import CancelTicketModal from "./components/CancelTicketModal";

const TicketsPage = () => {
  const { user } = useAuthStore();

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    recent_7_days: 0,
    by_status: {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CANCELLED: 0,
      CLOSED: 0,
    },
  });

  // Tickets data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const resp = await getTicketStats();
      setStats(resp.data?.data?.stats || {});
    } catch (err) {
      console.error("Failed to fetch stats:", err);
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
        branch_id: branchFilter || undefined,
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
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    searchText,
    statusFilter,
    categoryFilter,
    branchFilter,
    dateFrom,
    dateTo,
    sortConfig,
  ]);

  // Initial fetch
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

  const handleRefresh = () => {
    fetchTickets();
    fetchStats();
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleCancelTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsCancelModalOpen(true);
  };

  const handleTicketCreated = () => {
    setIsCreateModalOpen(false);
    handleRefresh();
  };

  const handleTicketCancelled = () => {
    setIsCancelModalOpen(false);
    handleRefresh();
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6 bg-gray-50 overflow-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Ticket size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-sm text-gray-500">
              Manage and track your support requests
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-medium 
                     flex items-center gap-2 hover:bg-[#06027a] transition-all"
        >
          <Plus size={18} />
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Tickets</p>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Ticket size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.recent_7_days} in last 7 days
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Open</p>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.by_status?.OPEN || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">In Progress</p>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.by_status?.IN_PROGRESS || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Being worked on</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Resolved</p>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.by_status?.RESOLVED || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Successfully closed</p>
        </div>
      </div>

      {/* Filters */}
      <TicketFilters
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onClear={() => {
          setSearchText("");
          setStatusFilter("");
          setCategoryFilter("");
          setBranchFilter("");
          setDateFrom("");
          setDateTo("");
          setCurrentPage(1);
        }}
      />

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
          onRefresh={handleRefresh}
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
        onRefresh={handleRefresh}
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
