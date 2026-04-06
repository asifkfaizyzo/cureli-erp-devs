// cureli-admin/src/pages/Cadmin-management/comps/AdminTable.jsx

import { useEffect, useState, useCallback } from "react";
import {
  Ban,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  UserCog,
} from "lucide-react";
import { 
  TABLE_CONFIG, 
  getClickableRowClass, // ✅ Changed from getRowBgClass
  getRoleBadgeStyle 
} from "../../../config/tableConfig";
import TableSkeleton from "../../../components/common/TableSkeleton";
import TableEmptyState from "../../../components/common/TableEmptyState";
import Pagination from "../../../components/common/Pagination";
import AdminDetailsModal from "./AdminDetailsModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { toggleAdminAccess } from "../../../api/cadminAdmins";

// ✅ Define COLUMNS configuration - Reduced actions width
const COLUMNS = {
  slNo: { key: 'slNo', label: '#', width: 50, sortable: false, align: 'left' },
  name: { key: 'name', label: 'Name', width: 160, sortable: true, align: 'left' },
  username: { key: 'username', label: 'Username', width: 120, sortable: false, align: 'left' },
  contact: { key: 'contact', label: 'Contact', width: 180, sortable: false, align: 'left' },
  role: { key: 'role', label: 'Role', width: 110, sortable: true, align: 'center' },
  status: { key: 'status', label: 'Status', width: 100, sortable: false, align: 'center' },
  lastLogin: { key: 'last_login_at', label: 'Last Login', width: 110, sortable: true, align: 'left' },
  actions: { key: 'actions', label: 'Actions', width: 60, sortable: false, align: 'center' }, // ✅ Reduced from 90
};

