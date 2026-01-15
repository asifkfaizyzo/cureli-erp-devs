// src/pages/settings/components/BranchListTable.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  MapPin,
  Phone,
  Users,
  Loader2,
  CheckCircle,
  Ban,
} from "lucide-react";

import { deleteBranch, reactivateBranch } from "../../../../api/branches";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import { TABLE_CONFIG } from "../../../../config/tableConfig";

// ============================================
// COLUMN CONFIGURATION
// ============================================
const COLUMNS = {
  branch: { key: 'branch', label: 'Branch', width: 200, sortable: false, align: 'left' },
  address: { key: 'address', label: 'Address', width: 220, sortable: false, align: 'left' },
  contact: { key: 'contact', label: 'Contact', width: 150, sortable: false, align: 'left' },
  users: { key: 'users', label: 'Users', width: 80, sortable: false, align: 'center' },
  status: { key: 'status', label: 'Status', width: 100, sortable: false, align: 'center' },
  actions: { key: 'actions', label: 'Actions', width: 80, sortable: false, align: 'center' },
};

/**
 * ActionMenu Component
 */
const ActionMenu = ({
  branch,
  position,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
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

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Edit */}
      <button
        onClick={() => {
          onClose();
          onEdit(branch);
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Edit2 size={14} />
        Edit Branch
      </button>

      {/* Reactivate (for inactive branches) */}
      {!branch.is_active && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              onClose();
              onReactivate(branch);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Power size={14} />
            Reactivate
          </button>
        </>
      )}

      {/* Deactivate (not for main branch, only for active) */}
      {!branch.is_main && branch.is_active && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              onClose();
              onDeactivate(branch);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Deactivate
          </button>
        </>
      )}

      {/* Info for main branch */}
      {branch.is_main && branch.is_active && (
        <p className="px-4 py-2 text-xs text-gray-400 italic">
          Main branch cannot be deactivated
        </p>
      )}
    </motion.div>,
    document.body
  );
};

/**
 * BranchListTable
 */
