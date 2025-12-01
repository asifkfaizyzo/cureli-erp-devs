// import { useEffect, useMemo, useState } from "react";
// import { Eye, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
// import Pagination from "./Pagination";
// import UserDetailsModal from "./UserDetailsModal";

// const UserTable = ({
//   currentPage,
//   setCurrentPage,
//   searchText,
//   statusFilter,
//   roleFilter,
//   dateFilter,
//   dummyUsers
// }) => {
//   // ------------------------------------------------------------
//   // ⭐ FILTER USERS
//   // ------------------------------------------------------------
//   const filteredUsers = useMemo(() => {
//     return dummyUsers.filter((u) => {
//       // Search (name + username + email)
//       const matchSearch =
//         u.name.toLowerCase().includes(searchText.toLowerCase()) ||
//         u.username.toLowerCase().includes(searchText.toLowerCase()) ||
//         u.email.toLowerCase().includes(searchText.toLowerCase());

//       // Status filter
//       const matchStatus =
//         !statusFilter || u.status === statusFilter;

//       // Role filter
//       const matchRole =
//         !roleFilter || u.role === roleFilter;

//       // Date filter (match exact yyyy-mm-dd)
//       const matchDate =
//         !dateFilter ||
//         u.lastLogin.split("/").reverse().join("-") === dateFilter;

//       return matchSearch && matchStatus && matchRole && matchDate;
//     });
//   }, [searchText, statusFilter, roleFilter, dateFilter, dummyUsers]);

//   const [selectedUser, setSelectedUser] = useState(null);
// const [isModalOpen, setIsModalOpen] = useState(false);

//   // ------------------------------------------------------------
//   // ⭐ SORTING
//   // ------------------------------------------------------------
//   const [sortConfig, setSortConfig] = useState({ key: null, order: null });

//   const sortedUsers = useMemo(() => {
//     let sorted = [...filteredUsers];

//     if (sortConfig.key === "username") {
//       sorted.sort((a, b) =>
//         sortConfig.order === "asc"
//           ? a.username.localeCompare(b.username)
//           : b.username.localeCompare(a.username)
//       );
//     }

//     if (sortConfig.key === "lastLogin") {
//       sorted.sort((a, b) => {
//         const dateA = new Date(a.lastLogin.split("/").reverse().join("-"));
//         const dateB = new Date(b.lastLogin.split("/").reverse().join("-"));
//         return sortConfig.order === "asc" ? dateB - dateA : dateA - dateB;
//       });
//     }

//     return sorted;
//   }, [filteredUsers, sortConfig]);

//   const triggerSort = (key, order) => {
//     setSortConfig({ key, order });
//   };

//   // ------------------------------------------------------------
//   // ⭐ PAGINATION LOGIC
//   // ------------------------------------------------------------
//   const rowsPerPage =
//     window.innerWidth >= 2560 ? 14 :
//     window.innerWidth >= 1920 ? 14 :
//     window.innerWidth >= 1440 ? 11 :
//     window.innerWidth >= 1366 ? 7 :
//     6;

//   const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);

//   const startIndex = (currentPage - 1) * rowsPerPage;
//   const visibleUsers = sortedUsers.slice(startIndex, startIndex + rowsPerPage);

//   // ------------------------------------------------------------
//   // ⭐ ROLE WIDTH AUTO SIZE
//   // ------------------------------------------------------------
//   const longestRoleLength = Math.max(
//     ...visibleUsers.map((u) => u.role.length)
//   );

//   // ------------------------------------------------------------
//   // ⭐ RENDER TABLE
//   // ------------------------------------------------------------
//   return (
//     <div className="flex flex-col bg-white shadow-md rounded-xl p-3">

//       <div className="overflow-visible w-full">
//         <table className="w-full border-collapse text-xs">
//           <thead>
//             <tr className="bg-[#05015A] text-white text-left">
//               <th className="p-2 border-white">SL.No</th>
//               <th className="p-2 border-white">Full Name</th>

//               {/* Username Sort */}
//               <th className="p-2 border-white">
//                 <div className="flex justify-between items-center">
//                   <span>Username</span>
//                   <div className="flex flex-col">
//                     <ChevronUp
//                       size={14}
//                       className="cursor-pointer"
//                       onClick={() => triggerSort("username", "asc")}
//                     />
//                     <ChevronDown
//                       size={14}
//                       className="cursor-pointer"
//                       onClick={() => triggerSort("username", "desc")}
//                     />
//                   </div>
//                 </div>
//               </th>

//               <th className="p-2 border-white">Email</th>
//               <th className="p-2 border-white">Role</th>
//               <th className="p-2 border-white">Status</th>

//               {/* Last Login Sort */}
//               <th className="p-2 border-white">
//                 <div className="flex justify-between items-center">
//                   <span>Last Login</span>
//                   <div className="flex flex-col">
//                     <ChevronUp
//                       size={14}
//                       className="cursor-pointer"
//                       onClick={() => triggerSort("lastLogin", "asc")}
//                     />
//                     <ChevronDown
//                       size={14}
//                       className="cursor-pointer"
//                       onClick={() => triggerSort("lastLogin", "desc")}
//                     />
//                   </div>
//                 </div>
//               </th>

