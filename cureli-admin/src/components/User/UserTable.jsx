import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import Pagination from "./Pagination";
import UserDetailsModal from "./UserDetailsModal";

const UserTable = ({
  currentPage,
  setCurrentPage,
  searchText,
  statusFilter,
  roleFilter,
  dateFilter,
  dummyUsers
}) => {
  // ------------------------------------------------------------
  // ⭐ FILTER USERS
  // ------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return dummyUsers.filter((u) => {
      // Search (name + username + email)
      const matchSearch =
        u.name.toLowerCase().includes(searchText.toLowerCase()) ||
        u.username.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase());

      // Status filter
      const matchStatus =
        !statusFilter || u.status === statusFilter;

      // Role filter
      const matchRole =
        !roleFilter || u.role === roleFilter;

      // Date filter (match exact yyyy-mm-dd)
      const matchDate =
        !dateFilter ||
        u.lastLogin.split("/").reverse().join("-") === dateFilter;

      return matchSearch && matchStatus && matchRole && matchDate;
    });
  }, [searchText, statusFilter, roleFilter, dateFilter, dummyUsers]);



  const [selectedUser, setSelectedUser] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);

  // ------------------------------------------------------------
  // ⭐ SORTING
  // ------------------------------------------------------------
  const [sortConfig, setSortConfig] = useState({ key: null, order: null });

  const sortedUsers = useMemo(() => {
    let sorted = [...filteredUsers];

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
        return sortConfig.order === "asc" ? dateB - dateA : dateA - dateB;
      });
    }

    return sorted;
  }, [filteredUsers, sortConfig]);

  const triggerSort = (key, order) => {
    setSortConfig({ key, order });
  };


  // ------------------------------------------------------------
  // ⭐ PAGINATION LOGIC
  // ------------------------------------------------------------
  const rowsPerPage =
    window.innerWidth >= 2560 ? 14 :
    window.innerWidth >= 1920 ? 14 :
    window.innerWidth >= 1440 ? 8 :
    window.innerWidth >= 1366 ? 7 :
    6;

  const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleUsers = sortedUsers.slice(startIndex, startIndex + rowsPerPage);


  // ------------------------------------------------------------
  // ⭐ ROLE WIDTH AUTO SIZE
  // ------------------------------------------------------------
  const longestRoleLength = Math.max(
    ...visibleUsers.map((u) => u.role.length)
  );


  // ------------------------------------------------------------
  // ⭐ RENDER TABLE
  // ------------------------------------------------------------
  return (
    <div className="flex flex-col bg-white shadow-md rounded-xl p-3">

      <div className="overflow-visible w-full">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#05015A] text-white text-left">
              <th className="p-2 border-white">SL.No</th>
              <th className="p-2 border-white">Full Name</th>

              {/* Username Sort */}
              <th className="p-2 border-white">
                <div className="flex justify-between items-center">
                  <span>Username</span>
                  <div className="flex flex-col">
                    <ChevronUp
                      size={14}
                      className="cursor-pointer"
                      onClick={() => triggerSort("username", "asc")}
                    />
                    <ChevronDown
                      size={14}
                      className="cursor-pointer"
                      onClick={() => triggerSort("username", "desc")}
                    />
                  </div>
                </div>
              </th>

              <th className="p-2 border-white">Email</th>
              <th className="p-2 border-white">Role</th>
              <th className="p-2 border-white">Status</th>

              {/* Last Login Sort */}
              <th className="p-2 border-white">
                <div className="flex justify-between items-center">
                  <span>Last Login</span>
                  <div className="flex flex-col">
                    <ChevronUp
                      size={14}
                      className="cursor-pointer"
                      onClick={() => triggerSort("lastLogin", "asc")}
                    />
                    <ChevronDown
                      size={14}
                      className="cursor-pointer"
                      onClick={() => triggerSort("lastLogin", "desc")}
                    />
                  </div>
                </div>
              </th>

              <th className="p-2 border-white text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleUsers.map((u, index) => (
              <tr key={u.id} className="border-r-4 border-b-4 border-white bg-gray-100">
                
                {/* SL.no */}
                <td className="p-2 border-r-2 border-white">
                  {startIndex + index + 1}
                </td>

                <td className="p-2 border-r-4 border-white">{u.name}</td>
                <td className="p-2 border-r-4 border-white">{u.username}</td>
                <td className="p-2 border-r-4 border-white">{u.email}</td>

                {/* ROLE */}
                <td className="p-2 text-center border-r-4 border-white">
                  <span
                    className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-[11px] inline-block"
                    style={{ minWidth: `${longestRoleLength * 6}px`, textAlign: "center" }}
                  >
                    {u.role}
                  </span>
                </td>

                {/* STATUS */}
                <td className="p-2 text-center border-r-4 border-white">
                  <span
                    className={
                      u.status === "Active"
                        ? "px-2 py-1 rounded-full bg-green-100 text-green-600 text-[11px]"
                        : "px-2 py-1 rounded-full bg-orange-100 text-orange-600 text-[11px]"
                    }
                    style={{ minWidth: `${longestRoleLength * 6}px`, textAlign: "center" }}
                  >
                    {u.status}
                  </span>
                </td>

                <td className="p-2 border-r-4 border-white">{u.lastLogin}</td>

                {/* ACTION ICONS */}
                <td className="p-2 bg-white text-center border-r-4 border-white">
                  <div className="inline-flex items-center justify-center gap-3">
                   {/* VIEW (EYE) */}
<Eye
  size={15}
  className="cursor-pointer text-gray-600 hover:text-[#05015A]"
  onClick={() => {
    setSelectedUser(u);
    setIsModalOpen(true);
    setModalMode("view");   // 👈 NEW
  }}
/>

{/* EDIT (PENCIL) */}
<Pencil
  size={15}
  className="cursor-pointer text-gray-600 hover:text-[#05015A]"
  onClick={() => {
    setSelectedUser(u);
    setIsModalOpen(true);
    setModalMode("edit");   // 👈 NEW
  }}
/>

                    <Trash2 size={15} className="cursor-pointer text-red-500 hover:text-red-700" />
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <UserDetailsModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  user={selectedUser}
/>


    </div>
  );
};

export default UserTable;
