import { useState, useMemo, useEffect } from "react";
import VerificationHeader from "../components/Verification/VerificationHeader";
import VerificationTable from "../components/Verification/VerificationTable";
import VerificationModal from "../components/Verification/VerificationModal";
import verificationDummyData from "../data/verificationDummyData";

const VerificationPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [count, setCount] = useState("");
  const [date, setDate] = useState("");

  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Responsive rows per page (same rules as ShopsTable)
  useEffect(() => {
    const updateRows = () => {
      const w = window.innerWidth;

      const r =
        w >= 2560 ? 14 :
        w >= 1920 ? 12 :
        w >= 1440 ? 10 :
        w >= 1366 ? 8 :
        6;

      setRowsPerPage(r);
    };

    updateRows();
    window.addEventListener("resize", updateRows);
    return () => window.removeEventListener("resize", updateRows);
  }, []);

  // Row click → opens modal
  const handleRowClick = (row) => {
    setSelectedUser(row);
    setIsModalOpen(true);
  };

  // Sorting
  const triggerSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  // Sorting Logic
  const sortedData = useMemo(() => {
    let list = [...verificationDummyData];

    if (sortField && sortOrder) {
      list.sort((a, b) => {
        const A = a[sortField];
        const B = b[sortField];

        if (sortField === "date") {
          return sortOrder === "asc"
            ? new Date(A) - new Date(B)
            : new Date(B) - new Date(A);
        }

        if (typeof A === "string") {
          return sortOrder === "asc"
            ? A.localeCompare(B)
            : B.localeCompare(A);
        }

        return sortOrder === "asc" ? A - B : B - A;
      });
    }

    return list;
  }, [sortField, sortOrder]);

  // Pagination Slice
  const totalCount = sortedData.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const paginatedData = sortedData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="p-2">

      {/* 🔍 Filters */}
      <VerificationHeader
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        count={count}
        setCount={setCount}
        date={date}
        setDate={setDate}
        onSearch={() => {}}
      />

      {/* TABLE + PAGINATION INSIDE FOOTER */}
      <VerificationTable
        data={paginatedData}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        totalPages={totalPages}
        triggerSort={triggerSort}
        sortField={sortField}
        sortOrder={sortOrder}
        onRowClick={handleRowClick}
      />

      {/* MODAL */}
      {isModalOpen && (
        <VerificationModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default VerificationPage;
