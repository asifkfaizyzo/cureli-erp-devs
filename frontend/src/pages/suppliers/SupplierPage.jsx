// src/pages/supplier/SupplierPage.jsx
import { useState, useMemo, useEffect } from "react";
import { useToast } from "../../components/common/Toast";
import SupplierHeader from "./components/SupplierHeader";
import SupplierTable from "./components/SupplierTable";
import SupplierModal from "./components/SupplierModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useSuppliers } from "../../hooks/useSuppliers";

const SupplierPage = () => {
  const toast = useToast();

  /* ---------------- FILTER STATE ---------------- */
  const [filters, setFilters] = useState({
    name: "",
    supplierId: "",
    contact: "",
  });

  /* ---------------- API HOOK ---------------- */
  const {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    refresh,
  } = useSuppliers();

  // ✅ DEBUG: Log suppliers data
  useEffect(() => {
    console.log("=== SUPPLIER PAGE DEBUG ===");
    console.log("suppliers:", suppliers);
    console.log("suppliers length:", suppliers?.length);
    console.log("loading:", loading);
    console.log("error:", error);
  }, [suppliers, loading, error]);

  /* ---------------- MODAL STATE ---------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  /* ---------------- CONFIRMATION STATE ---------------- */
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ---------------- SAVING STATE ---------------- */
  const [saving, setSaving] = useState(false);

  /* ---------------- ERROR HANDLING ---------------- */
  useEffect(() => {
    if (error) {
      toast.error("Error", error);
    }
  }, [error]);

  /* ---------------- FILTER HANDLER ---------------- */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ name: "", supplierId: "", contact: "" });
    toast.info("Filters Reset", "All filters have been cleared.", 2000);
  };

  /* ---------------- FILTER LOGIC (Client-side) ---------------- */
  const filteredSuppliers = useMemo(() => {
    console.log("Filtering suppliers:", suppliers); // ✅ DEBUG
    return suppliers.filter((item) => {
      const itemName = item.name?.toLowerCase() || "";
      const itemId = item.supplierId?.toLowerCase() || "";
      const itemPhone = item.contact?.toString() || "";

      return (
        itemName.includes(filters.name.toLowerCase()) &&
        itemId.includes(filters.supplierId.toLowerCase()) &&
        itemPhone.includes(filters.contact)
      );
    });
  }, [filters, suppliers]);

  // ✅ DEBUG: Log filtered results
  useEffect(() => {
    console.log("Filtered suppliers:", filteredSuppliers);
    console.log("Filtered count:", filteredSuppliers?.length);
  }, [filteredSuppliers]);

  /* ---------------- TABLE ACTIONS ---------------- */
  const handleRowAction = (action, supplier) => {
    if (action === "delete") {
      setConfirmDelete(supplier);
      return;
    }
    setSelectedSupplier(supplier);
    setModalMode(action);
    setModalOpen(true);
  };

  /* ---------------- SAVE HANDLER ---------------- */
  const handleSave = async (formData) => {
    setSaving(true);

    try {
      const isNew = formData.supplierId === "NEW" || !formData.supplier_id;

      let result;
      if (isNew) {
        result = await createSupplier(formData);
      } else {
        result = await updateSupplier(formData.supplier_id, formData);
      }

      if (result.success) {
        toast.success(
          isNew ? "Supplier Added" : "Supplier Updated",
          `Supplier ${formData.name} ${isNew ? "added" : "updated"} successfully.`
        );
        setModalOpen(false);
        setSelectedSupplier(null);
      } else {
        toast.error("Save Failed", result.error || "Failed to save supplier.");
      }
    } catch (err) {
      toast.error("Save Failed", "An unexpected error occurred. Please try again.");
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- ADD NEW ---------------- */
  const handleAdd = () => {
    setSelectedSupplier({
      supplierId: "NEW",
      name: "",
      contact: "",
      officePhone: "",
      personalPhone: "",
      email: "",
      gst: "",
      address: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      contactPerson: "",
      drugLicense: "",
      creditDays: "",
      creditLimit: "",
      bankName: "",
      accountNo: "",
      ifsc: "",
    });
    setModalMode("edit");
    setModalOpen(true);
  };

  /* ---------------- DELETE HANDLER ---------------- */
  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;

    try {
      toast.success(
        "Supplier Deleted",
        `Supplier ${confirmDelete.name} has been removed.`
      );
      refresh();
      setConfirmDelete(null);
    } catch (err) {
      toast.error("Delete Failed", "Failed to delete supplier. Please try again.");
      console.error("Delete error:", err);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="flex flex-col h-full w-full font-poppins overflow-hidden">
      {/* FILTERS */}
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <SupplierHeader
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          onAdd={handleAdd}
        />
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3">
        <SupplierTable
          data={filteredSuppliers}
          loading={loading}
          onRowClick={handleRowAction}
        />
      </div>

      {/* SUPPLIER MODAL */}
      <SupplierModal
        open={modalOpen}
        mode={modalMode}
        supplier={selectedSupplier}
        onClose={() => {
          setModalOpen(false);
          setSelectedSupplier(null);
        }}
        onSave={handleSave}
        saving={saving}
      />

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
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