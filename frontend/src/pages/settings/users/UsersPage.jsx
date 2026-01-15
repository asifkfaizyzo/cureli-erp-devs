// src/pages/settings/UsersPage.jsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { usePermission } from "../../../hooks/usePermission";
import { useToast } from "../../../components/common/Toast/ToastContainer";
import {
  fetchUsers,
  fetchUserLimits,
} from "../../../api/users";
import { fetchBranchesDropdown } from "../../../api/branches";

// Components
import UserLimitBanner from "./comps/UserLimitBanner";
import UserFilters from "./comps/UserFilters";
import UserListTable from "./comps/UserListTable";
import AddEditUserModal from "./comps/AddEditUserModal";
import ResetPasswordModal from "./comps/ResetPasswordModal";

/**
 * UsersPage
 * Main user management page
 * - SA: sees all users, can manage all
 * - BA: sees only own branch users, can only manage staff
 */
const UsersPage = () => {
  const { isSuperAdmin, isBranchAdmin, branchId } = usePermission();
  const toast = useToast();

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
      toast.error(
        "Branch Load Failed",
        "Could not load branches for filtering. Please try again.",
        5000
      );
    }
  }, [isSuperAdmin, toast]);

  // Fetch user limits
  const loadLimits = useCallback(async () => {
    try {
      const response = await fetchUserLimits();
      if (response.success) {
        setLimits(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch limits:", err);
      toast.warning(
        "Limits Unavailable",
        "Could not load user limits information.",
        4000
      );
    }
  }, [toast]);

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
      const errorMessage = err.response?.data?.message || "Failed to load users. Please try again.";
      setError(errorMessage);
      
      toast.error(
        "Load Failed",
        errorMessage,
        5000
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, filters, isSuperAdmin, toast]);

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
    setRefreshKey((prev) => prev + 1);
    toast.info(
      "Refreshing",
      "Reloading user data...",
      2000
    );
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
    if (!limits?.can_add) {
      toast.warning(
        "User Limit Reached",
        "You have reached the maximum number of users allowed for your plan.",
        5000
      );
      return;
    }
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

  const handleModalClose = (shouldRefresh = false, result = null) => {
    setShowAddEditModal(false);
    setShowResetPasswordModal(false);
    setSelectedUser(null);
    
    if (shouldRefresh) {
      handleRefresh();
      
      // Show appropriate toast based on result
      if (result) {
        if (result.type === 'created') {
          toast.success(
            "User Created",
            `${result.userName} has been successfully added to the system.`,
            4000
          );
        } else if (result.type === 'updated') {
          toast.success(
            "User Updated",
            `${result.userName}'s information has been successfully updated.`,
            4000
          );
        } else if (result.type === 'password_reset') {
          toast.success(
            "Password Reset",
            `Password has been reset for ${result.userName}.`,
            4000
          );
        }
      }
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddUser}
            disabled={!limits?.can_add}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-md
              ${limits?.can_add
                ? 'bg-[#000060] text-white hover:bg-[#000080]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            title={!limits?.can_add ? "User limit reached" : "Add new user"}
          >
            <Plus size={18} />
            Add User
          </motion.button>
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
          toast={toast}
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