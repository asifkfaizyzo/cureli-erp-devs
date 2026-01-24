// src/pages/inventory/InventoryPage.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useToast } from "../../components/common/Toast";
import { useInventory } from "../../hooks/useInventory";
import InventoryFilters from "./components/InventoryFilters";
import InventoryTable from "./components/InventoryTable";
import ViewInventoryModal from "./components/ViewInventoryModal";
import StockAdjustmentModal from "./components/StockAdjustmentModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { Loader2, AlertCircle, RefreshCw, Package, TrendingDown, AlertTriangle, Clock } from "lucide-react";

const InventoryPage = () => {
  const toast = useToast();

  // API integration
  const {
    items,
    loading,
    error,
    summary,
    fetchInventory,
    createAdjustment,
    refresh,
  } = useInventory();

  // Local state
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    expiry: "",
    supplier: "",
    category: "",
    branchId: "",
    includeExpired: false,
    lowStock: false,
  });

  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [adjustmentModal, setAdjustmentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debounced filter change
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Apply API filters when they change
  useEffect(() => {
    const apiFilters = {};
    
    if (filters.search) apiFilters.search = filters.search;
    if (filters.branchId) apiFilters.branchId = filters.branchId;
    if (filters.includeExpired) apiFilters.includeExpired = true;
    if (filters.lowStock) apiFilters.lowStock = true;
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchInventory(apiFilters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.branchId, filters.includeExpired, filters.lowStock, fetchInventory]);

  // Client-side filtering for non-API filters
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !filters.search || 
        item.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.batch?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesSupplier = !filters.supplier || item.supplier === filters.supplier;
      const matchesCategory = !filters.category || item.category === filters.category;
      
      // Expiry filter
      let matchesExpiry = true;
      if (filters.expiry) {
        const today = new Date();
        const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
        
        if (filters.expiry === "expired") {
          matchesExpiry = expiryDate && expiryDate < today;
        } else if (filters.expiry === "30days") {
          const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          matchesExpiry = expiryDate && expiryDate >= today && expiryDate <= thirtyDays;
        } else if (filters.expiry === "90days") {
          const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
          matchesExpiry = expiryDate && expiryDate >= today && expiryDate <= ninetyDays;
        }
      }

      return matchesSearch && matchesStatus && matchesSupplier && matchesCategory && matchesExpiry;
    });
  }, [items, filters]);

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh(filters);
    setRefreshing(false);
    toast.success("Refreshed", "Inventory data updated");
  };

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

  const handleStockAdjustment = (row) => {
    setSelectedItem(row);
    setAdjustmentModal(true);
  };

  const handleSave = async (updated) => {
    // For now, just close the modal
    // In the future, you might want to update inventory metadata
    setOpenModal(false);
    toast.success("Inventory Updated", "Inventory item updated successfully.");
    refresh(filters);
  };

  const handleAdjustmentSubmit = async (adjustmentData) => {
    const result = await createAdjustment({
      shopId: selectedItem.shop_id,
      branchId: selectedItem.branch_id,
      medicineId: selectedItem.medicine_id,
      inventoryId: selectedItem.inventory_id,
      batchNumber: selectedItem.batch_number,
      newQuantity: adjustmentData.newQuantity,
      reason: adjustmentData.reason,
      reasonNotes: adjustmentData.reasonNotes,
      adjustmentDate: new Date().toISOString(),
    });

    if (result.success) {
      toast.success("Stock Adjusted", "Stock adjustment created successfully.");
      setAdjustmentModal(false);
      setSelectedItem(null);
    } else {
      toast.error("Adjustment Failed", result.error);
    }
  };

  // Get unique values for filter dropdowns
  const uniqueSuppliers = useMemo(() => {
    return [...new Set(items.map(item => item.supplier).filter(Boolean))];
  }, [items]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(items.map(item => item.category).filter(Boolean))];
  }, [items]);

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center font-poppins">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm text-slate-600">Loading inventory...</p>
      </div>
    );
  }

  // Error state
  if (error && items.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center font-poppins">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Inventory</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => refresh(filters)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-poppins">
      {/* SUMMARY CARDS */}
      {summary && (
        <div className="shrink-0 p-4 pb-0">
          <div className="grid grid-cols-5 gap-3">
            <SummaryCard
              icon={Package}
              label="Total Items"
              value={summary.totalItems || 0}
              color="blue"
            />
            <SummaryCard
              icon={Package}
              label="Total Stock"
              value={summary.totalStockQuantity || 0}
              color="green"
              suffix="units"
            />
            <SummaryCard
              icon={TrendingDown}
              label="Low Stock"
              value={summary.lowStockCount || 0}
              color="yellow"
            />
            <SummaryCard
              icon={Clock}
              label="Expiring Soon"
              value={summary.expiringSoonCount || 0}
              color="orange"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Expired"
              value={summary.expiredCount || 0}
              color="red"
            />
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="shrink-0 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <InventoryFilters 
              filters={filters} 
              onChange={handleFilterChange}
              suppliers={uniqueSuppliers}
              categories={uniqueCategories}
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading overlay during refresh */}
      {loading && items.length > 0 && (
        <div className="shrink-0 px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-indigo-600" />
          <span className="text-xs text-indigo-600">Updating inventory...</span>
        </div>
      )}

      {/* TABLE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
        <InventoryTable
          items={filteredData}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjust={handleStockAdjustment}
        />
      </div>

      {/* VIEW/EDIT MODAL */}
      <ViewInventoryModal
        open={openModal}
        item={selectedItem}
        mode={modalMode}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        onAdjust={handleStockAdjustment}
      />

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustmentModal && (
        <StockAdjustmentModal
          open={adjustmentModal}
          item={selectedItem}
          onClose={() => {
            setAdjustmentModal(false);
            setSelectedItem(null);
          }}
          onSubmit={handleAdjustmentSubmit}
        />
      )}

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          // Note: The API doesn't have a delete endpoint
          // This would typically mark inventory as inactive
          toast.info("Delete Not Available", "Inventory items cannot be deleted. Use stock adjustment instead.");
          setConfirmDelete(null);
        }}
        title="Delete Item"
        message={`Delete ${confirmDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ icon: Icon, label, value, color, suffix }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="p-2 rounded-lg bg-white/60">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-lg font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-xs font-normal ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
};

export default InventoryPage;