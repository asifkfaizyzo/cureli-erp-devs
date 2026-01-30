// src/pages/inventory/InventoryPage.jsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useToast } from "../../components/common/Toast";
import { useInventory } from "../../hooks/useInventory";
import InventoryFilters from "./components/InventoryFilters";
import InventoryTable from "./components/InventoryTable";
import ViewInventoryModal from "./components/ViewInventoryModal";
import StockAdjustmentModal from "./components/StockAdjustmentModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { AlertCircle, RefreshCw, Package, TrendingDown, AlertTriangle, Clock } from "lucide-react";

// Skeleton Summary Card
const SkeletonSummaryCard = ({ delay = 0 }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
    <div className="p-2 rounded-lg bg-slate-200 animate-pulse" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-[18px] h-[18px]" />
    </div>
    <div className="flex-1">
      <div className="w-16 h-2.5 bg-slate-200 rounded animate-pulse mb-1.5" style={{ animationDelay: `${delay + 50}ms` }} />
      <div className="w-12 h-5 bg-slate-200 rounded animate-pulse" style={{ animationDelay: `${delay + 100}ms` }} />
    </div>
  </div>
);

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

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasLoadedOnce = useRef(false);

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
    
    const timeoutId = setTimeout(() => {
      fetchInventory(apiFilters).then(() => {
        if (!hasLoadedOnce.current) {
          hasLoadedOnce.current = true;
          setIsInitialLoad(false);
        }
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.branchId, filters.includeExpired, filters.lowStock, fetchInventory]);

  // Mark initial load complete when items arrive
  useEffect(() => {
    if (items.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
      hasLoadedOnce.current = true;
    }
  }, [items.length, isInitialLoad]);

  // ============================================
  // SEARCH FUNCTION - Uses exact field names from API
  // ============================================
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      // ==========================================
      // 1. SEARCH FILTER - Searches across all fields
      // ==========================================
      let matchesSearch = true;
      
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        
        // Get all searchable string values
        const fieldsToSearch = [
          item.name,              // Medicine name
          item.batch,             // Batch number
          item.batch_number,      // Batch number (alternate)
          item.supplier,          // Supplier name
          item.manufacturer,      // Manufacturer
          item.mfac,              // Manufacturer (alternate)
          item.category,          // Category
          item.hsn,               // HSN code
          item.rack,              // Rack location
          item.rack_no,           // Rack location (alternate)
        ];
        
        // Check if any field contains the search term
        matchesSearch = fieldsToSearch.some(fieldValue => {
          if (fieldValue === null || fieldValue === undefined) return false;
          return String(fieldValue).toLowerCase().includes(searchTerm);
        });
      }
      
      // ==========================================
      // 2. STATUS DROPDOWN FILTER
      // ==========================================
      const matchesStatus = !filters.status || item.status === filters.status;
      
      // ==========================================
      // 3. SUPPLIER DROPDOWN FILTER
      // ==========================================
      const matchesSupplier = !filters.supplier || item.supplier === filters.supplier;
      
      // ==========================================
      // 4. CATEGORY DROPDOWN FILTER
      // ==========================================
      const matchesCategory = !filters.category || item.category === filters.category;
      
      // ==========================================
      // 5. EXPIRY FILTER
      // ==========================================
      let matchesExpiry = true;
      if (filters.expiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const expiryValue = item.expiry_date || item.expiry;
        const expiryDate = expiryValue ? new Date(expiryValue) : null;
        
        if (expiryDate) {
          expiryDate.setHours(0, 0, 0, 0);
          
          if (filters.expiry === "expired") {
            matchesExpiry = expiryDate < today;
          } else if (filters.expiry === "30days") {
            const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            matchesExpiry = expiryDate >= today && expiryDate <= thirtyDays;
          } else if (filters.expiry === "90days") {
            const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
            matchesExpiry = expiryDate >= today && expiryDate <= ninetyDays;
          }
        } else {
          matchesExpiry = false;
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
      batchNumber: selectedItem.batch_number || selectedItem.batch,
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
    const suppliers = items
      .map(item => item.supplier)
      .filter(Boolean);
    return [...new Set(suppliers)].sort();
  }, [items]);

  const uniqueCategories = useMemo(() => {
    const categories = items
      .map(item => item.category)
      .filter(Boolean);
    return [...new Set(categories)].sort();
  }, [items]);

  // Determine loading states
  const isTableLoading = loading && !isInitialLoad;
  const isSummaryLoading = isInitialLoad && loading;

  // Error state
  if (error && items.length === 0 && !loading) {
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
      <div className="shrink-0 p-4 pb-0">
        <div className="grid grid-cols-5 gap-3">
          {isSummaryLoading ? (
            <>
              <SkeletonSummaryCard delay={0} />
              <SkeletonSummaryCard delay={50} />
              <SkeletonSummaryCard delay={100} />
              <SkeletonSummaryCard delay={150} />
              <SkeletonSummaryCard delay={200} />
            </>
          ) : (
            <>
              <SummaryCard
                icon={Package}
                label="Total Items"
                value={summary?.totalItems || 0}
                color="blue"
              />
              <SummaryCard
                icon={Package}
                label="Total Stock"
                value={summary?.totalStockQuantity || 0}
                color="green"
                suffix="units"
              />
              <SummaryCard
                icon={TrendingDown}
                label="Low Stock"
                value={summary?.lowStockCount || 0}
                color="yellow"
              />
              <SummaryCard
                icon={Clock}
                label="Expiring Soon"
                value={summary?.expiringSoonCount || 0}
                color="orange"
              />
              <SummaryCard
                icon={AlertTriangle}
                label="Expired"
                value={summary?.expiredCount || 0}
                color="red"
              />
            </>
          )}
        </div>
      </div>

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
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing || loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
        <InventoryTable
          items={filteredData}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjust={handleStockAdjustment}
          isLoading={isInitialLoad && loading}
          isSearching={isTableLoading}
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

export default InventoryPage;