// cureli-admin/src/components/Admins/AdminTable.jsx

import { useEffect, useState } from "react";
import {
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  Users,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import AdminDetailsModal from "./AdminDetailsModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { toggleAdminAccess } from "../../../api/cadminAdmins";

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
  const startIndex = (currentPage - 1) * rowsPerPage;

  // Column widths - 8 columns like UserTable
  const [columnWidths, setColumnWidths] = useState({
    slNo: 50,
    name: 160,
    username: 120,
    contact: 180,
    role: 110,
    status: 100,
    lastLogin: 110,
    actions: 90,
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    e.preventDefault();
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

  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState(null);

  const getStatusBadge = (status) =>
    status === "Active" ? (
      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 min-w-[70px]">
        <CheckCircle size={12} />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 min-w-[70px]">
        <Ban size={12} />
        Inactive
      </span>
    );

  const getRoleBadge = (role) => {
    const colors = {
      "Super Admin": "bg-purple-100 text-purple-700 border border-purple-200",
      Analyst: "bg-blue-100 text-blue-700 border border-blue-200",
      Accounting: "bg-amber-100 text-amber-700 border border-amber-200",
    };
    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap text-center min-w-[90px] ${
          colors[role] || "bg-gray-100 text-gray-700 border border-gray-200"
        }`}
      >
        {role}
      </span>
    );
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

  // Sortable Header - matches UserTable exactly
  const SortableHeader = ({ column, label, width }) => {
    const isActive = sortConfig?.sortBy === column;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th style={{ width, minWidth: width }} className="relative group">
        <div
          className="flex items-center justify-between p-3 cursor-pointer select-none"
          onClick={() => onSortChange && onSortChange(column)}
        >
          <span className="font-semibold">{label}</span>
          <div className="flex flex-col gap-0.5">
            <ChevronUp
              size={12}
              className={`transition-colors ${
                isAsc ? "text-yellow-300" : "text-white/50"
              }`}
            />
            <ChevronDown
              size={12}
              className={`-mt-1 transition-colors ${
                isDesc ? "text-yellow-300" : "text-white/50"
              }`}
            />
          </div>
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30 transition-colors"
        />
      </th>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#05015A]" />
          <p className="text-sm text-gray-500">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "800px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <th
                style={{ width: columnWidths.slNo }}
                className="p-3 font-semibold"
              >
                #
              </th>

              <SortableHeader
                column="name"
                label="Name"
                width={columnWidths.name}
              />

              <th
                style={{ width: columnWidths.username }}
                className="p-3 font-semibold relative group"
              >
                Username
                <div
                  onMouseDown={(e) => handleMouseDown("username", e)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30"
                />
              </th>

              <th
                style={{ width: columnWidths.contact }}
                className="p-3 font-semibold relative group"
              >
                Contact
                <div
                  onMouseDown={(e) => handleMouseDown("contact", e)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30"
                />
              </th>

              <SortableHeader
                column="role"
                label="Role"
                width={columnWidths.role}
              />

              <th
                style={{ width: columnWidths.status }}
                className="p-3 font-semibold text-center"
              >
                Status
              </th>

              <SortableHeader
                column="last_login_at"
                label="Last Login"
                width={columnWidths.lastLogin}
              />

              <th
                style={{ width: columnWidths.actions, minWidth: 80 }}
                className="p-2 font-semibold text-center"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {admins.length > 0 ? (
              admins.map((a, i) => (
                <tr
                  key={a.id}
                  className={`
                    border-b border-gray-100 transition-all duration-150
                    ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    ${a.status !== "Active" ? "opacity-60" : ""}
                    hover:bg-indigo-50
                  `}
                >
                  <td className="p-3 text-gray-500 font-medium">
                    {startIndex + i + 1}
                  </td>

                  <td className="p-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {a.name}
                      {a.status !== "Active" && (
                        <Ban size={14} className="text-red-400" />
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-gray-600">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      @{a.username}
                    </span>
                  </td>

                  {/* Combined Phone + Email */}
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-gray-900">{a.phone}</span>
                      <span className="text-xs text-gray-500 truncate max-w-[160px]" title={a.email}>
                        {a.email}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    {getRoleBadge(a.role)}
                  </td>

                  <td className="p-3 text-center">
                    {getStatusBadge(a.status)}
                  </td>

                  <td className="p-3 text-gray-500 text-sm">
                    {a.lastLogin || "Never"}
                  </td>

                  <td className="p-2">
                    <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedAdminId(a.id);
                          setModalMode("view");
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50 transition-all"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAdminId(a.id);
                          setModalMode("edit");
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Edit Admin"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => {
                          setAdminToToggle(a);
                          setShowStatusConfirm(true);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          a.status === "Active"
                            ? "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                            : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={a.status === "Active" ? "Suspend Admin" : "Activate Admin"}
                      >
                        {a.status === "Active" ? (
                          <Ban size={15} />
                        ) : (
                          <CheckCircle size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Users size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500 mb-1">
                      No admins found
                    </p>
                    <p className="text-sm text-gray-400">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50  flex items-center justify-between">
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      </div>

      {/* DETAILS MODAL */}
      {isModalOpen && selectedAdminId && (
        <AdminDetailsModal
          isOpen={isModalOpen}
          adminId={selectedAdminId}
          mode={modalMode}
          onClose={handleModalClose}
          onAdminUpdate={onAdminUpdate}
        />
      )}

      {/* CONFIRM STATUS TOGGLE */}
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