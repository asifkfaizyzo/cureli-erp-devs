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
  Ban,
  CheckCircle,
} from "lucide-react";

import { deleteUser, reactivateUser } from "../../../../api/users";
import { formatRole, getRoleBadgeClasses, getStatusBadgeClasses } from "../../../../api/users";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import Pagination from "../../../../components/common/Pagination";
import { TABLE_CONFIG } from "../../../../config/tableConfig";

// ============================================
// COLUMN CONFIGURATION
// ============================================
const COLUMNS = {
  user: { key: 'user', label: 'User', width: 180, sortable: true, align: 'left' },
  role: { key: 'role', label: 'Role', width: 200, sortable: true, align: 'left' },
  branch: { key: 'branch', label: 'Branch', width: 150, sortable: false, align: 'left' },
  contact: { key: 'contact', label: 'Contact', width: 180, sortable: false, align: 'left' },
  status: { key: 'status', label: 'Status', width: 120, sortable: false, align: 'center' },
  lastLogin: { key: 'last_login_at', label: 'Last Login', width: 100, sortable: true, align: 'left' },
  actions: { key: 'actions', label: 'Actions', width: 100, sortable: false, align: 'center' },
};

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
  toast,
}) => {
  const { styles, heights } = TABLE_CONFIG;
  
  const [actionMenuState, setActionMenuState] = useState({
    userId: null,
    position: null,
  });
  const [processingUserId, setProcessingUserId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null,
    user: null,
  });
  
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.values(COLUMNS).forEach(col => {
      widths[col.key] = col.width;
    });
    return widths;
  });
  const [resizing, setResizing] = useState(null);
  
  const actionButtonRefs = useRef({});

  // ============================================
  // COLUMN RESIZING HANDLERS
  // ============================================
  const handleMouseDown = (column, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = (e) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const newWidth = Math.max(50, resizing.startWidth + diff);
    setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
  };

  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing]);

  // ============================================
  // PERMISSION CHECKS
  // ============================================
  const canEditUser = (user) => {
    if (isSuperAdmin) return true;
    if (isBranchAdmin) {
      return user.branch_id === currentBranchId && user.role === "staff";
    }
    return false;
  };

  const canResetPassword = (user) => {
    if (!user.is_active) return false;
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

  // ============================================
  // MENU POSITION CALCULATION
  // ============================================
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

  // ============================================
  // ACTION HANDLERS
  // ============================================
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

  const handleDeactivateClick = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: 'deactivate',
      user,
    });
  };

  const handleReactivateClick = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: 'reactivate',
      user,
    });
  };

  const handleConfirmAction = async () => {
    const { type, user } = confirmDialog;
    setProcessingUserId(user.user_id);
    setConfirmDialog({ isOpen: false, type: null, user: null });

    try {
      if (type === 'deactivate') {
        await deleteUser(user.user_id);
        toast.success(
          "User Deactivated",
          `${user.full_name} has been deactivated and can no longer log in.`,
          4000
        );
      } else if (type === 'reactivate') {
        await reactivateUser(user.user_id);
        toast.success(
          "User Reactivated",
          `${user.full_name} has been reactivated and can now log in.`,
          4000
        );
      }
      onRefresh();
    } catch (err) {
      console.error(`Failed to ${type} user:`, err);
      const errorMessage = err.response?.data?.message || `Failed to ${type} user. Please try again.`;
      toast.error(
        `${type === 'deactivate' ? 'Deactivation' : 'Reactivation'} Failed`,
        errorMessage,
        5000
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog({ isOpen: false, type: null, user: null });
  };

  // ============================================
  // HEADER COMPONENTS
  // ============================================
  const SortableHeader = ({ column }) => {
    const config = COLUMNS[column];
    const isActive = sortConfig?.sort_by === config.key;
    const isAsc = isActive && sortConfig?.sort_order === "asc";
    const isDesc = isActive && sortConfig?.sort_order === "desc";

    return (
      <th
        style={{ width: columnWidths[column], minWidth: 50 }}
        className="relative group"
      >
        <div
          className={`flex items-center justify-between ${styles.header.cell} ${
            config.sortable ? "cursor-pointer select-none" : ""
          }`}
          onClick={() => config.sortable && onSortChange?.(config.key)}
        >
          <span>{config.label}</span>
          {config.sortable && (
            <div className="flex flex-col gap-0.5">
              <ChevronUp
                size={12}
                className={`transition-colors ${
                  isAsc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive
                }`}
              />
              <ChevronDown
                size={12}
                className={`-mt-1 transition-colors ${
                  isDesc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive
                }`}
              />
            </div>
          )}
        </div>
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  const TableHeader = ({ column }) => {
    const config = COLUMNS[column];
    
    if (config.sortable) {
      return <SortableHeader column={column} />;
    }

    return (
      <th
        style={{ width: columnWidths[column], minWidth: 50 }}
        className={`relative group ${config.align === 'center' ? 'text-center' : ''}`}
      >
        <div className={styles.header.cell}>
          {config.label}
        </div>
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  // ============================================
  // STATUS BADGE COMPONENT
  // ============================================
  const StatusBadge = ({ isActive }) => {
    if (isActive) {
      return (
        <span className={styles.badges.status.active}>
          <CheckCircle size={12} />
          Active
        </span>
      );
    }
    return (
      <span className={styles.badges.status.inactive}>
        <Ban size={12} />
        Inactive
      </span>
    );
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const hasData = users.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <div className={styles.container.wrapper}>
        {/* Table - Show when loading OR has data */}
        {showTable && (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: "900px" }}>
              {/* Table Header */}
              <thead className="sticky top-0 z-10">
                <tr className={styles.header.row}>
                  <SortableHeader column="user" />
                  <SortableHeader column="role" />
                  <TableHeader column="branch" />
                  <TableHeader column="contact" />
                  <TableHeader column="status" />
                  <SortableHeader column="lastLogin" />
                  <TableHeader column="actions" />
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {loading ? (
                  // Skeleton Loading Rows
                  <TableSkeleton
                    rows={pagination.limit}
                    columns={Object.keys(COLUMNS).filter(k => k !== 'actions')}
                  />
                ) : (
                  // Actual Data Rows
                  users.map((user, index) => {
                    const RoleIcon = user.role === "branch_admin" ? Shield : User;
                    const isProcessing = processingUserId === user.user_id;

                    return (
                      <tr
                        key={user.user_id ?? index}
                        className={`${styles.row.base} ${
                          index % 2 === 0 ? styles.row.even : styles.row.odd
                        } ${styles.row.hover} ${!user.is_active ? styles.row.disabled : ''}`}
                        style={{ height: `${heights.bodyRow}px` }}
                      >
                        {/* User */}
                        <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              user.is_active ? "bg-[#05015A]/10" : "bg-gray-200"
                            }`}>
                              <span className={`font-semibold text-sm ${
                                user.is_active ? "text-[#05015A]" : "text-gray-400"
                              }`}>
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className={`font-medium ${!user.is_active ? 'text-gray-500' : ''}`}>
                                {user.full_name}
                                {!user.is_active && (
                                  <Ban size={14} className="inline-block ml-2 text-red-400" />
                                )}
                              </p>
                              <p className={`text-xs ${styles.cell.muted}`}>@{user.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className={`${styles.cell.base}`}>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClasses(user.role)}`}>
                            <RoleIcon size={12} />
                            {formatRole(user.role)}
                          </span>
                        </td>

                        {/* Branch */}
                        <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                          <div className="flex items-center gap-1">
                            <Building2 size={14} className="text-gray-400" />
                            {user.branch_name || "—"}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                          <div className="flex flex-col gap-0.5 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone size={12} className="text-gray-400" />
                              {user.phone_number}
                            </div>
                            {user.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail size={12} className="text-gray-400" />
                                {user.email}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <StatusBadge isActive={user.is_active} />
                        </td>

                        {/* Last Login */}
                        <td className={`${styles.cell.base} ${styles.cell.muted}`}>
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Never"
                          }
                        </td>

                        {/* Actions */}
                        <td className={`${styles.cell.base}`}>
                          <div className={styles.actions.container}>
                            {isProcessing ? (
                              <Loader2 size={15} className="animate-spin text-gray-400" />
                            ) : (
                              <button
                                ref={(el) => (actionButtonRefs.current[user.user_id] = el)}
                                onClick={() => handleActionClick(user.user_id)}
                                className={`${styles.actions.button.base} ${styles.actions.button.view}`}
                                title="Actions"
                              >
                                <MoreVertical size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <TableEmptyState
            icon={Users}
            title="No users found"
            subtitle="Try adjusting your filters or add a new user"
          />
        )}

        {/* Pagination */}
        {showPagination && (
          <Pagination
            currentPage={pagination.page}
            setCurrentPage={onPageChange}
            totalItems={pagination.total}
            rowsPerPage={pagination.limit}
          />
        )}

        {/* Action Menu (Portal) */}
        <AnimatePresence>
          {actionMenuState.userId && (
            <ActionMenu
              user={users.find((u) => u.user_id === actionMenuState.userId)}
              position={actionMenuState.position}
              onClose={handleCloseMenu}
              onEdit={onEdit}
              onResetPassword={onResetPassword}
              onDeactivate={handleDeactivateClick}
              onReactivate={handleReactivateClick}
              canEdit={canEditUser(users.find((u) => u.user_id === actionMenuState.userId))}
              canResetPassword={canResetPassword(users.find((u) => u.user_id === actionMenuState.userId))}
              canDeactivate={canDeactivateUser(users.find((u) => u.user_id === actionMenuState.userId))}
              canReactivate={canReactivateUser(users.find((u) => u.user_id === actionMenuState.userId))}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title={confirmDialog.type === 'deactivate' ? 'Deactivate User?' : 'Reactivate User?'}
        message={
          confirmDialog.type === 'deactivate'
            ? `Are you sure you want to deactivate "${confirmDialog.user?.full_name}"? They will no longer be able to log in to the system.`
            : `Are you sure you want to reactivate "${confirmDialog.user?.full_name}"? They will regain access to the system.`
        }
        confirmText={confirmDialog.type === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        cancelText="Cancel"
        type={confirmDialog.type === 'deactivate' ? 'danger' : 'success'}
        loading={processingUserId === confirmDialog.user?.user_id}
      />
    </>
  );
};

export default UserListTable;