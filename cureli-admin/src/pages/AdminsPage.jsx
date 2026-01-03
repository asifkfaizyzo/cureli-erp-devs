// cureli-admin/src/pages/AdminsPage.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import AdminHeader from "../components/Admin/AdminHeader";
import AdminTable from "../components/Admin/AdminTable";
import AddAdminModal from "../components/Admin/AddAdminModal";
import { getAdmins } from "../api/cadminAdmins";
import { useToast } from "../components/common/Toast";

// ✅ Helper to get initial rows based on screen width
const getRowsForScreenSize = (width) => {
  if (width >= 2560) return 14;
  if (width >= 1920) return 12;
  if (width >= 1440) return 10; // ✅ Changed from 9 to 10 (allowed by API)
  if (width >= 1366) return 8;
  return 6;
};

const AdminsPage = () => {
  const toast = useToast();
  
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

  // PAGINATION - ✅ Initialize with correct value based on screen size
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(() => 
    getRowsForScreenSize(typeof window !== 'undefined' ? window.innerWidth : 1920)
  );

  // ✅ Track if initial fetch is done to prevent double fetching
  const isInitialMount = useRef(true);
  const resizeTimeoutRef = useRef(null);

  // ✅ Dynamic rows per page based on screen size with debouncing
  useEffect(() => {
    const updateRows = () => {
      const newRows = getRowsForScreenSize(window.innerWidth);
      
      setRowsPerPage((prevRows) => {
        // Only update if actually changed
        if (prevRows !== newRows) {
          return newRows;
        }
        return prevRows;
      });
    };

    // Debounced resize handler to prevent rapid API calls
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateRows, 300);
    };

    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
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
      const errorMsg = err.response?.data?.message || "Failed to fetch admins";
      setError(errorMsg);
      setAdmins([]);
      setTotalItems(0);
      toast.error("Failed to Load Admins", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchText, statusFilter, roleFilter, sortConfig, toast]);

  // ✅ Fetch on mount and when dependencies change (with initial mount check)
  useEffect(() => {
    // Skip first effect if rowsPerPage might change immediately
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    fetchAdmins();
  }, [fetchAdmins]);

  // Reset to page 1 when filters/sort change (but NOT on initial mount)
  const isFirstFilterEffect = useRef(true);
  useEffect(() => {
    if (isFirstFilterEffect.current) {
      isFirstFilterEffect.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchText, statusFilter, roleFilter, sortConfig]);

  // ✅ Reset to page 1 when rowsPerPage changes (screen resize)
  const prevRowsPerPage = useRef(rowsPerPage);
  useEffect(() => {
    if (prevRowsPerPage.current !== rowsPerPage) {
      prevRowsPerPage.current = rowsPerPage;
      // If current page would be out of bounds with new limit, reset to 1
      if (currentPage > 1) {
        setCurrentPage(1);
      }
    }
  }, [rowsPerPage, currentPage]);

  // HANDLERS
  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      order: prev.sortBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleFilterChange = ({ search, status, role }) => {
    if (search !== undefined) setSearchText(search);
    if (status !== undefined) setStatusFilter(status);
    if (role !== undefined) setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleAdminUpdate = useCallback((adminId, updates) => {
    try {
      setAdmins((prev) =>
        prev.map((a) => (a.id === adminId ? { ...a, ...updates } : a))
      );
      
      if (updates.status === "suspended") {
        toast.success("Admin Suspended", "Admin account has been suspended successfully.");
      } else if (updates.status === "active") {
        toast.success("Admin Activated", "Admin account has been activated successfully.");
      } else {
        toast.success("Admin Updated", "Admin information updated successfully.");
      }
    } catch (error) {
      console.error("Failed to update admin:", error);
      toast.error("Update Failed", "Failed to update admin. Please try again.");
    }
  }, [toast]);

  const handleRefresh = useCallback(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

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

  const handleCreateAdmin = useCallback(
    (newAdmin) => {
      setAdmins((prev) => [newAdmin, ...prev.slice(0, rowsPerPage - 1)]);
      setTotalItems((prev) => prev + 1);
      toast.success("Admin Created", `${newAdmin.username || "New admin"} has been added successfully.`);
    },
    [rowsPerPage, toast]
  );

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
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

      <AddAdminModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onCreate={handleCreateAdmin}
      />
    </div>
  );
};

export default AdminsPage;