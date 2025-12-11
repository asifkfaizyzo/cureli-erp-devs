// cureli-admin/src/pages/VerificationPage.jsx

import { useState, useCallback, useEffect } from "react";
import VerificationHeader from "../components/Verification/VerificationHeader";
import VerificationTable from "../components/Verification/VerificationTable";
import VerificationModal from "../components/Verification/VerificationModal";
import { listShopsForVerification } from "../api/cadminDocs";

const VerificationPage = () => {
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [resubmissionCount, setResubmissionCount] = useState("");
  const [date, setDate] = useState("");

  // Sort
  const [sortField, setSortField] = useState("created_at");
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
        w >= 2560 ? 14 :
        w >= 1920 ? 12 :
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
      // ✅ Build params object - only include non-empty values
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        sort_by: sortField,
        sort_order: sortOrder,
      };

      // Only add filters if they have values
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
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, search, status, resubmissionCount, date, sortField, sortOrder]);

  // Fetch on dependencies change
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Handlers
  const handleRowClick = (shop) => {
    setSelectedShop(shop);
    setIsModalOpen(true);
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
    setIsModalOpen(false);
    setSelectedShop(null);
    if (shouldRefresh) {
      fetchShops();
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      {/* Header with filters - Higher z-index for dropdowns */}
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

      {/* Table with pagination - Lower z-index */}
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

      {/* Modal - Highest z-index */}
      {isModalOpen && (
        <VerificationModal
          shop={selectedShop}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default VerificationPage;