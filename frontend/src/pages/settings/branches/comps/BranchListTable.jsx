// src/pages/settings/branches/comps/BranchListTable.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { deleteBranch, reactivateBranch } from "../../../../api/branches";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import { TABLE_CONFIG } from "../../../../config/tableConfig";

// ============================================
// COLUMN CONFIGURATION - SAME PATTERN AS UserListTable
// ============================================
const COLUMNS = {
  branch: { key: "branch", sortKey: "branch_name", label: "Branch", width: 200, sortable: true, align: "left" },
  address: { key: "address", sortKey: "city", label: "Address", width: 220, sortable: true, align: "left" },
  contact: { key: "contact", sortKey: null, label: "Contact", width: 140, sortable: false, align: "left" },
  users: { key: "users", sortKey: "user_count", label: "Users", width: 80, sortable: true, align: "center" },
  status: { key: "status", sortKey: "is_active", label: "Status", width: 100, sortable: true, align: "center" },
  actions: { key: "actions", sortKey: null, label: "Actions", width: 80, sortable: false, align: "center" },
};

/**
 * ActionMenu Component - Rendered via Portal
 */
const ActionMenu = ({ branch, position, onClose, onEdit, onDeactivate, onReactivate }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
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
      style={{ top: position.top, left: position.left }}
    >
      <button
        onClick={() => { onClose(); onEdit(branch); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Edit2 size={14} />
        Edit Branch
      </button>

      {!branch.is_active && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onClose(); onReactivate(branch); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Power size={14} />
            Reactivate
          </button>
        </>
      )}

      {!branch.is_main && branch.is_active && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onClose(); onDeactivate(branch); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Deactivate
          </button>
        </>
      )}

      {branch.is_main && branch.is_active && (
        <p className="px-4 py-2 text-xs text-gray-400 italic">Main branch cannot be deactivated</p>
      )}
    </motion.div>,
    document.body
  );
};

/**
 * BranchListTable - MATCHES UserListTable pattern exactly
 */
