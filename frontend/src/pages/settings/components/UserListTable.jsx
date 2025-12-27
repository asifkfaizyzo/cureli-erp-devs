// src/pages/settings/components/UserListTable.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  User,
  MoreVertical,
  Edit2,
  Key,
  UserX,
  UserCheck,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  Loader2,
  Users,
} from "lucide-react";

import { deleteUser, reactivateUser } from "../../../api/users";
import { formatRole, getRoleBadgeClasses, getStatusBadgeClasses } from "../../../api/users";

/**
 * ActionMenu Component - Rendered via Portal
 */
const ActionMenu = ({
  user,
  position,
  onClose,
  onEdit,
  onResetPassword,
  onDeactivate,
  onReactivate,
  canEdit,
  canResetPassword,
  canDeactivate,
  canReactivate,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!position) return null;

  const hasAnyAction = canEdit || canResetPassword || canDeactivate || canReactivate;

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Edit */}
      {canEdit && (
        <button
          onClick={() => {
            onClose();
            onEdit(user);
          }}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Edit2 size={14} />
          Edit User
        </button>
      )}

      {/* Reset Password */}
      {canResetPassword && (
        <button
          onClick={() => {
            onClose();
            onResetPassword(user);
          }}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Key size={14} />
          Reset Password
        </button>
      )}

      {/* Reactivate */}
      {canReactivate && (
        <>
          {(canEdit || canResetPassword) && <div className="border-t border-gray-100 my-1" />}
          <button
            onClick={() => {
              onClose();
              onReactivate(user);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <UserCheck size={14} />
            Reactivate
          </button>
        </>
      )}

      {/* Deactivate */}
      {canDeactivate && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              onClose();
              onDeactivate(user);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <UserX size={14} />
            Deactivate
          </button>
        </>
      )}

      {/* No actions available */}
      {!hasAnyAction && (
        <p className="px-4 py-2 text-sm text-gray-400 italic">
          No actions available
        </p>
      )}
    </motion.div>,
    document.body
  );
};

/**
 * UserListTable
 */
