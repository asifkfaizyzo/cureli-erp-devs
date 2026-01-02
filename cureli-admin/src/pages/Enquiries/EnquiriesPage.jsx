import { useState, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import {
  getEnquiries,
  getEnquiryStats,
  deleteEnquiry,
} from "../../api/cadminEnquiries";
import { useToast } from "../../components/common/Toast";
import EnquiriesHeader from "./components/EnquiriesHeader";
import EnquiriesTable from "./components/EnquiriesTable";
import EnquiryDetailsModal from "./components/EnquiryDetailsModal";
import EnquiryReplyModal from "./components/EnquiryReplyModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const EnquiriesPage = () => {
  const toast = useToast();

  // Data state
  const [enquiries, setEnquiries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    page: 1,
    limit: 10,
  });

  // Modal state
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch enquiries
  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getEnquiries({
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        search: filters.search,
      });

      console.log("📤 Full Response:", response);

      let enquiriesData = [];
      let paginationData = null;

      if (response?.data?.data?.enquiries) {
        enquiriesData = response.data.data.enquiries;
        paginationData = response.data.data.pagination;
      } else if (response?.data?.enquiries) {
        enquiriesData = response.data.enquiries;
        paginationData = response.data.pagination;
      } else if (response?.enquiries) {
        enquiriesData = response.enquiries;
        paginationData = response.pagination;
      } else if (Array.isArray(response?.data?.data)) {
        enquiriesData = response.data.data;
      } else if (Array.isArray(response?.data)) {
        enquiriesData = response.data;
      } else if (Array.isArray(response)) {
        enquiriesData = response;
      }

      console.log("📋 Parsed Enquiries:", enquiriesData);
      console.log("📄 Parsed Pagination:", paginationData);

      setEnquiries(enquiriesData);
      setPagination(paginationData);
    } catch (err) {
      console.error("❌ Failed to fetch enquiries:", err);
      setError("Failed to load enquiries. Please try again.");
      setEnquiries([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await getEnquiryStats();

      console.log("📊 Stats Response:", response);

      let statsData = null;

      if (response?.data?.data?.stats) {
        statsData = response.data.data.stats;
      } else if (response?.data?.stats) {
        statsData = response.data.stats;
      } else if (response?.stats) {
        statsData = response.stats;
      } else if (response?.data?.data && typeof response.data.data === "object") {
        statsData = response.data.data;
      } else if (response?.data && typeof response.data === "object" && !response.data.success) {
        statsData = response.data;
      }

      console.log("📊 Parsed Stats:", statsData);

      setStats(statsData);
    } catch (err) {
      console.error("❌ Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handlers
  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchEnquiries();
    fetchStats();
  }, [fetchEnquiries, fetchStats]);

  const handleView = useCallback((enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDetailsModalOpen(true);
  }, []);

  // ✅ Open reply modal from table or details modal
  const handleReply = useCallback((enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsReplyModalOpen(true);
  }, []);

  // ✅ Open reply modal from details modal (keeps details modal reference)
  const handleReplyFromDetails = useCallback((enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsReplyModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!selectedEnquiry) return;

    setIsDeleting(true);
    try {
      await deleteEnquiry(selectedEnquiry.enquiry_id);
      toast.success("Deleted", `Enquiry ${selectedEnquiry.enquiry_number} has been deleted.`);
      setIsDeleteDialogOpen(false);
      setSelectedEnquiry(null);
      handleRefresh();
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
      toast.error("Delete Failed", "Could not delete the enquiry. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ UPDATED: Close ALL modals after successful reply and refresh data
  const handleReplySuccess = useCallback(() => {
    // Close reply modal
    setIsReplyModalOpen(false);
    
    // Close details modal (if open)
    setIsDetailsModalOpen(false);
    
    // Clear selected enquiry
    setSelectedEnquiry(null);
    
    // Refresh the enquiries list and stats
    handleRefresh();
    
    console.log("✅ Reply sent - returning to enquiries page");
  }, [handleRefresh]);

  const handleStatusChange = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedEnquiry(null);
  }, []);

  const handleCloseReplyModal = useCallback(() => {
    setIsReplyModalOpen(false);
    // ✅ Don't clear selectedEnquiry here - might need it for details modal
    // Only clear if details modal is also closed
    if (!isDetailsModalOpen) {
      setSelectedEnquiry(null);
    }
  }, [isDetailsModalOpen]);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedEnquiry(null);
  }, []);

  return (
    <div className="p-6 space-y-6 font-poppins">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#000060]/10 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#000060]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-sm text-gray-500">
            Manage and respond to customer enquiries
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button
            onClick={handleRefresh}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Header with Stats & Filters */}
      <EnquiriesHeader
        stats={stats}
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Table */}
      <EnquiriesTable
        enquiries={enquiries}
        isLoading={isLoading}
        onView={handleView}
        onReply={handleReply}
        onDelete={handleDeleteClick}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Details Modal */}
      <EnquiryDetailsModal
        enquiry={selectedEnquiry}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        onReply={handleReplyFromDetails}
        onStatusChange={handleStatusChange}
      />

      {/* Reply Modal */}
      <EnquiryReplyModal
        enquiry={selectedEnquiry}
        isOpen={isReplyModalOpen}
        onClose={handleCloseReplyModal}
        onSuccess={handleReplySuccess} // ✅ This now closes everything
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Enquiry"
        message={`Are you sure you want to delete enquiry "${selectedEnquiry?.enquiry_number}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EnquiriesPage;