//               <th className="p-2 border-white text-center">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {visibleUsers.map((u, index) => (
//               <tr key={u.id} className="border-r-4 border-b-4 border-white bg-gray-100">

//                 {/* SL.no */}
//                 <td className="p-2 border-r-2 border-white">
//                   {startIndex + index + 1}
//                 </td>

//                 <td className="p-2 border-r-4 border-white">{u.name}</td>
//                 <td className="p-2 border-r-4 border-white">{u.username}</td>
//                 <td className="p-2 border-r-4 border-white">{u.email}</td>

//                 {/* ROLE */}
//                 <td className="p-2 text-center border-r-4 border-white">
//                   <span
//                     className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-[11px] inline-block"
//                     style={{ minWidth: `${longestRoleLength * 6}px`, textAlign: "center" }}
//                   >
//                     {u.role}
//                   </span>
//                 </td>

//                 {/* STATUS */}
//                 <td className="p-2 text-center border-r-4 border-white">
//                   <span
//                     className={
//                       u.status === "Active"
//                         ? "px-2 py-1 rounded-full bg-green-100 text-green-600 text-[11px]"
//                         : "px-2 py-1 rounded-full bg-orange-100 text-orange-600 text-[11px]"
//                     }
//                     style={{ minWidth: `${longestRoleLength * 6}px`, textAlign: "center" }}
//                   >
//                     {u.status}
//                   </span>
//                 </td>

//                 <td className="p-2 border-r-4 border-white">{u.lastLogin}</td>

//                 {/* ACTION ICONS */}
//                 <td className="p-2 bg-white text-center border-r-4 border-white">
//                   <div className="inline-flex items-center justify-center gap-3">
//                    {/* VIEW (EYE) */}
// <Eye
//   size={15}
//   className="cursor-pointer text-gray-600 hover:text-[#05015A]"
//   onClick={() => {
//     setSelectedUser(u);
//     setIsModalOpen(true);
//     setModalMode("view");   // 👈 NEW
//   }}
// />

// {/* EDIT (PENCIL) */}
// <Pencil
//   size={15}
//   className="cursor-pointer text-gray-600 hover:text-[#05015A]"
//   onClick={() => {
//     setSelectedUser(u);
//     setIsModalOpen(true);
//     setModalMode("edit");   // 👈 NEW
//   }}
// />

//                     <Trash2 size={15} className="cursor-pointer text-red-500 hover:text-red-700" />
//                   </div>
//                 </td>

//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* PAGINATION */}
//       <Pagination
//         totalPages={totalPages}
//         currentPage={currentPage}
//         setCurrentPage={setCurrentPage}
//       />

//       <UserDetailsModal
//   isOpen={isModalOpen}
//   onClose={() => setIsModalOpen(false)}
//   user={selectedUser}
// />

//     </div>
//   );
// };

// export default UserTable;

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Users,
} from "lucide-react";
import Pagination from "./Pagination";
import UserDetailsModal from "./UserDetailsModal";

const UserTable = ({
  currentPage,
  setCurrentPage,
  searchText,
  statusFilter,
  roleFilter,
  dateFilter,
  dummyUsers,
}) => {
  // ═══════════════════════════════════════════════════════════
  // MODAL STATE
  // ═══════════════════════════════════════════════════════════
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

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
    actions: 90, // Reduced from 120
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
  // FILTER
  // ═══════════════════════════════════════════════════════════
  const filteredUsers = useMemo(() => {
    return dummyUsers.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchText.toLowerCase()) ||
        u.username.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase());

      const matchStatus = !statusFilter || u.status === statusFilter;
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchDate =
        !dateFilter ||
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
                  minWidth: 80, // Minimum width
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
                    ${index % 2 === 0 ? "bg-gray-100" : "bg-gray-150"}
                    hover:bg-indigo-100
                  `}
                >
                  {/* SL.No */}
                  <td className="p-3 text-gray-500 font-medium">
                    {startIndex + index + 1}
                  </td>

                  {/* Name */}
                  <td className="p-3 font-medium text-gray-900">{u.name}</td>

                  {/* Username */}
                  <td className="p-3 text-gray-600">@{u.username}</td>

                  {/* Email */}
                  <td className="p-3 text-gray-600">{u.email}</td>

                  {/* Role */}
                  <td className="p-3 text-center">
                    <span
                      className={`
      inline-block px-3 py-1 rounded-full text-xs font-medium 
      whitespace-nowrap text-center w-25
      ${getRoleBadgeStyle(u.role)}
    `}
                    >
                      {u.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-3 text-center">
                    <span
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-18 ${
                        u.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      
                      {u.status}
                    </span>
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

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Delete user "${u.name}"?`)) {
                            console.log("Delete:", u.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete User"
                      >
                        <Trash2 size={15} />
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
          <span className="font-medium text-gray-700">{startIndex + 1}</span> to{" "}
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
    </div>
  );
};

export default UserTable;
