// src/pages/SupplierPage.jsx
import { useState, useMemo } from "react";
import { toast } from 'react-toastify';
import SupplierHeader from "./components/SupplierHeader";
import SupplierTable from "./components/SupplierTable";
import SupplierModal from "./components/SupplierModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { suppliersData } from "../../components/data/suppliers";
import usePagination from "../../hooks/usePagination";

const SupplierPage = () => {
  // 1. STATE: Manage Filters
  const [filters, setFilters] = useState({
    name: "",
    supplierId: "",
    contact: ""
  });

  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState(suppliersData);

  // MODAL STATE
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); 
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // ✅ CONFIRMATION STATE
  const [confirmDelete, setConfirmDelete] = useState(null);

  // 2. FILTER LOGIC
  const filteredSuppliers = useMemo(() => {
    return tableData.filter((item) => {
      const itemName = item.name?.toLowerCase() || "";
      const itemId = item.supplierId?.toLowerCase() || "";
      const itemPhone = item.contact?.toString() || "";

      return (
        itemName.includes(filters.name.toLowerCase()) &&
        itemId.includes(filters.supplierId.toLowerCase()) &&
        itemPhone.includes(filters.contact)
      );
    });
  }, [filters, tableData]);

  // 3. PAGINATION (Using your custom hook)
  const { 
    currentPage, 
    setCurrentPage, 
    rowsPerPage, 
    paginatedData: rawPaginatedData, 
    totalPages, 
    totalItems 
  } = usePagination(filteredSuppliers);

  // 4. EMPTY ROWS LOGIC (Visual Fix)
  const finalTableData = useMemo(() => {
    const data = [...rawPaginatedData];
    while (data.length < rowsPerPage) {
      data.push({ empty: true });
    }
    return data;
  }, [rawPaginatedData, rowsPerPage]);

  // Handle Page Change with Loading Effect
  const handlePageChangeWithLoading = (page) => {
    setLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setLoading(false);
    }, 180);
  };

  // FILTER HANDLERS
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ name: "", supplierId: "", contact: "" });
    toast.info("Filters reset", { autoClose: 2000 });
  };

  // ✅ ACTIONS WITH TOAST & CONFIRM DIALOG
  const handleRowAction = (action, supplier) => {
    if (action === "delete") {
      setConfirmDelete(supplier);
      return;
    }
    setSelectedSupplier(supplier);
    setModalMode(action);
    setModalOpen(true);
  };

  const handleSave = (updatedSupplier) => {
    try {
      const exists = tableData.some(s => s.supplierId === updatedSupplier.supplierId);
      
      if (exists) {
        setTableData((prev) => prev.map((s) => 
          s.supplierId === updatedSupplier.supplierId ? updatedSupplier : s
        ));
        toast.success(`Supplier ${updatedSupplier.name} updated successfully!`);
      } else {
        setTableData((prev) => [updatedSupplier, ...prev]);
        toast.success(`Supplier ${updatedSupplier.name} added successfully!`);
      }
      
      setModalOpen(false);
    } catch (error) {
      toast.error("Failed to save supplier. Please try again.");
      console.error("Save error:", error);
    }
  };

  const handleAdd = () => {
    setSelectedSupplier({ 
      supplierId: "NEW", 
      name: "", 
      contact: "", 
      email: "", 
      gst: "" 
    });
    setModalMode("edit");
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full font-poppins overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <SupplierHeader
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          onSearch={() => setCurrentPage(1)}
          onAdd={handleAdd}
        />
      </div>

      <div className="flex-1 min-h-0 relative">
        <SupplierTable
          data={finalTableData}
          currentPage={currentPage}
          setCurrentPage={handlePageChangeWithLoading}
          rowsPerPage={rowsPerPage}
          totalCount={totalItems}
          totalPages={totalPages}
          loading={loading}
          onRowClick={handleRowAction}
        />
      </div>

      {/* Supplier Modal */}
      <SupplierModal
        open={modalOpen}
        mode={modalMode}
        supplier={selectedSupplier}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          try {
            setTableData((prev) => 
              prev.filter((s) => s.supplierId !== confirmDelete.supplierId)
            );
            toast.success(`Supplier ${confirmDelete.name} deleted successfully!`);
            setConfirmDelete(null);
          } catch (error) {
            toast.error("Failed to delete supplier. Please try again.");
            console.error("Delete error:", error);
          }
        }}
        title="Delete Supplier"
        message={`Are you sure you want to delete ${confirmDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SupplierPage;
