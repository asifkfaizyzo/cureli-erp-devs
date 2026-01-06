// cureli-admin/src/pages/Cadmin-management/AdminsPage.jsx

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  UserStar,
  RefreshCw,
  Search,
  X,
  Filter,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import AdminTable from "./comps/AdminTable";
import AddAdminModal from "./comps/AddAdminModal";
import StyledSelect from "../../components/common/StyledSelect";
import { getAdmins } from "../../api/cadminAdmins";
import { useToast } from "../../components/common/Toast";

// Helper to get initial rows based on screen width
const getRowsForScreenSize = (width) => {
  if (width >= 2560) return 14;
  if (width >= 1920) return 12;
  if (width >= 1440) return 10;
  if (width >= 1366) return 8;
  return 6;
};

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
];

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

  // FILTERS & SORT
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getRowsForScreenSize(
      typeof window !== "undefined" ? window.innerWidth : 1920
    )
  );

  const isInitialMount = useRef(true);
  const resizeTimeoutRef = useRef(null);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return [statusFilter, roleFilter].filter(Boolean).length;
  }, [statusFilter, roleFilter]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0 || searchText.trim().length > 0;
  }, [activeFiltersCount, searchText]);

  // Dynamic rows per page based on screen size
  useEffect(() => {
    const updateRows = () => {
      const newRows = getRowsForScreenSize(window.innerWidth);

      setRowsPerPage((prevRows) => {
        if (prevRows !== newRows) {
          return newRows;
        }
        return prevRows;
      });
    };

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

      if (searchText.trim()) params.search = searchText.trim();
      if (statusFilter) params.status = statusFilter.toLowerCase();
      if (roleFilter)
        params.role = roleFilter.toLowerCase().replace(/\s+/g, "_");

      const response = await getAdmins(params);
      const { admins: data, meta } = response.data.data;

      setAdmins(data);
      setTotalItems(meta.total);
      setTotalPages(meta.totalPages);

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
  }, [
    currentPage,
    rowsPerPage,
    searchText,
    statusFilter,
    roleFilter,
    sortConfig,
    toast,
  ]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    fetchAdmins();
  }, [fetchAdmins]);

  // Reset to page 1 when filters/sort change
  const isFirstFilterEffect = useRef(true);
  useEffect(() => {
    if (isFirstFilterEffect.current) {
      isFirstFilterEffect.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchText, statusFilter, roleFilter, sortConfig]);

  // Reset to page 1 when rowsPerPage changes
  const prevRowsPerPage = useRef(rowsPerPage);
  useEffect(() => {
    if (prevRowsPerPage.current !== rowsPerPage) {
      prevRowsPerPage.current = rowsPerPage;
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

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("");
    setRoleFilter("");
  }, []);

  const handleAdminUpdate = useCallback(
    (adminId, updates) => {
      try {
        setAdmins((prev) =>
          prev.map((a) => (a.id === adminId ? { ...a, ...updates } : a))
        );

        if (updates.status === "suspended") {
          toast.success(
            "Admin Suspended",
            "Admin account has been suspended successfully."
          );
        } else if (updates.status === "active") {
          toast.success(
            "Admin Activated",
            "Admin account has been activated successfully."
          );
        } else {
          toast.success(
            "Admin Updated",
            "Admin information updated successfully."
          );
        }
      } catch (error) {
        console.error("Failed to update admin:", error);
        toast.error(
          "Update Failed",
          "Failed to update admin. Please try again."
        );
      }
    },
    [toast]
  );

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
      toast.success(
        "Admin Created",
        `${newAdmin.username || "New admin"} has been added successfully.`
      );
    },
    [rowsPerPage, toast]
  );

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <UserStar size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Admin Management
              </h1>
              <p className="text-sm text-gray-500">
                {totalItems} total admin{totalItems !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-[#000060] to-[#0000a0] text-white rounded-lg
                         hover:shadow-lg hover:shadow-[#000060]/25 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Add Admin</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                           bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20 
                           focus:border-[#000060] transition-all"
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

            {/* Filter Toggle Button */}
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
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white 
                                 text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="pt-3 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <StyledSelect
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={STATUS_OPTIONS}
                  placeholder="All Status"
                />

                <StyledSelect
                  label="Role"
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value)}
                  options={ROLE_OPTIONS}
                  placeholder="All Roles"
                />
              </div>

              {hasActiveFilters && (
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
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-700 hover:text-red-900 font-medium underline text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Table */}
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

      {/* Add Admin Modal */}
      <AddAdminModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onCreate={handleCreateAdmin}
      />
    </div>
  );
};

export default AdminsPage;
