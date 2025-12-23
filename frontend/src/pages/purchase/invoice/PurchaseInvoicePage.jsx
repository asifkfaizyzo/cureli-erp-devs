// frontend/src/pages/purchase/invoice/PurchaseInvoicePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from 'react-toastify';

import PurchaseTable from "./components/PurchaseTable";
import InvoicePagination from "./components/InvoicePagination";
import InvoiceFilters from "./components/InvoiceFilters";
import ViewInvoiceModal from "./components/ViewInvoiceModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

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

  /* ---------------- CONFIRMATION STATE ---------------- */
  const [confirmDelete, setConfirmDelete] = useState(null);

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
    setSelectedBill(row);
    setModalMode(mode || "view");
    setOpenModal(true);
  };

  const handleEdit = (row, mode) => {
    setSelectedBill(row);
    setModalMode(mode || "edit");
    setOpenModal(true);
  };

  const handleDelete = (row) => {
    setConfirmDelete(row);
  };

  /* ---------------- MODAL ACTIONS ---------------- */

  const handleSave = (updatedBill) => {
    try {
      setPurchases((prev) =>
        prev.map((p) =>
          p.purchaseId === updatedBill.purchaseId ? updatedBill : p
        )
      );
      setOpenModal(false);
      toast.success(`Purchase ${updatedBill.purchaseId} updated successfully!`);
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
      console.error("Save error:", error);
    }
  };

  const handleDeleteFromModal = (bill) => {
    setConfirmDelete(bill);
    setOpenModal(false);
  };

  const handlePrint = (bill) => {
    try {
      window.print();
      toast.info("Print dialog opened");
    } catch (error) {
      toast.error("Failed to open print dialog");
      console.error("Print error:", error);
    }
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

      {/* MODAL */}
      <ViewInvoiceModal
        open={openModal}
        mode={modalMode}
        bill={selectedBill}
        onClose={() => {
          setOpenModal(false);
        }}
        onSave={handleSave}
        onDelete={handleDeleteFromModal}
        onPrint={handlePrint}
      />

      {/* Delete Confirmation Dialog */}
     {/* Delete Confirmation Dialog */}
<ConfirmDialog
  isOpen={confirmDelete !== null}
  onClose={() => setConfirmDelete(null)}
  onConfirm={() => {
    try {
      setPurchases((prev) =>
        prev.filter((p) => p.purchaseId !== confirmDelete.purchaseId)
      );
      toast.success(`Purchase ${confirmDelete.purchaseId} deleted successfully!`);
      setConfirmDelete(null);
    } catch (error) {
      toast.error("Failed to delete purchase. Please try again.");
      console.error("Delete error:", error);
    }
  }}
  title="Delete Purchase"
  message={`Are you sure you want to delete purchase ${confirmDelete?.purchaseId}? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  type="danger"
/>

    </div>
  );
};

export default PurchaseInvoicePage;
