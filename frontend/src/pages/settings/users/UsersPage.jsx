// src/pages/settings/UsersPage.jsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Plus, RefreshCw } from "lucide-react";

import { usePermission } from "../../../hooks/usePermission";
import { fetchUsers, fetchUserLimits, deleteUser, toggleUserStatus } from "../../../api/users";
import { fetchBranchesDropdown } from "../../../api/branches";
import { useToast } from "../../../components/common/Toast";

// Components
import UserLimitBanner from "./comps/UserLimitBanner";
import UserFilters from "./comps/UserFilters";
import UserListTable from "./comps/UserListTable";
import AddEditUserModal from "./comps/AddEditUserModal";
import ResetPasswordModal from "./comps/ResetPasswordModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog"; // ✅ ADDED

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

  // ✅ ADDED: Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // 'delete' | 'toggle_status'
    user: null,
    loading: false,
    error: null,
  });

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
      toast.warning("Branch Load Warning", "Could not load branch list for filters.");
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
      toast.warning("Limit Warning", "Could not load user limit information.");
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

        // Success toast on manual refresh only
        if (refreshKey > 0) {
          toast.success("Refreshed", "User data updated successfully.");
        }
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      const errorMsg = err.response?.data?.message || "Failed to load users. Please try again.";
      setError(errorMsg);
      toast.error("Load Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, filters, isSuperAdmin, refreshKey, toast]);

  // Initial load
  useEffect(() => {
    loadBranches();
    loadLimits();
  }, [loadBranches, loadLimits]);

  // Load users on filter/page/sort change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === "asc" ? "desc" : "asc",
    }));
  };

  const handleAddUser = () => {
    if (limits && !limits.can_add) {
      toast.warning(
        "Limit Reached",
        `You've reached the maximum of ${limits.max_allowed} users. Please upgrade your plan.`
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

  // ✅ ADDED: Delete User Handler
  const handleDeleteUser = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: "delete",
      user,
      loading: false,
      error: null,
    });
  };

  // ✅ ADDED: Toggle Status Handler
  const handleToggleStatus = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: "toggle_status",
      user,
      loading: false,
      error: null,
    });
  };

  // ✅ ADDED: Confirm Action Handler
  const handleConfirmAction = async () => {
    const { type, user } = confirmDialog;
    
    setConfirmDialog((prev) => ({ ...prev, loading: true, error: null }));

    try {
      if (type === "delete") {
        await deleteUser(user.user_id);
        toast.success("User Deleted", `${user.full_name || user.username} has been removed from the system.`);
      } else if (type === "toggle_status") {
        const newStatus = !user.is_active;
        await toggleUserStatus(user.user_id, newStatus);
        toast.success(
          "Status Updated",
          `${user.full_name || user.username} is now ${newStatus ? "active" : "inactive"}.`
        );
      }

      handleRefresh();
      setConfirmDialog({ isOpen: false, type: null, user: null, loading: false, error: null });
    } catch (err) {
      console.error(`Failed to ${type}:`, err);
      const errorMsg = err.response?.data?.message || `Failed to ${type === "delete" ? "delete" : "update"} user`;
      
      setConfirmDialog((prev) => ({ ...prev, error: errorMsg, loading: false }));
      toast.error(
        type === "delete" ? "Delete Failed" : "Update Failed",
        errorMsg
      );
    }
  };

  // ✅ ADDED: Close Confirm Dialog
  const handleCloseConfirm = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({ isOpen: false, type: null, user: null, loading: false, error: null });
  };

  const handleModalClose = (shouldRefresh = false, action = null, userName = null) => {
    setShowAddEditModal(false);
    setShowResetPasswordModal(false);
    setSelectedUser(null);
    
    if (shouldRefresh) {
      if (action === "created") {
        toast.success("User Created", `${userName || "New user"} has been added successfully.`);
      } else if (action === "updated") {
        toast.success("User Updated", `${userName || "User"} has been updated successfully.`);
      } else if (action === "deleted") {
        toast.success("User Deleted", `${userName || "User"} has been removed from the system.`);
      } else if (action === "password_reset") {
        toast.success("Password Reset", `Password for ${userName || "user"} has been reset successfully.`);
      } else if (action === "status_changed") {
        toast.success("Status Updated", `${userName || "User"} status has been changed.`);
      }
      
      handleRefresh();
    }
  };

  const handlePasswordResetSuccess = (userName) => {
    handleModalClose(true, "password_reset", userName);
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
            disabled={limits && !limits.can_add}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-md ${
              limits && !limits.can_add
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#000060] text-white hover:bg-[#000080]"
            }`}
            title={limits && !limits.can_add ? "User limit reached" : "Add new user"}
          >
            <Plus size={18} />
            Add User
          </motion.button>
        </div>
      </div>

      {/* Limit Banner */}
      {limits && <UserLimitBanner limits={limits} />}

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        branches={branches}
        showBranchFilter={isSuperAdmin}
      />

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
          onDelete={handleDeleteUser} // ✅ ADDED
          onToggleStatus={handleToggleStatus} // ✅ ADDED
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
          onSuccess={handlePasswordResetSuccess}
        />
      )}

      {/* ✅ ADDED: Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmAction}
        loading={confirmDialog.loading}
        title={
          confirmDialog.type === "delete"
            ? "Delete User?"
            : confirmDialog.user?.is_active
            ? "Deactivate User?"
            : "Activate User?"
        }
        message={
          confirmDialog.error ? (
            <span className="text-red-600">{confirmDialog.error}</span>
          ) : confirmDialog.type === "delete" ? (
            <>
              Are you sure you want to delete{" "}
              <strong>{confirmDialog.user?.full_name || confirmDialog.user?.username}</strong>?
              <br />
              <span className="text-sm text-red-600 font-medium mt-1 block">
                This action cannot be undone.
              </span>
            </>
          ) : (
            <>
              Are you sure you want to{" "}
              {confirmDialog.user?.is_active ? "deactivate" : "activate"}{" "}
              <strong>{confirmDialog.user?.full_name || confirmDialog.user?.username}</strong>?
            </>
          )
        }
        confirmText={
          confirmDialog.type === "delete"
            ? "Delete User"
            : confirmDialog.user?.is_active
            ? "Deactivate"
            : "Activate"
        }
        cancelText="Cancel"
        type={
          confirmDialog.type === "delete"
            ? "danger"
            : confirmDialog.user?.is_active
            ? "warning"
            : "success"
        }
      />
    </div>
  );
};

export default UsersPage;

// // src/pages/settings/UsersPage.jsx

// import { useState, useEffect, useCallback } from "react";
// import { motion } from "framer-motion";
// import {
//   Users,
//   Plus,
//   AlertCircle,
//   RefreshCw,
// } from "lucide-react";

// import { usePermission } from "../../../hooks/usePermission";
// import {
//   fetchUsers,
//   fetchUserLimits,
// } from "../../../api/users";
// import { fetchBranchesDropdown } from "../../../api/branches";

// // Components
// import UserLimitBanner from "./comps/UserLimitBanner";
// import UserFilters from "./comps/UserFilters";
// import UserListTable from "./comps/UserListTable";
// import AddEditUserModal from "./comps/AddEditUserModal";
// import ResetPasswordModal from "./comps/ResetPasswordModal";

// /**
//  * UsersPage
//  * Main user management page
//  * - SA: sees all users, can manage all
//  * - BA: sees only own branch users, can only manage staff
//  */
// const UsersPage = () => {
//   const { isSuperAdmin, isBranchAdmin, branchId } = usePermission();

//   // ============================================
//   // STATE
//   // ============================================
  
//   // Data
//   const [users, setUsers] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [limits, setLimits] = useState(null);
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 10,
//     total: 0,
//     total_pages: 0,
//   });

//   // Filters
//   const [filters, setFilters] = useState({
//     search: "",
//     branch_id: "",
//     role: "",
//     status: "active",
//   });

//   // Sorting
//   const [sortConfig, setSortConfig] = useState({
//     sort_by: "created_at",
//     sort_order: "desc",
//   });

//   // UI State
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [refreshKey, setRefreshKey] = useState(0);

//   // Modals
//   const [showAddEditModal, setShowAddEditModal] = useState(false);
//   const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);

//   // ============================================
//   // DATA FETCHING
//   // ============================================

//   // Fetch branches for filter dropdown (SA only)
//   const loadBranches = useCallback(async () => {
//     if (!isSuperAdmin) return;
    
//     try {
//       const response = await fetchBranchesDropdown();
//       if (response.success) {
//         setBranches(response.data.branches || []);
//       }
//     } catch (err) {
//       console.error("Failed to fetch branches:", err);
//     }
//   }, [isSuperAdmin]);

//   // Fetch user limits
//   const loadLimits = useCallback(async () => {
//     try {
//       const response = await fetchUserLimits();
//       if (response.success) {
//         setLimits(response.data);
//       }
//     } catch (err) {
//       console.error("Failed to fetch limits:", err);
//     }
//   }, []);

//   // Fetch users
//   const loadUsers = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const params = {
//         page: pagination.page,
//         limit: pagination.limit,
//         sort_by: sortConfig.sort_by,
//         sort_order: sortConfig.sort_order,
//       };

//       // Add filters
//       if (filters.search) params.search = filters.search;
//       if (filters.role) params.role = filters.role;
//       if (filters.status) params.status = filters.status;
      
//       // Branch filter (SA only, BA is auto-filtered by backend)
//       if (isSuperAdmin && filters.branch_id) {
//         params.branch_id = filters.branch_id;
//       }

//       const response = await fetchUsers(params);

//       if (response.success) {
//         setUsers(response.data.users || []);
//         setPagination((prev) => ({
//           ...prev,
//           total: response.data.pagination.total,
//           total_pages: response.data.pagination.total_pages,
//         }));
//       }
//     } catch (err) {
//       console.error("Failed to fetch users:", err);
//       setError("Failed to load users. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   }, [pagination.page, pagination.limit, sortConfig, filters, isSuperAdmin]);

//   // Initial load
//   useEffect(() => {
//     loadBranches();
//     loadLimits();
//   }, [loadBranches, loadLimits]);

//   // Load users on filter/page/sort change
//   useEffect(() => {
//     loadUsers();
//   }, [loadUsers, refreshKey]);

//   // ============================================
//   // HANDLERS
//   // ============================================

// const handleRefresh = () => {
//   window.location.reload();
// };


//   const handlePageChange = (newPage) => {
//     setPagination((prev) => ({ ...prev, page: newPage }));
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters((prev) => ({ ...prev, [key]: value }));
//     setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
//   };

//   const handleSortChange = (column) => {
//     setSortConfig((prev) => ({
//       sort_by: column,
//       sort_order: prev.sort_by === column && prev.sort_order === "asc" ? "desc" : "asc",
//     }));
//   };

//   const handleAddUser = () => {
//     setSelectedUser(null);
//     setShowAddEditModal(true);
//   };

//   const handleEditUser = (user) => {
//     setSelectedUser(user);
//     setShowAddEditModal(true);
//   };

//   const handleResetPassword = (user) => {
//     setSelectedUser(user);
//     setShowResetPasswordModal(true);
//   };

//   const handleModalClose = (shouldRefresh = false) => {
//     setShowAddEditModal(false);
//     setShowResetPasswordModal(false);
//     setSelectedUser(null);
    
//     if (shouldRefresh) {
//       handleRefresh();
//     }
//   };

//   // ============================================
//   // RENDER
//   // ============================================

//   return (
//     <div className="h-full flex flex-col gap-4 p-1">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-[#000060] flex items-center gap-2">
//             <Users size={24} />
//             User Management
//           </h1>
//           <p className="text-sm text-gray-500 mt-1">
//             {isSuperAdmin 
//               ? "Manage all users across branches" 
//               : "Manage staff members in your branch"
//             }
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           {/* Refresh Button */}
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={handleRefresh}
//             disabled={loading}
//             className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
//             title="Refresh"
//           >
//             <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
//           </motion.button>

//           {/* Add User Button */}
//           {limits?.can_add && (
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={handleAddUser}
//               className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg font-medium hover:bg-[#000080] transition-colors shadow-md"
//             >
//               <Plus size={18} />
//               Add User
//             </motion.button>
//           )}
//         </div>
//       </div>

//       {/* Limit Banner */}
//       {limits && (
//         <UserLimitBanner limits={limits} />
//       )}

//       {/* Filters */}
//       <UserFilters
//         filters={filters}
//         onFilterChange={handleFilterChange}
//         branches={branches}
//         showBranchFilter={isSuperAdmin}
//       />

//       {/* Error State */}
//       {error && (
//         <motion.div
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
//         >
//           <AlertCircle size={20} />
//           <span>{error}</span>
//           <button
//             onClick={handleRefresh}
//             className="ml-auto text-sm font-medium hover:underline"
//           >
//             Retry
//           </button>
//         </motion.div>
//       )}

//       {/* User Table */}
//       <div className="flex-1 min-h-0">
//         <UserListTable
//           users={users}
//           loading={loading}
//           pagination={pagination}
//           sortConfig={sortConfig}
//           onPageChange={handlePageChange}
//           onSortChange={handleSortChange}
//           onEdit={handleEditUser}
//           onResetPassword={handleResetPassword}
//           onRefresh={handleRefresh}
//           isSuperAdmin={isSuperAdmin}
//           isBranchAdmin={isBranchAdmin}
//           currentBranchId={branchId}
//         />
//       </div>

//       {/* Add/Edit Modal */}
//       {showAddEditModal && (
//         <AddEditUserModal
//           user={selectedUser}
//           branches={branches}
//           onClose={handleModalClose}
//           isSuperAdmin={isSuperAdmin}
//           currentBranchId={branchId}
//         />
//       )}

//       {/* Reset Password Modal */}
//       {showResetPasswordModal && selectedUser && (
//         <ResetPasswordModal
//           user={selectedUser}
//           onClose={handleModalClose}
//         />
//       )}
//     </div>
//   );
// };

// export default UsersPage;