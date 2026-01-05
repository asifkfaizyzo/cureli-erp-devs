// cureli-admin/src/pages/VerificationPage.jsx

import { useState, useCallback, useEffect } from "react";
import VerificationHeader from "./comps/VerificationHeader";
import VerificationTable from "./comps/VerificationTable";
import VerificationModal from "./comps/VerificationModal";
import { listShopsForVerification } from "../../api/cadminDocs";
import { useToast } from "../../components/common/Toast";

const VerificationPage = () => {
  const toast = useToast();
  
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [resubmissionCount, setResubmissionCount] = useState("");
  const [date, setDate] = useState("");

  // Sort
  const [sortField, setSortField] = useState("default");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Server data
  const [shops, setShops] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modal
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Responsive rows per page
  useEffect(() => {
    const updateRows = () => {
      const w = window.innerWidth;
      const r =
        w >= 2560 ? 10:
        w >= 1920 ? 10 :
        w >= 1440 ? 10 :
        w >= 1366 ? 8 :
        6;
      setRowsPerPage(r);
    };

    updateRows();
    window.addEventListener("resize", updateRows);
    return () => window.removeEventListener("resize", updateRows);
  }, []);

  // Fetch shops
  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        sort_by: sortField,
        sort_order: sortOrder,
      };

      if (search.trim()) {
        params.search = search.trim();
      }
      if (status) {
        params.status = status;
      }
      if (resubmissionCount && Number(resubmissionCount) > 0) {
        params.resubmissionCountMin = Number(resubmissionCount);
      }
      if (date) {
        params.dateStart = date;
      }

      console.log("📤 Fetching with params:", params);

      const resp = await listShopsForVerification(params);
      const payload = resp.data?.data || {};

      console.log("📥 Response:", payload);

      setShops(payload.data || []);
      setTotalItems(payload.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
      setShops([]);
      setTotalItems(0);
      
      // Show error toast
      const errorMessage = err.response?.data?.message || "Unable to load verification data. Please try again.";
      toast.error("Failed to Load Data", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, search, status, resubmissionCount, date, sortField, sortOrder, toast]);

  // Fetch on dependencies change
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // ✅ UPDATED: Handler with debugging and toast notifications
  const handleRowClick = (shop) => {
    console.log("🔵 Row clicked:", shop);
    console.log("🔵 Shop ID:", shop?.shop_id);
    
    if (!shop || !shop.shop_id) {
      console.error("❌ Invalid shop data:", shop);
      toast.error("Error", "Unable to open shop details. Invalid shop data.");
      return;
    }
    
    setSelectedShop(shop);
    setIsModalOpen(true);
    console.log("✅ Modal should open now");
  };

  const handleSortChange = (field) => {
    const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const handleFilterChange = (updates) => {
    if (updates.search !== undefined) setSearch(updates.search);
    if (updates.status !== undefined) setStatus(updates.status);
    if (updates.resubmissionCount !== undefined) setResubmissionCount(updates.resubmissionCount);
    if (updates.date !== undefined) setDate(updates.date);
    setCurrentPage(1);
  };

  const handleModalClose = (shouldRefresh = false) => {
    console.log("🔵 Modal closing, shouldRefresh:", shouldRefresh);
    setIsModalOpen(false);
    setSelectedShop(null);
    if (shouldRefresh) {
      toast.info("Refreshing", "Loading latest verification data...", 2000);
      fetchShops();
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  // ✅ DEBUG: Log modal state
  console.log("🔍 Modal state:", { isModalOpen, selectedShop: selectedShop?.shop_id });

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      {/* Header with filters */}
      <div className="shrink-0 relative z-30">
        <VerificationHeader
          search={search}
          setSearch={(v) => handleFilterChange({ search: v })}
          status={status}
          setStatus={(v) => handleFilterChange({ status: v })}
          resubmissionCount={resubmissionCount}
          setResubmissionCount={(v) => handleFilterChange({ resubmissionCount: v })}
          date={date}
          setDate={(v) => handleFilterChange({ date: v })}
          shops={shops}
          totalItems={totalItems}
        />
      </div>

      {/* Table with pagination */}
      <div className="flex-1 min-h-0 relative z-10">
        <VerificationTable
          data={shops}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          totalPages={totalPages}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onRowClick={handleRowClick}
        />
      </div>

      {/* ✅ Modal - Added null check for selectedShop */}
      {isModalOpen && selectedShop && (
        <VerificationModal
          shop={selectedShop}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default VerificationPage;


// // cureli-admin/src/pages/VerificationPage.jsx

// import { useState, useCallback, useEffect } from "react";
// import VerificationHeader from "../components/Verification/VerificationHeader";
// import VerificationTable from "../components/Verification/VerificationTable";
// import VerificationModal from "../components/Verification/VerificationModal";
// import { listShopsForVerification } from "../api/cadminDocs";

// const VerificationPage = () => {
//   // Filters
//   const [search, setSearch] = useState("");
//   const [status, setStatus] = useState("");
//   const [resubmissionCount, setResubmissionCount] = useState("");
//   const [date, setDate] = useState("");

//   // Sort
//   const [sortField, setSortField] = useState("default");
//   const [sortOrder, setSortOrder] = useState("desc");

//   // Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);

//   // Server data
//   const [shops, setShops] = useState([]);
//   const [totalItems, setTotalItems] = useState(0);
//   const [loading, setLoading] = useState(false);

//   // Modal
//   const [selectedShop, setSelectedShop] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // Responsive rows per page
//   useEffect(() => {
//     const updateRows = () => {
//       const w = window.innerWidth;
//       const r =
//         w >= 2560 ? 10:
//         w >= 1920 ? 10 :
//         w >= 1440 ? 10 :
//         w >= 1366 ? 8 :
//         6;
//       setRowsPerPage(r);
//     };

//     updateRows();
//     window.addEventListener("resize", updateRows);
//     return () => window.removeEventListener("resize", updateRows);
//   }, []);

//   // Fetch shops
//   const fetchShops = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = {
//         page: currentPage,
//         limit: rowsPerPage,
//         sort_by: sortField,
//         sort_order: sortOrder,
//       };

//       if (search.trim()) {
//         params.search = search.trim();
//       }
//       if (status) {
//         params.status = status;
//       }
//       if (resubmissionCount && Number(resubmissionCount) > 0) {
//         params.resubmissionCountMin = Number(resubmissionCount);
//       }
//       if (date) {
//         params.dateStart = date;
//       }

//       console.log("📤 Fetching with params:", params);

//       const resp = await listShopsForVerification(params);
//       const payload = resp.data?.data || {};

//       console.log("📥 Response:", payload);

//       setShops(payload.data || []);
//       setTotalItems(payload.meta?.total || 0);
//     } catch (err) {
//       console.error("Failed to fetch shops:", err);
//       setShops([]);
//       setTotalItems(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentPage, rowsPerPage, search, status, resubmissionCount, date, sortField, sortOrder]);

//   // Fetch on dependencies change
//   useEffect(() => {
//     fetchShops();
//   }, [fetchShops]);

//   // ✅ UPDATED: Handler with debugging
//   const handleRowClick = (shop) => {
//     console.log("🔵 Row clicked:", shop);
//     console.log("🔵 Shop ID:", shop?.shop_id);
    
//     if (!shop || !shop.shop_id) {
//       console.error("❌ Invalid shop data:", shop);
//       return;
//     }
    
//     setSelectedShop(shop);
//     setIsModalOpen(true);
//     console.log("✅ Modal should open now");
//   };

//   const handleSortChange = (field) => {
//     const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
//     setSortField(field);
//     setSortOrder(newOrder);
//     setCurrentPage(1);
//   };

//   const handleFilterChange = (updates) => {
//     if (updates.search !== undefined) setSearch(updates.search);
//     if (updates.status !== undefined) setStatus(updates.status);
//     if (updates.resubmissionCount !== undefined) setResubmissionCount(updates.resubmissionCount);
//     if (updates.date !== undefined) setDate(updates.date);
//     setCurrentPage(1);
//   };

//   const handleModalClose = (shouldRefresh = false) => {
//     console.log("🔵 Modal closing, shouldRefresh:", shouldRefresh);
//     setIsModalOpen(false);
//     setSelectedShop(null);
//     if (shouldRefresh) {
//       fetchShops();
//     }
//   };

//   const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

//   // ✅ DEBUG: Log modal state
//   console.log("🔍 Modal state:", { isModalOpen, selectedShop: selectedShop?.shop_id });

//   return (
//     <div className="p-4 h-full flex flex-col gap-4">
//       {/* Header with filters */}
//       <div className="shrink-0 relative z-30">
//         <VerificationHeader
//           search={search}
//           setSearch={(v) => handleFilterChange({ search: v })}
//           status={status}
//           setStatus={(v) => handleFilterChange({ status: v })}
//           resubmissionCount={resubmissionCount}
//           setResubmissionCount={(v) => handleFilterChange({ resubmissionCount: v })}
//           date={date}
//           setDate={(v) => handleFilterChange({ date: v })}
//           shops={shops}
//           totalItems={totalItems}
//         />
//       </div>

//       {/* Table with pagination */}
//       <div className="flex-1 min-h-0 relative z-10">
//         <VerificationTable
//           data={shops}
//           loading={loading}
//           currentPage={currentPage}
//           setCurrentPage={setCurrentPage}
//           rowsPerPage={rowsPerPage}
//           totalItems={totalItems}
//           totalPages={totalPages}
//           sortField={sortField}
//           sortOrder={sortOrder}
//           onSortChange={handleSortChange}
//           onRowClick={handleRowClick}
//         />
//       </div>

//       {/* ✅ Modal - Added null check for selectedShop */}
//       {isModalOpen && selectedShop && (
//         <VerificationModal
//           shop={selectedShop}
//           onClose={handleModalClose}
//         />
//       )}
//     </div>
//   );
// };

// export default VerificationPage;