import { useState, useEffect, useMemo, useCallback } from "react";
import AdminHeader from "../components/Admin/AdminHeader";
import AdminTable from "../components/Admin/AdminTable";
import AddAdminModal from "../components/Admin/AddAdminModal";
import Pagination from "../components/common/Pagination";
import useDynamicRowCount from "../hooks/useDynamicRowCount";
import { dummyAdmins } from "../data/dummyAdmins";

const AdminsPage = () => {
  // DATA
  const [admins, setAdmins] = useState(dummyAdmins);

  // MODAL STATE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // FILTERS & SORT
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    sortBy: "createdAt",
    order: "desc",
  });

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = useDynamicRowCount();

  // FILTER + SORT
  const filteredAdmins = useMemo(() => {
    let data = [...admins];

    if (searchText) {
      const q = searchText.toLowerCase();
      data = data.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      data = data.filter((a) => a.status === statusFilter);
    }

    if (dateFilter) {
      data = data.filter((a) =>
        a.lastLogin?.toLowerCase().includes(dateFilter.toLowerCase())
      );
    }

    if (sortConfig.sortBy) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.sortBy];
        const bVal = b[sortConfig.sortBy];
        if (!aVal || !bVal) return 0;
        return sortConfig.order === "asc"
          ? aVal > bVal ? 1 : -1
          : aVal < bVal ? 1 : -1;
      });
    }

    return data;
  }, [admins, searchText, statusFilter, dateFilter, sortConfig]);

  // PAGE CORRECTION
  useEffect(() => {
    const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [filteredAdmins.length, rowsPerPage, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedAdmins = filteredAdmins.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  // HANDLERS
  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      order:
        prev.sortBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const handleAdminUpdate = useCallback((adminId, updates) => {
    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, ...updates } : a))
    );
  }, []);

  // Open modal
  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // Close modal
  const handleCloseAddModal = useCallback((wasCreated) => {
    setIsAddModalOpen(false);
    // Optional: show success toast if wasCreated is true
  }, []);

  // Create new admin
  const handleCreateAdmin = useCallback((newAdmin) => {
    setAdmins((prev) => [newAdmin, ...prev]);
    setCurrentPage(1);
    // Optional: show success notification
    console.log("New admin created:", newAdmin);
  }, []);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* HEADER */}
      <AdminHeader
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        admins={filteredAdmins}
        totalItems={filteredAdmins.length}
        onAddAdmin={handleOpenAddModal}
      />

      {/* TABLE */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AdminTable
          admins={paginatedAdmins}
          rowsPerPage={rowsPerPage}
          startIndex={startIndex}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onAdminUpdate={handleAdminUpdate}
        >
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={filteredAdmins.length}
            rowsPerPage={rowsPerPage}
          />
        </AdminTable>
      </div>

      {/* ADD ADMIN MODAL */}
      <AddAdminModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onCreate={handleCreateAdmin}
      />
    </div>
  );
};

export default AdminsPage;