import { useState } from "react";
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
import AdminDetailsModal from "./AdminDetailsModal";
import ConfirmDialog from "../common/ConfirmDialog";
import { toggleAdminAccess } from "../../api/cadminAdmins";

const AdminTable = ({
  admins = [],
  loading = false,
  rowsPerPage = 6,
  startIndex = 0,
  sortConfig,
  onSortChange,
  onAdminUpdate,
  onRefresh,
  children,
}) => {
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState(null);

  const getStatusBadge = (status) =>
    status === "Active" ? (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Inactive
      </span>
    );

  const getRoleBadge = (role) => {
    const colors = {
      "Super Admin": "bg-purple-50 text-purple-700 border-purple-200",
      Analyst: "bg-blue-50 text-blue-700 border-blue-200",
      Accounting: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
          colors[role] || "bg-gray-50 text-gray-700 border-gray-200"
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

      // Update local state
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

  // Sortable header component
  const SortHeader = ({ column, label, className = "" }) => {
    const isActive = sortConfig?.sortBy === column;
    return (
      <th
        className={`px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none ${className}`}
        onClick={() => onSortChange?.(column)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive && (
            <span className="ml-0.5">
              {sortConfig.order === "asc" ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* TABLE AREA */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full min-w-[1000px] border-collapse text-xs md:text-sm">
          {/* HEADER */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white">
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider w-12">
                #
              </th>
              <SortHeader column="name" label="Name" />
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Phone
              </th>
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Email
              </th>
              <SortHeader column="role" label="Role" />
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Status
              </th>
              <SortHeader column="last_login_at" label="Last Login" />
              <th className="px-3 py-2 text-center font-semibold text-[10px] uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-12">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 size={32} className="text-[#05015A] animate-spin mb-3" />
                    <p className="text-gray-500">Loading admins...</p>
                  </div>
                </td>
              </tr>
            ) : admins.length ? (
              admins.map((a, i) => (
                <tr
                  key={a.id}
                  className="hover:bg-indigo-50/50 transition-colors group"
                >
                  <td className="px-3 py-1.5 text-gray-400 font-medium text-[11px]">
                    {startIndex + i + 1}
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="font-semibold text-gray-900 group-hover:text-[#05015A] transition-colors">
                      {a.name}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="font-mono text-gray-600 text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                      @{a.username}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-700">{a.phone}</td>
                  <td className="px-3 py-1.5 text-gray-700">{a.email}</td>
                  <td className="px-3 py-1.5">{getRoleBadge(a.role)}</td>
                  <td className="px-3 py-1.5">{getStatusBadge(a.status)}</td>
                  <td className="px-3 py-1.5 text-gray-600">{a.lastLogin || "Never"}</td>
                  <td className="px-3 py-1.5 text-center">
                    <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedAdminId(a.id);
                          setModalMode("view");
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAdminId(a.id);
                          setModalMode("edit");
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setAdminToToggle(a);
                          setShowStatusConfirm(true);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title={a.status === "Active" ? "Suspend" : "Activate"}
                      >
                        {a.status === "Active" ? <Ban size={14} /> : <CheckCircle size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Users size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-semibold text-gray-600 mb-1">No admins found</p>
                    <p className="text-gray-400 text-sm max-w-sm">
                      There are no admins matching your current filters. Try adjusting your search
                      criteria.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER / PAGINATION SLOT */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50/50 px-4 py-2.5 flex items-center justify-between">
        <div className="text-[11px] text-gray-500" />
        {children}
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
        title={adminToToggle?.status === "Active" ? "Suspend Admin?" : "Activate Admin?"}
        message={
          toggleError ? (
            <span className="text-red-600">{toggleError}</span>
          ) : (
            `Are you sure you want to ${
              adminToToggle?.status === "Active" ? "suspend" : "activate"
            } "${adminToToggle?.name}"?`
          )
        }
        confirmText={adminToToggle?.status === "Active" ? "Suspend" : "Activate"}
        type={adminToToggle?.status === "Active" ? "warning" : "success"}
      />
    </div>
  );
};

export default AdminTable;