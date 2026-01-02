// cureli-admin/src/pages/AdminsPage.jsx

import { useState, useEffect, useCallback } from "react";
import AdminHeader from "../components/Admin/AdminHeader";
import AdminTable from "../components/Admin/AdminTable";
import AddAdminModal from "../components/Admin/AddAdminModal";
import { getAdmins } from "../api/cadminAdmins";

const AdminsPage = () => {
  // DATA STATE
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PAGINATION META FROM SERVER
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // MODAL STATE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // FILTERS & SORT (sent to server)
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ✅ Dynamic rows per page based on screen size
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

  // FETCH ADMINS FROM SERVER
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        sort: sortConfig.sortBy,
        order: sortConfig.order,
      };

      // Only add non-empty filters
      if (searchText.trim()) params.search = searchText.trim();
      if (statusFilter) params.status = statusFilter.toLowerCase();
      if (roleFilter) params.role = roleFilter.toLowerCase().replace(/\s+/g, "_");

      const response = await getAdmins(params);
      const { admins: data, meta } = response.data.data;

      setAdmins(data);
      setTotalItems(meta.total);
      setTotalPages(meta.totalPages);

      // Correct page if out of bounds
      if (currentPage > meta.totalPages && meta.totalPages > 0) {
        setCurrentPage(meta.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      setError(err.response?.data?.message || "Failed to fetch admins");
      setAdmins([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchText, statusFilter, roleFilter, sortConfig]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, roleFilter, sortConfig]);

  // HANDLERS
  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      order: prev.sortBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // Handler for filter changes
  const handleFilterChange = ({ search, status, role }) => {
    if (search !== undefined) setSearchText(search);
    if (status !== undefined) setStatusFilter(status);
    if (role !== undefined) setRoleFilter(role);
    setCurrentPage(1);
  };

  // Update admin in local state (optimistic update)
  const handleAdminUpdate = useCallback((adminId, updates) => {
    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, ...updates } : a))
    );
  }, []);

  // Refresh list from server
  const handleRefresh = useCallback(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Open add modal
  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // Close add modal
  const handleCloseAddModal = useCallback(
    (wasCreated) => {
      setIsAddModalOpen(false);
      if (wasCreated) {
        setCurrentPage(1);
        fetchAdmins();
      }
    },
    [fetchAdmins]
  );

  // After creating admin, add to list optimistically
  const handleCreateAdmin = useCallback(
    (newAdmin) => {
      setAdmins((prev) => [newAdmin, ...prev.slice(0, rowsPerPage - 1)]);
      setTotalItems((prev) => prev + 1);
    },
    [rowsPerPage]
  );

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* HEADER */}
      <AdminHeader
        searchText={searchText}
        setSearchText={(v) => handleFilterChange({ search: v })}
        statusFilter={statusFilter}
        setStatusFilter={(v) => handleFilterChange({ status: v })}
        roleFilter={roleFilter}
        setRoleFilter={(v) => handleFilterChange({ role: v })}
        admins={admins}
        totalItems={totalItems}
        onAddAdmin={handleOpenAddModal}
        loading={loading}
      />

      {/* ERROR STATE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="text-red-700 hover:text-red-900 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* TABLE - ✅ Updated props */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AdminTable
          admins={admins}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onAdminUpdate={handleAdminUpdate}
          onRefresh={handleRefresh}
        />
      </div>

      {/* ADD ADMIN MODAL */}
      <AddAdminModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onCreate={handleCreateAdmin}
      />
    </div>
  );
};

export default AdminsPage;