const BranchListTable = ({
  branches,
  loading,
  onEdit,
  onRefresh,
  toast,
}) => {
  const { styles, heights } = TABLE_CONFIG;

  const [actionMenuState, setActionMenuState] = useState({
    branchId: null,
    position: null,
  });
  const [processingBranchId, setProcessingBranchId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null,
    branch: null,
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
  // MENU POSITION CALCULATION
  // ============================================
  const calculateMenuPosition = useCallback((branchId) => {
    const buttonEl = actionButtonRefs.current[branchId];
    if (!buttonEl) return null;

    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 120;
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
  const handleActionClick = (branchId) => {
    if (actionMenuState.branchId === branchId) {
      setActionMenuState({ branchId: null, position: null });
    } else {
      const position = calculateMenuPosition(branchId);
      setActionMenuState({ branchId, position });
    }
  };

  const handleCloseMenu = () => {
    setActionMenuState({ branchId: null, position: null });
  };

  const handleDeactivateClick = (branch) => {
    if (branch.is_main) {
      toast.warning(
        "Cannot Deactivate",
        "Main branch cannot be deactivated.",
        4000
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'deactivate',
      branch,
    });
  };

  const handleReactivateClick = (branch) => {
    setConfirmDialog({
      isOpen: true,
      type: 'reactivate',
      branch,
    });
  };

  const handleConfirmAction = async () => {
    const { type, branch } = confirmDialog;
    setProcessingBranchId(branch.branch_id);
    setConfirmDialog({ isOpen: false, type: null, branch: null });

    try {
      if (type === 'deactivate') {
        await deleteBranch(branch.branch_id);
        toast.success(
          "Branch Deactivated",
          `${branch.branch_name} has been deactivated successfully.`,
          4000
        );
      } else if (type === 'reactivate') {
        await reactivateBranch(branch.branch_id);
        toast.success(
          "Branch Reactivated",
          `${branch.branch_name} has been reactivated successfully.`,
          4000
        );
      }
      onRefresh();
    } catch (err) {
      console.error(`Failed to ${type} branch:`, err);
      const errorMessage = err.response?.data?.message || `Failed to ${type} branch. Please try again.`;
      toast.error(
        `${type === 'deactivate' ? 'Deactivation' : 'Reactivation'} Failed`,
        errorMessage,
        5000
      );
    } finally {
      setProcessingBranchId(null);
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog({ isOpen: false, type: null, branch: null });
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const formatAddress = (branch) => {
    const parts = [
      branch.address_line_1,
      branch.city,
      branch.state,
      branch.pincode,
    ].filter(Boolean);
    return parts.join(", ") || "No address";
  };

  // ============================================
  // HEADER COMPONENT
  // ============================================
  const TableHeader = ({ column }) => {
    const config = COLUMNS[column];

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
  const hasData = branches.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <div className={styles.container.wrapper}>
        {/* Table - Show when loading OR has data */}
        {showTable && (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: "800px" }}>
              {/* Table Header */}
              <thead className="sticky top-0 z-10">
                <tr className={styles.header.row}>
                  <TableHeader column="branch" />
                  <TableHeader column="address" />
                  <TableHeader column="contact" />
                  <TableHeader column="users" />
                  <TableHeader column="status" />
                  <TableHeader column="actions" />
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {loading ? (
                  // Skeleton Loading Rows
                  <TableSkeleton
                    rows={10}
                    columns={Object.keys(COLUMNS).filter(k => k !== 'actions')}
                  />
                ) : (
                  // Actual Data Rows
                  branches.map((branch, index) => {
                    const isProcessing = processingBranchId === branch.branch_id;

                    return (
                      <tr
                        key={branch.branch_id ?? index}
                        className={`${styles.row.base} ${
                          index % 2 === 0 ? styles.row.even : styles.row.odd
                        } ${styles.row.hover} ${!branch.is_active ? styles.row.disabled : ''}`}
                        style={{ height: `${heights.bodyRow}px` }}
                      >
                        {/* Branch Info */}
                        <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              !branch.is_active
                                ? "bg-gray-200"
                                : branch.is_main
                                ? "bg-emerald-100"
                                : "bg-[#05015A]/10"
                            }`}>
                              <Building2 size={20} className={
                                !branch.is_active
                                  ? "text-gray-400"
                                  : branch.is_main
                                  ? "text-emerald-600"
                                  : "text-[#05015A]"
                              } />
                            </div>
                            <div>
                              <p className={`font-medium ${!branch.is_active ? 'text-gray-500' : ''}`}>
                                {branch.branch_name}
                                {!branch.is_active && (
                                  <Ban size={14} className="inline-block ml-2 text-red-400" />
                                )}
                              </p>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                branch.is_main
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {branch.is_main ? "Main" : "Branch"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Address */}
                        <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                          <div className="flex items-start gap-1.5">
                            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{formatAddress(branch)}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                          {branch.contact_number ? (
                            <div className="flex items-center gap-1.5">
                              <Phone size={14} className="text-gray-400" />
                              {branch.contact_number}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* User Count */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <div className="inline-flex items-center gap-1">
                            <Users size={14} className="text-gray-400" />
                            <span className={styles.cell.muted}>{branch.user_count || 0}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <StatusBadge isActive={branch.is_active} />
                        </td>

                        {/* Actions */}
                        <td className={`${styles.cell.base}`}>
                          <div className={styles.actions.container}>
                            {isProcessing ? (
                              <Loader2 size={15} className="animate-spin text-gray-400" />
                            ) : (
                              <button
                                ref={(el) => (actionButtonRefs.current[branch.branch_id] = el)}
                                onClick={() => handleActionClick(branch.branch_id)}
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
            icon={Building2}
            title="No branches found"
            subtitle="Create your first branch to get started"
          />
        )}

        {/* Action Menu (Portal) */}
        <AnimatePresence>
          {actionMenuState.branchId && (
            <ActionMenu
              branch={branches.find((b) => b.branch_id === actionMenuState.branchId)}
              position={actionMenuState.position}
              onClose={handleCloseMenu}
              onEdit={onEdit}
              onDeactivate={handleDeactivateClick}
              onReactivate={handleReactivateClick}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title={confirmDialog.type === 'deactivate' ? 'Deactivate Branch?' : 'Reactivate Branch?'}
        message={
          confirmDialog.type === 'deactivate' ? (
            <>
              Are you sure you want to deactivate <strong>{confirmDialog.branch?.branch_name}</strong>?
              <span className="text-sm block mt-2 text-amber-600 font-medium">
                All users in this branch will be moved to the main branch.
              </span>
            </>
          ) : (
            <>
              Are you sure you want to reactivate <strong>{confirmDialog.branch?.branch_name}</strong>?
            </>
          )
        }
        confirmText={confirmDialog.type === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        cancelText="Cancel"
        type={confirmDialog.type === 'deactivate' ? 'danger' : 'success'}
        loading={processingBranchId === confirmDialog.branch?.branch_id}
      />
    </>
  );
};

export default BranchListTable;