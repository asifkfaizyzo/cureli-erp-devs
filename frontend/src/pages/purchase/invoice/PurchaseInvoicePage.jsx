// frontend\src\pages\purchase\invoice\PurchaseInvoicePage.jsx
import React, { useEffect, useMemo, useState } from "react";

import PurchaseTable from "./components/PurchaseTable";
import InvoicePagination from "./components/InvoicePagination";
import InvoiceFilters from "./components/InvoiceFilters";
import ViewInvoiceModal from "./components/ViewInvoiceModal";

import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import { purchaseData as initialPurchaseData } from "../../../components/data/invoices2";

const PurchaseInvoicePage = () => {
  /* ---------------- FILTER STATE ---------------- */
  const [filters, setFilters] = useState({
    name: "",
    billNo: "",
    phone: "",
    fromDate: "",
    toDate: "",
  });

  /* ---------------- DATA STATE ---------------- */
  const [purchases, setPurchases] = useState(initialPurchaseData || []);
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------------- MODAL STATE ---------------- */
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedBill, setSelectedBill] = useState(null);

  /* ---------------- DYNAMIC ROW COUNT ---------------- */
  const rowsPerPage = useDynamicRowCount();

  /* ---------------- FILTER HANDLER ---------------- */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredData = useMemo(() => {
    const source = Array.isArray(purchases) ? purchases : [];

    return source.filter((row) => {
      const matchName = row.supplierName
        ?.toLowerCase()
        .includes(filters.name.toLowerCase());

      const matchBill = row.purchaseId
        ?.toLowerCase()
        .includes(filters.billNo.toLowerCase());

      const matchPhone = row.contact?.includes(filters.phone);

      const rowDate = new Date(row.purchaseDate);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;

      const matchDate =
        (!fromDate || rowDate >= fromDate) && (!toDate || rowDate <= toDate);

      return matchName && matchBill && matchPhone && matchDate;
    });
  }, [filters, purchases]);

  /* ---------------- PAGINATION ---------------- */
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * rowsPerPage;

  const paginatedData = useMemo(
    () => filteredData.slice(startIndex, startIndex + rowsPerPage),
    [filteredData, startIndex, rowsPerPage]
  );

  /* ---------------- TABLE ACTIONS ---------------- */

  const handleView = (row, mode) => {
    // console.log("👁️ VIEW clicked:", { row, mode });
    setSelectedBill(row);
    setModalMode(mode || "view");
    setOpenModal(true);
  };

  const handleEdit = (row, mode) => {
    // console.log("✏️ EDIT clicked:", { row, mode });
    setSelectedBill(row);
    setModalMode(mode || "edit");
    setOpenModal(true);
  };

  const handleDelete = (row) => {
    console.log("🗑️ DELETE clicked:", row);
    if (confirm(`Delete purchase ${row.purchaseId}?`)) {
      setPurchases((prev) =>
        prev.filter((p) => p.purchaseId !== row.purchaseId)
      );
    }
  };

  /* ---------------- MODAL ACTIONS ---------------- */

  const handleSave = (updatedBill) => {
    // console.log("💾 SAVE clicked:", updatedBill);
    setPurchases((prev) =>
      prev.map((p) =>
        p.purchaseId === updatedBill.purchaseId ? updatedBill : p
      )
    );
    setOpenModal(false);
  };

  const handleDeleteFromModal = (bill) => {
    // console.log("🗑️ DELETE from modal:", bill);
    handleDelete(bill);
    setOpenModal(false);
  };

  const handlePrint = (bill) => {
    // console.log("🖨️ PRINT clicked:", bill);
    window.print();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-poppins">
      {/* FILTERS */}
      <div className="p-4">
        <InvoiceFilters filters={filters} onChange={handleFilterChange} />
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <PurchaseTable
          purchases={paginatedData}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          rowsPerPage={rowsPerPage}
          startIndex={startIndex}
        >
          <InvoicePagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </PurchaseTable>
      </div>

      {/* MODAL - correct prop order */}
      <ViewInvoiceModal
        open={openModal}
        mode={modalMode}
        bill={selectedBill}
        onClose={() => {
          // console.log("❌ Modal closed");
          setOpenModal(false);
        }}
        onSave={handleSave}
        onDelete={handleDeleteFromModal}
        onPrint={handlePrint}
      />
    </div>
  );
};

export default PurchaseInvoicePage;