const BranchListTable = ({
  branches,
  loading,
  rowsPerPage,
  sortConfig,
  onSortChange,
  onEdit,
  onRefresh,
  toast,
}) => {
  const { styles, heights } = TABLE_CONFIG;

  // Menu state
  const [actionMenuState, setActionMenuState] = useState({ branchId: null, position: null });
  const [processingBranchId, setProcessingBranchId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, branch: null });

  // Column resizing - SAME AS UserListTable
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.values(COLUMNS).forEach((col) => {
      widths[col.key] = col.width;
    });
    return widths;
  });
  const [resizing, setResizing] = useState(null);

  const actionButtonRefs = useRef({});

  // ============================================
  // COLUMN RESIZING - SAME AS UserListTable
  // ============================================
  const handleMouseDown = (column, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    },
    [resizing]
  );

  const handleMouseUp = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

  // ============================================
  // MENU POSITION
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

    if (top + menuHeight > window.innerHeight) top = rect.top - menuHeight - padding;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;

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

  const handleCloseMenu = () => setActionMenuState({ branchId: null, position: null });

  const handleDeactivateClick = (branch) => {
    if (branch.is_main) {
      toast.warning("Cannot Deactivate", "Main branch cannot be deactivated.", 4000);
      return;
    }
    setConfirmDialog({ isOpen: true, type: "deactivate", branch });
  };

  const handleReactivateClick = (branch) => {
    setConfirmDialog({ isOpen: true, type: "reactivate", branch });
  };

  const handleConfirmAction = async () => {
    const { type, branch } = confirmDialog;
    setProcessingBranchId(branch.branch_id);
    setConfirmDialog({ isOpen: false, type: null, branch: null });

    try {
      if (type === "deactivate") {
        await deleteBranch(branch.branch_id);
        toast.success("Branch Deactivated", `${branch.branch_name} deactivated.`, 4000);
      } else if (type === "reactivate") {
        await reactivateBranch(branch.branch_id);
        toast.success("Branch Reactivated", `${branch.branch_name} reactivated.`, 4000);
      }
      onRefresh();
    } catch (err) {
      console.error(`Failed to ${type} branch:`, err);
      const errorMessage = err.response?.data?.message || `Failed to ${type} branch.`;
      toast.error(`${type === "deactivate" ? "Deactivation" : "Reactivation"} Failed`, errorMessage, 5000);
    } finally {
      setProcessingBranchId(null);
    }
  };

  // ============================================
  // HELPER
  // ============================================
  const formatAddress = (branch) => {
    const parts = [branch.address_line_1, branch.city, branch.state, branch.pincode].filter(Boolean);
    return parts.join(", ") || "No address";
  };

  // ============================================
  // SORTABLE HEADER - SAME AS UserListTable
  // ============================================
  const SortableHeader = ({ columnKey }) => {
    const config = COLUMNS[columnKey];
    const sortKey = config.sortKey || config.key;
    const isActive = sortConfig?.sort_by === sortKey;
    const isAsc = isActive && sortConfig?.sort_order === "asc";
    const isDesc = isActive && sortConfig?.sort_order === "desc";

    return (
      <th style={{ width: columnWidths[columnKey], minWidth: 50 }} className="relative group">
        <div
          className={`flex items-center justify-between ${styles.header.cell} ${
            config.sortable ? "cursor-pointer select-none" : ""
          }`}
          onClick={() => config.sortable && onSortChange?.(sortKey)}
        >
          <span className="truncate">{config.label}</span>
          {config.sortable && (
            <div className="flex flex-col gap-0.5">
              <ChevronUp
                size={12}
                className={`transition-colors ${isAsc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive}`}
              />
              <ChevronDown
                size={12}
                className={`-mt-1 transition-colors ${isDesc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive}`}
              />
            </div>
          )}
        </div>
        {/* Resize Handle */}
        <div onMouseDown={(e) => handleMouseDown(columnKey, e)} className={styles.header.resizeHandle} />
      </th>
    );
  };

  // ============================================
  // TABLE HEADER - SAME AS UserListTable
  // ============================================
  const TableHeader = ({ columnKey }) => {
    const config = COLUMNS[columnKey];

    if (config.sortable) {
      return <SortableHeader columnKey={columnKey} />;
    }

    return (
      <th
        style={{ width: columnWidths[columnKey], minWidth: 50 }}
        className={`relative group ${config.align === "center" ? "text-center" : ""}`}
      >
        <div className={styles.header.cell}>
          <span className="truncate">{config.label}</span>
        </div>
        <div onMouseDown={(e) => handleMouseDown(columnKey, e)} className={styles.header.resizeHandle} />
      </th>
    );
  };

  // ============================================
  // STATUS BADGE
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
        {showTable && (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: "820px" }}>
              {/* Header */}
              <thead className="sticky top-0 z-10">
                <tr className={styles.header.row}>
                  <SortableHeader columnKey="branch" />
                  <SortableHeader columnKey="address" />
                  <TableHeader columnKey="contact" />
                  <SortableHeader columnKey="users" />
                  <SortableHeader columnKey="status" />
                  <TableHeader columnKey="actions" />
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {loading ? (
                  <TableSkeleton rows={rowsPerPage} columns={Object.keys(COLUMNS).filter((k) => k !== "actions")} />
                ) : (
                  branches.map((branch, index) => {
                    const isProcessing = processingBranchId === branch.branch_id;

                    return (
                      <tr
                        key={branch.branch_id ?? index}
                        className={`${styles.row.base} ${index % 2 === 0 ? styles.row.even : styles.row.odd} ${
                          styles.row.hover
                        } ${!branch.is_active ? styles.row.disabled : ""}`}
                        style={{ height: `${heights.bodyRow}px` }}
                      >
                        {/* Branch */}
                        <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                !branch.is_active
                                  ? "bg-gray-200"
                                  : branch.is_main
                                  ? "bg-emerald-100"
                                  : "bg-[#000060]/10"
                              }`}
                            >
                              <Building2
                                size={18}
                                className={
                                  !branch.is_active
                                    ? "text-gray-400"
                                    : branch.is_main
                                    ? "text-emerald-600"
                                    : "text-[#000060]"
                                }
                              />
                            </div>
                            <div className="min-w-0">
                              <p className={`font-medium truncate ${!branch.is_active ? "text-gray-500" : ""}`}>
                                {branch.branch_name}
                                {!branch.is_active && <Ban size={14} className="inline-block ml-2 text-red-400" />}
                              </p>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  branch.is_main ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {branch.is_main ? "Main" : "Branch"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Address */}
                        <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate" title={formatAddress(branch)}>
                              {formatAddress(branch)}
                            </span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                          {branch.contact_number ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Phone size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{branch.contact_number}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Users */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <div className="inline-flex items-center gap-1 justify-center">
                            <Users size={14} className="text-gray-400" />
                            <span className={styles.cell.muted}>{branch.user_count || 0}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <StatusBadge isActive={branch.is_active} />
                        </td>

                        {/* Actions */}
                        <td className={styles.cell.base}>
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
          <TableEmptyState icon={Building2} title="No branches found" subtitle="Create your first branch to get started" />
        )}

        {/* Action Menu Portal */}
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
        onClose={() => setConfirmDialog({ isOpen: false, type: null, branch: null })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.type === "deactivate" ? "Deactivate Branch?" : "Reactivate Branch?"}
        message={
          confirmDialog.type === "deactivate" ? (
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
        confirmText={confirmDialog.type === "deactivate" ? "Deactivate" : "Reactivate"}
        cancelText="Cancel"
        type={confirmDialog.type === "deactivate" ? "danger" : "success"}
        loading={processingBranchId === confirmDialog.branch?.branch_id}
      />
    </>
  );
};

export default BranchListTable;