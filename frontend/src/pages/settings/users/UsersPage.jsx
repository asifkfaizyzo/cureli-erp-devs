// src/pages/settings/UsersPage.jsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { usePermission } from "../../../hooks/usePermission";
import {
  fetchUsers,
  fetchUserLimits,
} from "../../../api/users";
import { fetchBranchesDropdown } from "../../../api/branches";

// Components
import UserLimitBanner from "./UserLimitBanner";
import UserFilters from "./UserFilters";
import UserListTable from "./UserListTable";
import AddEditUserModal from "./AddEditUserModal";

/**
 * UsersPage
 * Main user management page
 * - SA: sees all users, can manage all
 * - BA: sees only own branch users, can only manage staff
 */
const UsersPage = () => {
  const { isSuperAdmin, isBranchAdmin, branchId } = usePermission();

  // ============================================
  // STATE
  // ============================================
  
  // Data
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [limits, setLimits] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    branch_id: "",
    role: "",
    status: "active",
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    sort_by: "created_at",
    sort_order: "desc",
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  // Fetch branches for filter dropdown (SA only)
  const loadBranches = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    try {
      const response = await fetchBranchesDropdown();
      if (response.success) {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  }, [isSuperAdmin]);

  // Fetch user limits
  const loadLimits = useCallback(async () => {
    try {
      const response = await fetchUserLimits();
      if (response.success) {
        setLimits(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch limits:", err);
    }
  }, []);

  // Fetch users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort_by: sortConfig.sort_by,
        sort_order: sortConfig.sort_order,
      };

      // Add filters
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      
      // Branch filter (SA only, BA is auto-filtered by backend)
      if (isSuperAdmin && filters.branch_id) {
        params.branch_id = filters.branch_id;
      }

      const response = await fetchUsers(params);

      if (response.success) {
        setUsers(response.data.users || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
          total_pages: response.data.pagination.total_pages,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, filters, isSuperAdmin]);

  // Initial load
  useEffect(() => {
    loadBranches();
    loadLimits();
  }, [loadBranches, loadLimits]);

  // Load users on filter/page/sort change
  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]);

  // ============================================
  // HANDLERS
  // ============================================

const handleRefresh = () => {
  window.location.reload();
};


  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === "asc" ? "desc" : "asc",
    }));
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddEditModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowAddEditModal(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleModalClose = (shouldRefresh = false) => {
    setShowAddEditModal(false);
    setShowResetPasswordModal(false);
    setSelectedUser(null);
    
    if (shouldRefresh) {
      handleRefresh();
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-full flex flex-col gap-4 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#000060] flex items-center gap-2">
            <Users size={24} />
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSuperAdmin 
              ? "Manage all users across branches" 
              : "Manage staff members in your branch"
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </motion.button>

          {/* Add User Button */}
          {limits?.can_add && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddUser}
              className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg font-medium hover:bg-[#000080] transition-colors shadow-md"
            >
              <Plus size={18} />
              Add User
            </motion.button>
          )}
        </div>
      </div>

      {/* Limit Banner */}
      {limits && (
        <UserLimitBanner limits={limits} />
      )}

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        branches={branches}
        showBranchFilter={isSuperAdmin}
      />

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="ml-auto text-sm font-medium hover:underline"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* User Table */}
      <div className="flex-1 min-h-0">
        <UserListTable
          users={users}
          loading={loading}
          pagination={pagination}
          sortConfig={sortConfig}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onEdit={handleEditUser}
          onResetPassword={handleResetPassword}
          onRefresh={handleRefresh}
          isSuperAdmin={isSuperAdmin}
          isBranchAdmin={isBranchAdmin}
          currentBranchId={branchId}
        />
      </div>

      {/* Add/Edit Modal */}
      {showAddEditModal && (
        <AddEditUserModal
          user={selectedUser}
          branches={branches}
          onClose={handleModalClose}
          isSuperAdmin={isSuperAdmin}
          currentBranchId={branchId}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default UsersPage;