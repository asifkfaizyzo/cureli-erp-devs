// EnquiriesPage.jsx
import { useState, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import {
  getEnquiries,
  getEnquiryStats,
  deleteEnquiry,
} from "../../api/cadminEnquiries";
import EnquiriesHeader from "./components/EnquiriesHeader";
import EnquiriesTable from "./components/EnquiriesTable";
import EnquiryDetailsModal from "./components/EnquiryDetailsModal";
import EnquiryReplyModal from "./components/EnquiryReplyModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const EnquiriesPage = () => {
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
      setEnquiries(response.data.enquiries || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);
      setError("Failed to load enquiries");
      setEnquiries([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await getEnquiryStats();
      setStats(response.data.stats || null);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
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

  const handleReply = useCallback((enquiry) => {
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
      setIsDeleteDialogOpen(false);
      setSelectedEnquiry(null);
      handleRefresh();
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedEnquiry(null);
  }, []);

  const handleCloseReplyModal = useCallback(() => {
    setIsReplyModalOpen(false);
    setSelectedEnquiry(null);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedEnquiry(null);
  }, []);

  return (
    <div className="p-6 space-y-6">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
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
        onReply={handleReply}
        onStatusChange={handleRefresh}
      />

      {/* Reply Modal */}
      <EnquiryReplyModal
        enquiry={selectedEnquiry}
        isOpen={isReplyModalOpen}
        onClose={handleCloseReplyModal}
        onSuccess={handleRefresh}
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

// import { useState, useEffect, useCallback } from "react";
// import { MessageSquare } from "lucide-react";
// import { getEnquiries, getEnquiryStats, deleteEnquiry } from "../../api/cadminEnquiries";
// import EnquiriesHeader from "./components/EnquiriesHeader";
// import EnquiriesTable from "./components//EnquiriesTable";
// import EnquiryDetailsModal from "./components//EnquiryDetailsModal";
// import EnquiryReplyModal from "./components//EnquiryReplyModal";
// import ConfirmDialog from "../../components/common/ConfirmDialog";

// const EnquiriesPage = () => {
//   // Data state
//   const [enquiries, setEnquiries] = useState([]);
//   const [pagination, setPagination] = useState(null);
//   const [stats, setStats] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // Filters
//   const [filters, setFilters] = useState({
//     search: "",
//     status: "ALL",
//     page: 1,
//     limit: 10,
//   });

//   // Modal state
//   const [selectedEnquiry, setSelectedEnquiry] = useState(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // Fetch enquiries
//   const fetchEnquiries = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const response = await getEnquiries({
//         page: filters.page,
//         limit: filters.limit,
//         status: filters.status,
//         search: filters.search,
//       });
//       setEnquiries(response.data.enquiries);
//       setPagination(response.data.pagination);
//     } catch (error) {
//       console.error("Failed to fetch enquiries:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [filters]);

//   // Fetch stats
//   const fetchStats = async () => {
//     try {
//       const response = await getEnquiryStats();
//       setStats(response.data.stats);
//     } catch (error) {
//       console.error("Failed to fetch stats:", error);
//     }
//   };

//   useEffect(() => {
//     fetchEnquiries();
//   }, [fetchEnquiries]);

//   useEffect(() => {
//     fetchStats();
//   }, []);

//   // Handlers
//   const handleFilterChange = (newFilters) => {
//     setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
//   };

//   const handlePageChange = (page) => {
//     setFilters((prev) => ({ ...prev, page }));
//   };

//   const handleRefresh = () => {
//     fetchEnquiries();
//     fetchStats();
//   };

//   const handleView = (enquiry) => {
//     setSelectedEnquiry(enquiry);
//     setIsDetailsModalOpen(true);
//   };

//   const handleReply = (enquiry) => {
//     setSelectedEnquiry(enquiry);
//     setIsReplyModalOpen(true);
//   };

//   const handleDeleteClick = (enquiry) => {
//     setSelectedEnquiry(enquiry);
//     setIsDeleteDialogOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!selectedEnquiry) return;
    
//     setIsDeleting(true);
//     try {
//       await deleteEnquiry(selectedEnquiry.enquiry_id);
//       setIsDeleteDialogOpen(false);
//       setSelectedEnquiry(null);
//       handleRefresh();
//     } catch (error) {
//       console.error("Failed to delete enquiry:", error);
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const handleReplySuccess = () => {
//     handleRefresh();
//   };

//   const handleStatusChange = () => {
//     handleRefresh();
//   };

//   return (
//     <div className="p-6 space-y-6">
      

//       {/* Page Title */}
//       <div className="flex items-center gap-3">
//         <div className="w-10 h-10 bg-[#000060]/10 rounded-xl flex items-center justify-center">
//           <MessageSquare className="w-5 h-5 text-[#000060]" />
//         </div>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
//           <p className="text-sm text-gray-500">Manage and respond to customer enquiries</p>
//         </div>
//       </div>

//       {/* Header with Stats & Filters */}
//       <EnquiriesHeader
//         stats={stats}
//         filters={filters}
//         onFilterChange={handleFilterChange}
//         onRefresh={handleRefresh}
//         isLoading={isLoading}
//       />

//       {/* Table */}
//       <EnquiriesTable
//         enquiries={enquiries}
//         isLoading={isLoading}
//         onView={handleView}
//         onReply={handleReply}
//         onDelete={handleDeleteClick}
//         pagination={pagination}
//         onPageChange={handlePageChange}
//       />

//       {/* Details Modal */}
//       <EnquiryDetailsModal
//         enquiry={selectedEnquiry}
//         isOpen={isDetailsModalOpen}
//         onClose={() => {
//           setIsDetailsModalOpen(false);
//           setSelectedEnquiry(null);
//         }}
//         onReply={handleReply}
//         onStatusChange={handleStatusChange}
//       />

//       {/* Reply Modal */}
//       <EnquiryReplyModal
//         enquiry={selectedEnquiry}
//         isOpen={isReplyModalOpen}
//         onClose={() => {
//           setIsReplyModalOpen(false);
//           setSelectedEnquiry(null);
//         }}
//         onSuccess={handleReplySuccess}
//       />

//       {/* Delete Confirmation */}
//       <ConfirmDialog
//         isOpen={isDeleteDialogOpen}
//         onClose={() => {
//           setIsDeleteDialogOpen(false);
//           setSelectedEnquiry(null);
//         }}
//         onConfirm={handleDeleteConfirm}
//         title="Delete Enquiry"
//         message={`Are you sure you want to delete enquiry "${selectedEnquiry?.enquiry_number}"? This action cannot be undone.`}
//         confirmText="Delete"
//         confirmVariant="danger"
//         isLoading={isDeleting}
//       />
//     </div>
//   );
// };

// export default EnquiriesPage;