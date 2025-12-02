// components/User/UserTable.jsx

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Eye,
  Pencil,
  ChevronUp,
  ChevronDown,
  Users,
  Ban,
  CheckCircle,
} from "lucide-react";
import Pagination from "./Pagination";
import UserDetailsModal from "./UserDetailsModal";
import ConfirmDialog from "../common/ConfirmDialog";

const UserTable = ({
  currentPage,
  setCurrentPage,
  searchText,
  statusFilter,
  roleFilter,
  dateFilter,
  dummyUsers,
  loading,
}) => {
  // ═══════════════════════════════════════════════════════════
  // MODAL STATE
  // ═══════════════════════════════════════════════════════════
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

  // ═══════════════════════════════════════════════════════════
  // SUSPEND CONFIRM STATE
  // ═══════════════════════════════════════════════════════════
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // COLUMN RESIZING
  // ═══════════════════════════════════════════════════════════
  const [columnWidths, setColumnWidths] = useState({
    slNo: 60,
    name: 160,
    username: 130,
    email: 200,
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

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(60, resizing.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    },
    [resizing]
  );

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, []);

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

  // ═══════════════════════════════════════════════════════════
  // FILTER - Updated to use is_active for status
  // ═══════════════════════════════════════════════════════════
  const filteredUsers = useMemo(() => {
    return dummyUsers.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchText.toLowerCase()) ||
        u.username.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase());

      // Status filter now uses is_active field
      let matchStatus = true;
      if (statusFilter === "Active") {
        matchStatus = u.is_active === true;
      } else if (statusFilter === "Inactive") {
        matchStatus = u.is_active === false;
      } else if (statusFilter) {
        // For any other status filter value
        matchStatus = (u.is_active ? "Active" : "Inactive") === statusFilter;
      }

      const matchRole = !roleFilter || u.role === roleFilter;
      
      // Handle "Never" for lastLogin
      const matchDate =
        !dateFilter ||
        u.lastLogin === "Never" ||
        u.lastLogin.split("/").reverse().join("-") === dateFilter;

      return matchSearch && matchStatus && matchRole && matchDate;
    });
  }, [searchText, statusFilter, roleFilter, dateFilter, dummyUsers]);

  // ═══════════════════════════════════════════════════════════
  // SORTING
  // ═══════════════════════════════════════════════════════════
  const [sortConfig, setSortConfig] = useState({ key: null, order: null });

  const sortedUsers = useMemo(() => {
    let sorted = [...filteredUsers];

    if (sortConfig.key === "name") {
      sorted.sort((a, b) =>
        sortConfig.order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    }

    if (sortConfig.key === "username") {
      sorted.sort((a, b) =>
        sortConfig.order === "asc"
          ? a.username.localeCompare(b.username)
          : b.username.localeCompare(a.username)
      );
    }

    if (sortConfig.key === "lastLogin") {
      sorted.sort((a, b) => {
        // Handle "Never" - put at end
        if (a.lastLogin === "Never") return 1;
        if (b.lastLogin === "Never") return -1;
        const dateA = new Date(a.lastLogin.split("/").reverse().join("-"));
        const dateB = new Date(b.lastLogin.split("/").reverse().join("-"));
        return sortConfig.order === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    return sorted;
  }, [filteredUsers, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // ═══════════════════════════════════════════════════════════
  // PAGINATION
  // ═══════════════════════════════════════════════════════════
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const updateRowsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 2560) setRowsPerPage(14);
      else if (width >= 1920) setRowsPerPage(12);
      else if (width >= 1440) setRowsPerPage(10);
      else if (width >= 1366) setRowsPerPage(8);
      else setRowsPerPage(6);
    };

    updateRowsPerPage();
    window.addEventListener("resize", updateRowsPerPage);
    return () => window.removeEventListener("resize", updateRowsPerPage);
  }, []);

  const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleUsers = sortedUsers.slice(startIndex, startIndex + rowsPerPage);

  // ═══════════════════════════════════════════════════════════
  // ROLE BADGE COLORS
  // ═══════════════════════════════════════════════════════════
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "Super Admin":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      case "Branch Admin":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "Staff":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  // ═══════════════════════════════════════════════════════════
  // STATUS BADGE - Now uses is_active
  // ═══════════════════════════════════════════════════════════
  const getStatusBadge = (is_active) => {
    if (is_active) {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 min-w-[70px]">
          <CheckCircle size={12} />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 min-w-[70px]">
        <Ban size={12} />
        Inactive
      </span>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SORTABLE HEADER
  // ═══════════════════════════════════════════════════════════
  const SortableHeader = ({ column, label, width }) => {
    const isActive = sortConfig.key === column;
    const isAsc = isActive && sortConfig.order === "asc";
    const isDesc = isActive && sortConfig.order === "desc";

    return (
      <th style={{ width, minWidth: width }} className="relative group">
        <div
          className="flex items-center justify-between p-3 cursor-pointer select-none"
          onClick={() => handleSort(column)}
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
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30 transition-colors"
        />
      </th>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SUSPEND HANDLER - Now uses is_active
  // ═══════════════════════════════════════════════════════════
  const handleSuspendClick = (user) => {
    setUserToSuspend(user);
    setShowSuspendConfirm(true);
  };

  const handleSuspendConfirm = async () => {
    if (!userToSuspend) return;

    setSuspendLoading(true);
    try {
      // Action is based on is_active, not status
      const action = userToSuspend.is_active ? "suspend" : "activate";

      // TODO: Call your API here
      // await axios.patch(`/api/admin/users/${userToSuspend.user_id}/toggle-active`, {
      //   is_active: !userToSuspend.is_active
      // });

      console.log(`${action} user:`, userToSuspend.user_id);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowSuspendConfirm(false);
      setUserToSuspend(null);

      // TODO: Refresh data
    } catch (error) {
      console.error("Suspend/Activate failed:", error);
    } finally {
      setSuspendLoading(false);
    }
  };


  if (loading) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
      Loading users...
    </div>
  );
}


  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "800px" }}
        >
          {/* Header */}
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
                label="Full Name"
                width={columnWidths.name}
              />
              <SortableHeader
                column="username"
                label="Username"
                width={columnWidths.username}
              />

              <th
                style={{ width: columnWidths.email }}
                className="p-3 font-semibold relative group"
              >
                Email
                <div
                  onMouseDown={(e) => handleMouseDown("email", e)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30"
                />
              </th>

              <th
                style={{ width: columnWidths.role }}
                className="p-3 font-semibold text-center"
              >
                Role
              </th>

              <th
                style={{ width: columnWidths.status }}
                className="p-3 font-semibold text-center"
              >
                Status
              </th>

              <SortableHeader
                column="lastLogin"
                label="Last Login"
                width={columnWidths.lastLogin}
              />

              <th
                style={{
                  width: columnWidths.actions,
                  minWidth: 80,
                }}
                className="p-2 font-semibold text-center"
              >
                Actions
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {visibleUsers.length > 0 ? (
              visibleUsers.map((u, index) => (
                <tr
                  key={u.id}
                  className={`
                    border-b border-gray-100 transition-all duration-150
                    ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    ${!u.is_active ? "opacity-60" : ""}
                    hover:bg-indigo-50
                  `}
                >
                  {/* SL.No */}
                  <td className="p-3 text-gray-500 font-medium">
                    {startIndex + index + 1}
                  </td>

                  {/* Name - with inactive indicator */}
                  <td className="p-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {u.name}
                      {!u.is_active && (
                        <Ban size={14} className="text-red-400" />
                      )}
                    </div>
                  </td>

                  {/* Username */}
                  <td className="p-3 text-gray-600">@{u.username}</td>

                  {/* Email */}
                  <td className="p-3 text-gray-600">{u.email}</td>

                  {/* Role */}
                  <td className="p-3 text-center">
                    <span
                      className={`
                        inline-block px-3 py-1 rounded-full text-xs font-medium 
                        whitespace-nowrap text-center min-w-[90px]
                        ${getRoleBadgeStyle(u.role)}
                      `}
                    >
                      {u.role}
                    </span>
                  </td>

                  {/* Status - Now uses is_active */}
                  <td className="p-3 text-center">
                    {getStatusBadge(u.is_active)}
                  </td>

                  {/* Last Login */}
                  <td className="p-3 text-gray-500 text-sm">{u.lastLogin}</td>

                  {/* Actions */}
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                      {/* View */}
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setIsModalOpen(true);
                          setModalMode("view");
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50 transition-all"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setIsModalOpen(true);
                          setModalMode("edit");
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Edit User"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Suspend / Activate - Now uses is_active */}
                      <button
                        onClick={() => handleSuspendClick(u)}
                        className={`p-1.5 rounded-lg transition-all ${
                          u.is_active
                            ? "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                            : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={u.is_active ? "Suspend User" : "Activate User"}
                      >
                        {u.is_active ? (
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
              /* Empty State */
              <tr>
                <td colSpan="8" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Users size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500 mb-1">
                      No users found
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

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-1.5 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">
            {sortedUsers.length > 0 ? startIndex + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium text-gray-700">
            {Math.min(startIndex + rowsPerPage, sortedUsers.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-gray-700">
            {sortedUsers.length}
          </span>{" "}
          results
          {sortedUsers.length !== dummyUsers.length && (
            <span className="text-gray-400">
              {" "}
              (filtered from {dummyUsers.length})
            </span>
          )}
        </div>

        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Modal */}
      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        mode={modalMode}
      />

      {/* Suspend/Activate Confirmation Dialog - Now uses is_active */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => {
          setShowSuspendConfirm(false);
          setUserToSuspend(null);
        }}
        onConfirm={handleSuspendConfirm}
        title={userToSuspend?.is_active ? "Suspend User?" : "Activate User?"}
        message={
          userToSuspend?.is_active
            ? `Are you sure you want to suspend "${userToSuspend?.name}"? They will not be able to log in until reactivated.`
            : `Are you sure you want to activate "${userToSuspend?.name}"? They will be able to log in again.`
        }
        confirmText={userToSuspend?.is_active ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={userToSuspend?.is_active ? "warning" : "success"}
        loading={suspendLoading}
      />
    </div>
  );
};

export default UserTable;