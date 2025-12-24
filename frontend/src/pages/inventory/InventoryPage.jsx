

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import InventoryFilters from "./components/InventoryFilters";
import InventoryTable from "./components/InventoryTable";
import InventoryPagination from "./components/InventoryPagination";
import ViewInventoryModal from "./components/ViewInventoryModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";
import { inventoryData } from "../../components/data/inventory";

const InventoryPage = () => {
  const [items, setItems] = useState(inventoryData);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    expiry: "",
    supplier: "",
    category: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const rowsPerPage = useDynamicRowCount();

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  /* ---------------- FILTERING ---------------- */
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        (!filters.status || item.status === filters.status) &&
        (!filters.supplier || item.supplier === filters.supplier) &&
        (!filters.category || item.category === filters.category)
      );
    });
  }, [items, filters]);

  /* ---------------- PAGINATION ---------------- */
  useEffect(() => {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredData.length, rowsPerPage, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  /* ---------------- ACTIONS ---------------- */
  const handleView = (row) => {
    setSelectedItem(row);
    setModalMode("view");
    setOpenModal(true);
  };

  const handleEdit = (row) => {
    setSelectedItem(row);
    setModalMode("edit");
    setOpenModal(true);
  };

  const handleDelete = (row) => {
    setConfirmDelete(row);
  };

  const handleSave = (updated) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
    setOpenModal(false);
    toast.success("Inventory item updated successfully");
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-poppins">
      {/* FILTER BAR */}
      <div className="p-4 border-b border-gray-100">
        <InventoryFilters filters={filters} onChange={handleFilterChange} />
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <InventoryTable
          items={paginatedData}
          startIndex={startIndex}
          rowsPerPage={rowsPerPage}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        >
          <div className="mt-auto border-t border-gray-200 bg-white">
            <InventoryPagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalItems={filteredData.length}
              rowsPerPage={rowsPerPage}
            />
          </div>
        </InventoryTable>
      </div>

      {/* MODAL */}
      <ViewInventoryModal
        open={openModal}
        item={selectedItem}
        mode={modalMode}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
      />

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          setItems((prev) =>
            prev.filter((i) => i.id !== confirmDelete.id)
          );
          toast.success("Item deleted successfully");
          setConfirmDelete(null);
        }}
        title="Delete Item"
        message={`Delete ${confirmDelete?.name}?`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default InventoryPage;