const AdminTable = ({
  admins = [],
  loading = false,
  currentPage,
  setCurrentPage,
  rowsPerPage = 10,
  totalItems = 0,
  sortConfig,
  onSortChange,
  onAdminUpdate,
  onRefresh,
}) => {
  const { styles, heights } = TABLE_CONFIG;
  const startIndex = (currentPage - 1) * rowsPerPage;

  // Column widths for resizing
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.entries(COLUMNS).forEach(([key, col]) => {
      widths[key] = col.width;
    });
    return widths;
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    if (column === "slNo") return;
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
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
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  // Modal states
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

  // Suspend/Activate confirmation
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState(null);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const hasData = admins.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  // ============================================
  // ROW CLICK HANDLER (Opens View Modal)
  // ============================================
  const handleRowClick = (admin) => {
    setSelectedAdminId(admin.id);
    setModalMode("view");
    setIsModalOpen(true);
  };

  // ============================================
  // ACTION HANDLERS (Must stop propagation!)
  // ============================================
  const handleToggleClick = (e, admin) => {
    e.stopPropagation(); // ⚠️ CRITICAL: Prevent row click
    setAdminToToggle(admin);
    setShowStatusConfirm(true);
  };

  const handleToggleStatus = async () => {
    if (!adminToToggle) return;

    setToggleLoading(true);
    setToggleError(null);

    try {
      const newIsActive = adminToToggle.status !== "Active";
      await toggleAdminAccess(adminToToggle.id, newIsActive);

      onAdminUpdate(adminToToggle.id, {
        status: newIsActive ? "Active" : "Inactive",
      });

      setShowStatusConfirm(false);
      setAdminToToggle(null);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      setToggleError(err.response?.data?.message || "Failed to update status");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleModalClose = (wasUpdated) => {
    setIsModalOpen(false);
    setSelectedAdminId(null);
    if (wasUpdated) {
      onRefresh?.();
    }
  };

  const handleCloseStatusConfirm = () => {
    setShowStatusConfirm(false);
    setAdminToToggle(null);
    setToggleError(null);
  };

  // ============================================
  // BADGE COMPONENTS
  // ============================================
  const getStatusBadge = (status) => {
    const isActive = status === "Active";
    return (
      <span className={isActive ? styles.badges.status.active : styles.badges.status.inactive}>
        {isActive ? <CheckCircle size={12} /> : <Ban size={12} />}
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    return <span className={getRoleBadgeStyle(role)}>{role}</span>;
  };

  // ============================================
  // SORTABLE HEADER COMPONENT
  // ============================================
  const SortableHeader = ({ column }) => {
    const config = COLUMNS[column];
    
    // Map frontend column to backend field for comparison
    const columnToBackendMap = {
      'name': 'name',
      'role': 'role',
      'lastLogin': 'last_login_at',
    };
    
    const backendColumn = columnToBackendMap[column] || column;
    const isActive = sortConfig?.sortBy === backendColumn;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th
        style={{ width: columnWidths[column], height: `${heights.headerRow}px` }}
        className="relative group"
      >
        <div
          className={`flex items-center justify-between ${styles.header.cell} cursor-pointer select-none`}
          onClick={() => config.sortable && onSortChange?.(column)}
        >
          <span>{config.label}</span>
          {config.sortable && (
            <div className="flex flex-col gap-0.5">
              <ChevronUp
                size={12}
                className={isAsc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive}
              />
              <ChevronDown
                size={12}
                className={`-mt-1 ${isDesc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive}`}
              />
            </div>
          )}
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  // ============================================
  // NON-SORTABLE HEADER COMPONENT
  // ============================================
  const TableHeader = ({ column }) => {
    const config = COLUMNS[column];

    if (config.sortable) {
      return <SortableHeader column={column} />;
    }

    return (
      <th
        style={{ width: columnWidths[column], height: `${heights.headerRow}px` }}
        className={`relative group ${config.align === 'center' ? 'text-center' : ''}`}
      >
        <div className={styles.header.cell}>{config.label}</div>
        {column !== 'slNo' && (
          <div
            onMouseDown={(e) => handleMouseDown(column, e)}
            className={styles.header.resizeHandle}
          />
        )}
      </th>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.container.wrapper}>
      {/* Table - Show when loading OR has data */}
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "800px" }}>
            {/* Table Header */}
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                <TableHeader column="slNo" />
                <SortableHeader column="name" />
                <TableHeader column="username" />
                <TableHeader column="contact" />
                <SortableHeader column="role" />
                <TableHeader column="status" />
                <SortableHeader column="lastLogin" />
                <TableHeader column="actions" />
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                <TableSkeleton columns={8} rows={rowsPerPage} />
              ) : (
                admins.map((admin, index) => (
                  <tr
                    key={admin.id}
                    onClick={() => handleRowClick(admin)} // 👈 Row click opens view modal
                    style={{ height: `${heights.bodyRow}px` }}
                    className={getClickableRowClass(index, admin.status !== "Active")} // ✅ Changed
                  >
                    {/* Serial Number */}
                    <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                      {startIndex + index + 1}
                    </td>

                    {/* Name */}
                    <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                      <div className="flex items-center gap-2">
                        {admin.name}
                        {admin.status !== "Active" && (
                          <Ban size={14} className="text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    </td>

                    {/* Username */}
                    <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        @{admin.username}
                      </span>
                    </td>

                    {/* Contact (Phone + Email) */}
                    <td className={styles.cell.base}>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-sm ${styles.cell.primary}`}>{admin.phone}</span>
                        <span className={`text-xs ${styles.cell.muted} truncate max-w-[160px]`} title={admin.email}>
                          {admin.email}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      {getRoleBadge(admin.role)}
                    </td>

                    {/* Status */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      {getStatusBadge(admin.status)}
                    </td>

                    {/* Last Login */}
                    <td className={`${styles.cell.base} ${styles.cell.muted}`}>
                      {admin.lastLogin || "Never"}
                    </td>

                    {/* Actions - ONLY Suspend/Activate Button */}
                    <td className={styles.cell.base}>
                      <div className={styles.actions.container}>
                        {/* Suspend/Activate Button */}
                        <button
                          onClick={(e) => handleToggleClick(e, admin)}
                          className={`${styles.actions.button.base} ${
                            admin.status === "Active"
                              ? styles.actions.button.suspend
                              : styles.actions.button.activate
                          }`}
                          title={admin.status === "Active" ? "Suspend Admin" : "Activate Admin"}
                        >
                          {admin.status === "Active" ? <Ban size={15} /> : <CheckCircle size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {showEmptyState && (
        <TableEmptyState
          icon={UserCog}
          title="No admins found"
          subtitle="Try adjusting your search or filters"
        />
      )}

      {/* Pagination - only when has data */}
      {showPagination && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}

      {/* Admin Details Modal */}
      {isModalOpen && selectedAdminId && (
        <AdminDetailsModal
          isOpen={isModalOpen}
          adminId={selectedAdminId}
          mode={modalMode}
          onClose={handleModalClose}
          onAdminUpdate={onAdminUpdate}
        />
      )}

      {/* Suspend/Activate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={handleCloseStatusConfirm}
        onConfirm={handleToggleStatus}
        loading={toggleLoading}
        title={
          adminToToggle?.status === "Active"
            ? "Suspend Admin?"
            : "Activate Admin?"
        }
        message={
          toggleError ? (
            <span className="text-red-600">{toggleError}</span>
          ) : (
            `Are you sure you want to ${
              adminToToggle?.status === "Active" ? "suspend" : "activate"
            } "${adminToToggle?.name}"?`
          )
        }
        confirmText={
          adminToToggle?.status === "Active" ? "Suspend" : "Activate"
        }
        type={adminToToggle?.status === "Active" ? "warning" : "success"}
      />
    </div>
  );
};

export default AdminTable;
