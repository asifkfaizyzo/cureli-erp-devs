import { useState, useEffect, useCallback } from "react";
import UserHeader from "../components/User/UserHeader";
import UserTable from "../components/User/UserTable";
import { getCAdminUsers } from "../api/cadminUsers";

const UserPage = () => {
  // pagination + rows per page
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const updateRows = () => {
      const width = window.innerWidth;

      if (width >= 2560) setRowsPerPage(14);
      else if (width >= 1920) setRowsPerPage(12);
      else if (width >= 1440) setRowsPerPage(9);
      else if (width >= 1366) setRowsPerPage(8);
      else setRowsPerPage(6);
    };

    updateRows();

    window.addEventListener("resize", updateRows);
    return () => window.removeEventListener("resize", updateRows);
  }, []);

  // filters / sort
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [roleFilter, setRoleFilter] = useState("Super Admin");
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ sortBy: "created_at", order: "desc" });

  // server data
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        last_login: dateFilter || undefined,
        sort: sortConfig.sortBy,
        order: sortConfig.order,
      };

      const resp = await getCAdminUsers(params);

      const root = resp.data;
      const payload = root?.data || {};

      setUsers(payload.data || []);
      setTotalItems(payload.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchText, statusFilter, roleFilter, dateFilter, sortConfig]);

  // Fetch on mount and whenever dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler to refresh table (called after modal actions)
  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler to update a single user row locally (for table suspend action)
  const handleUserUpdate = useCallback((userId, updates) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      )
    );
  }, []);

  const handleSortChange = (column) => {
    setSortConfig((prev) => {
      const order = prev.sortBy === column && prev.order === "asc" ? "desc" : "asc";
      return { sortBy: column, order };
    });
    setCurrentPage(1);
  };

  const handleFilterChange = ({ search, status, role, date }) => {
    if (search !== undefined) setSearchText(search);
    if (status !== undefined) setStatusFilter(status);
    if (role !== undefined) setRoleFilter(role);
    if (date !== undefined) setDateFilter(date);
    setCurrentPage(1);
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      <UserHeader
        searchText={searchText}
        setSearchText={(v) => handleFilterChange({ search: v })}
        statusFilter={statusFilter}
        setStatusFilter={(v) => handleFilterChange({ status: v })}
        roleFilter={roleFilter}
        setRoleFilter={(v) => handleFilterChange({ role: v })}
        dateFilter={dateFilter}
        setDateFilter={(v) => handleFilterChange({ date: v })}
        users={users}
        totalItems={totalItems}
      />

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <UserTable
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          searchText={searchText}
          statusFilter={statusFilter}
          roleFilter={roleFilter}
          dateFilter={dateFilter}
          users={users}
          loading={loading}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onRefresh={handleRefresh}
          onUserUpdate={handleUserUpdate}
        />
      </div>
    </div>
  );
};

export default UserPage;