import { useState, useEffect } from "react";
import UserHeader from "../components/User/UserHeader";
import UserTable from "../components/User/UserTable";
import { getAllCAdminUsers } from "../api/cadminUsers";

const UserPage = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [users, setUsers] = useState([]);   // REPLACES dummyUsers
  const [loading, setLoading] = useState(true);

  // Fetch users on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const resp = await getAllCAdminUsers();
        setUsers(resp.data.data || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, roleFilter, dateFilter]);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">

      <UserHeader
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        dummyUsers={users}     // UPDATED
      />

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <UserTable
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          searchText={searchText}
          statusFilter={statusFilter}
          roleFilter={roleFilter}
          dateFilter={dateFilter}
          dummyUsers={users}     // UPDATED
          loading={loading}      // NEW
        />
      </div>
    </div>
  );
};

export default UserPage;