const UserListTable = ({
  users,
  loading,
  pagination,
  sortConfig,
  onPageChange,
  onSortChange,
  onEdit,
  onResetPassword,
  onRefresh,
  isSuperAdmin,
  isBranchAdmin,
  currentBranchId,
}) => {
  const [actionMenuState, setActionMenuState] = useState({
    userId: null,
    position: null,
  });
  const [processingUserId, setProcessingUserId] = useState(null);
  const actionButtonRefs = useRef({});

  // Permission checks
  const canEditUser = (user) => {
    if (isSuperAdmin) return true;
    if (isBranchAdmin) {
      return user.branch_id === currentBranchId && user.role === "staff";
    }
    return false;
  };

  const canResetPassword = (user) => {
    if (!user.is_active) return false; // Can't reset password for inactive user
    if (isSuperAdmin) return true;
    if (isBranchAdmin) {
      return user.branch_id === currentBranchId && user.role === "staff";
    }
    return false;
  };

  const canDeactivateUser = (user) => {
    return isSuperAdmin && user.is_active;
  };

  const canReactivateUser = (user) => {
    return isSuperAdmin && !user.is_active;
  };

  // Position calculation
  const calculateMenuPosition = useCallback((userId) => {
    const buttonEl = actionButtonRefs.current[userId];
    if (!buttonEl) return null;

    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = 150;
    const padding = 8;

    let top = rect.bottom + padding;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    return { top, left };
  }, []);

  const handleActionClick = (userId) => {
    if (actionMenuState.userId === userId) {
      setActionMenuState({ userId: null, position: null });
    } else {
      const position = calculateMenuPosition(userId);
      setActionMenuState({ userId, position });
    }
  };

  const handleCloseMenu = () => {
    setActionMenuState({ userId: null, position: null });
  };

  const handleDeactivate = async (user) => {
    if (!confirm(`Are you sure you want to deactivate "${user.full_name}"? They will no longer be able to log in.`)) {
      return;
    }

    setProcessingUserId(user.user_id);

    try {
      await deleteUser(user.user_id);
      onRefresh();
    } catch (err) {
      console.error("Failed to deactivate user:", err);
      alert(err.response?.data?.message || "Failed to deactivate user");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReactivate = async (user) => {
    if (!confirm(`Are you sure you want to reactivate "${user.full_name}"?`)) {
      return;
    }

    setProcessingUserId(user.user_id);

    try {
      await reactivateUser(user.user_id);
      onRefresh();
    } catch (err) {
      console.error("Failed to reactivate user:", err);
      alert(err.response?.data?.message || "Failed to reactivate user");
    } finally {
      setProcessingUserId(null);
    }
  };

  // Sort indicator
  const SortIndicator = ({ column }) => {
    if (sortConfig.sort_by !== column) {
      return <div className="w-4" />;
    }
    return sortConfig.sort_order === "asc" ? (
      <ChevronUp size={14} className="text-[#000060]" />
    ) : (
      <ChevronDown size={14} className="text-[#000060]" />
    );
  };

  const SortableHeader = ({ column, children, className = "" }) => (
    <th
      onClick={() => onSortChange(column)}
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIndicator column={column} />
      </div>
    </th>
  );

  if (loading && users.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (!loading && users.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col items-center gap-3 text-gray-500 py-12">
          <Users size={48} className="text-gray-300" />
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm">Try adjusting your filters or add a new user</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <SortableHeader column="full_name">User</SortableHeader>
              <SortableHeader column="role">Role</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <SortableHeader column="last_login_at">Last Login</SortableHeader>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              const RoleIcon = user.role === "branch_admin" ? Shield : User;
              const isProcessing = processingUserId === user.user_id;

              return (
                <motion.tr
                  key={user.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isProcessing ? 0.5 : 1 }}
                  className={`hover:bg-gray-50 transition-colors ${!user.is_active ? "bg-gray-50/50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.is_active ? "bg-[#000060]/10" : "bg-gray-200"
                      }`}>
                        <span className={`font-semibold text-sm ${
                          user.is_active ? "text-[#000060]" : "text-gray-400"
                        }`}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className={`font-medium ${user.is_active ? "text-gray-900" : "text-gray-500"}`}>
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClasses(user.role)}`}>
                      <RoleIcon size={12} />
                      {formatRole(user.role)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Building2 size={14} className="text-gray-400" />
                      {user.branch_name || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone size={12} className="text-gray-400" />
                        {user.phone_number}
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Mail size={12} className="text-gray-400" />
                          {user.email}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(user.is_active)}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Never"
                    }
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {isProcessing ? (
                        <Loader2 size={18} className="animate-spin text-gray-400" />
                      ) : (
                        <button
                          ref={(el) => (actionButtonRefs.current[user.user_id] = el)}
                          onClick={() => handleActionClick(user.user_id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} users
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="px-3 py-1 text-sm font-medium text-gray-700">
            Page {pagination.page} of {pagination.total_pages || 1}
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.total_pages}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Action Menu (Portal) */}
      <AnimatePresence>
        {actionMenuState.userId && (
          <ActionMenu
            user={users.find((u) => u.user_id === actionMenuState.userId)}
            position={actionMenuState.position}
            onClose={handleCloseMenu}
            onEdit={onEdit}
            onResetPassword={onResetPassword}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            canEdit={canEditUser(users.find((u) => u.user_id === actionMenuState.userId))}
            canResetPassword={canResetPassword(users.find((u) => u.user_id === actionMenuState.userId))}
            canDeactivate={canDeactivateUser(users.find((u) => u.user_id === actionMenuState.userId))}
            canReactivate={canReactivateUser(users.find((u) => u.user_id === actionMenuState.userId))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserListTable;