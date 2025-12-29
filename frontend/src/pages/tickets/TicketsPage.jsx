// frontend/src/pages/tickets/TicketsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, X } from "lucide-react";
import { getTickets } from "../../api/tickets";
import TicketListTable from "./components/TicketListTable";
import CreateTicketModal from "./components/CreateTicketModal";
import ViewTicketModal from "./components/ViewTicketModal";
import CancelTicketModal from "./components/CancelTicketModal";

const TicketsPage = () => {
  // Tickets data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Simple search
  const [searchText, setSearchText] = useState("");

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

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
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
  }, [currentPage, rowsPerPage, searchText, sortConfig]);

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
    fetchTickets();
  };

  const handleTicketCancelled = () => {
    setIsCancelModalOpen(false);
    fetchTickets();
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalItems} {totalItems === 1 ? "ticket" : "tickets"} found
          </p>
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

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
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
            className="px-6 h-11 bg-indigo-600 text-white rounded-lg text-sm font-medium
                       hover:bg-indigo-700 transition-all shadow-sm"
          >
            Search
          </button>
        </form>
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
