// src/pages/PendingUsersPage.jsx
import { useState, useMemo } from "react";
import PendingUsersFilters from "../components/pending/PendingUsersFilters";
import PendingUsersTable from "../components/pending/PendingUsersTable";
import ViewDocumentsModal from "../components/pending/ViewDocumentsModal";
import { pendingUsers } from "../components/data/pendingUsersData";

const ROWS_PER_PAGE = 10;

const PendingUsersPage = () => {
  const [filters, setFilters] = useState({
    q: "",
    status: "pending", // pending / approved / rejected / all
  });

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // local data state (in-memory) so approvals update UI immediately
  const [users, setUsers] = useState(pendingUsers);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filters.status !== "all" && u.status !== filters.status) return false;
      const q = (filters.q || "").trim().toLowerCase();
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        String(u.phone).includes(q) ||
        String(u.id).includes(q)
      );
    });
  }, [users, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const pageData = filtered.slice(start, start + ROWS_PER_PAGE);

  const openUserModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalOpen(false);
  };

  const handleApprove = (userId) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "approved" } : u)));
    closeModal();
  };

  const handleReject = (userId, reason) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: "rejected", rejectReason: reason || "N/A" } : u
      )
    );
    closeModal();
  };

  return (
    <div className="px-6 pt-6 w-full font-poppins">
      <h2 className="text-2xl font-semibold text-[#05015A] mb-4">User Verification</h2>

      <PendingUsersFilters filters={filters} onChange={handleFilterChange} />

      <div className="mt-4">
        <PendingUsersTable
          users={pageData}
          onViewDocuments={openUserModal}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      </div>

      <ViewDocumentsModal
        open={modalOpen}
        onClose={closeModal}
        user={selectedUser}
        onApprove={() => selectedUser && handleApprove(selectedUser.id)}
        onReject={(reason) => selectedUser && handleReject(selectedUser.id, reason)}
      />
    </div>
  );
};

export default PendingUsersPage;
