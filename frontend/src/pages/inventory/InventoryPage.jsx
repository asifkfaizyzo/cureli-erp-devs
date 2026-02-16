// src/pages/inventory/InventoryPage.jsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useToast } from "../../components/common/Toast";
import { useInventory } from "../../hooks/useInventory";
import { useAuthStore, selectBranchContext, selectIsSuperAdmin } from "../../store/useAuthStore";
import InventoryFilters from "./components/InventoryFilters";
import InventoryTable from "./components/InventoryTable";
import ViewInventoryModal from "./components/ViewInventoryModal";
import StockAdjustmentModal from "./components/StockAdjustmentModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ProductMasterModal from "../../components/common/ProductMasterModal";
import medicinesAPI from "../../api/medicines";
import { 
  AlertCircle, 
  RefreshCw, 
  Package, 
  TrendingDown, 
  AlertTriangle, 
  Clock,
  Layers,
  Building2,
  Info
} from "lucide-react";

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

// Branch Context Banner Component
const BranchContextBanner = ({ isGlobalMode, branchName, itemCount }) => {
  if (isGlobalMode) {
    return (
      <div className="shrink-0 px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Layers size={16} className="text-blue-500" />
          <span>Viewing inventory from <strong>All Branches</strong></span>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            Combined View
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <Info size={12} />
          <span>Stock adjustments require selecting a specific branch</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
      <div className="flex items-center gap-2 text-sm text-green-700">
        <Building2 size={16} className="text-green-500" />
        <span>Viewing inventory for <strong>{branchName || "Selected Branch"}</strong></span>
        {itemCount > 0 && (
          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
            {itemCount} items
          </span>
        )}
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const toast = useToast();

  // Branch context from store
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const isGlobalMode = branchContext.mode === "GLOBAL";
  const canAdjustStock = branchContext.mode === "BRANCH" && !!branchContext.branch_id;

  // ✅ IMPORTANT: Destructure ALL methods from useInventory including updateInventory and deleteInventory
  const {
    items,
    loading,
    error,
    summary,
    fetchInventory,
    createAdjustment,
    updateInventory,    // ✅ ADD THIS
    deleteInventory,    // ✅ ADD THIS
    refresh,
    currentBranchMode,
    currentBranchId,
    currentBranchName,
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
    branch: "",
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
  const [deleting, setDeleting] = useState(false);  // ✅ ADD: Delete loading state

  // Add Medicine Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Handler to open Add Medicine modal
  const handleAddMedicine = useCallback(() => {
    if (isGlobalMode) {
      toast.warning(
        "Branch Required",
        "Please select a specific branch to add medicines"
      );
      return;
    }
    setProductModalOpen(true);
  }, [isGlobalMode, toast]);

  // Handler to save new medicine
  const handleMedicineSave = useCallback(async (medicineData) => {
    try {
      const toNumberOrNull = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const payload = {
        name: medicineData.name,
        generic_name: medicineData.genericName || null,
        manufacturer: medicineData.manufacturer,
        category: medicineData.category || null,
        sub_category: medicineData.subCategory || null,
        schedule: medicineData.schedule || null,
        hsn_code: medicineData.hsnCode || null,
        pack_size: medicineData.packSize || null,
        unit_of_measure: medicineData.unitOfMeasure || "UNIT",
        gst_percentage: toNumberOrNull(medicineData.gst) ?? 12,
        cgst_percentage: toNumberOrNull(medicineData.cgstPercent) ?? 6,
        sgst_percentage: toNumberOrNull(medicineData.sgstPercent) ?? 6,
        rack_no: medicineData.rackNo || null,
        min_stock_level: toNumberOrNull(medicineData.min_stock_level),
        max_stock_level: toNumberOrNull(medicineData.max_stock_level),
        reorder_point: toNumberOrNull(medicineData.reorder_point),
      };

      console.log("📤 Creating medicine with stock levels:", {
        name: payload.name,
        min_stock_level: payload.min_stock_level,
        max_stock_level: payload.max_stock_level,
        reorder_point: payload.reorder_point,
      });

      const response = await medicinesAPI.create(payload);
      
      console.log("✅ Medicine created:", {
        id: response.data.medicine_id,
        min_stock_level: response.data.min_stock_level,
        max_stock_level: response.data.max_stock_level,
        reorder_point: response.data.reorder_point,
      });
      
      toast.success(
        "Medicine Added", 
        `${medicineData.name} has been added to the master list.`
      );
      
      setProductModalOpen(false);
      await refresh(filters);
      
    } catch (error) {
      console.error("Create medicine error:", error);
      toast.error(
        "Failed to add medicine", 
        error.response?.data?.message || error.message
      );
      throw error;
    }
  }, [toast, refresh, filters]);

  // Filter change handler
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

  // Filtered data with improved filtering logic
  const filteredData = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items.filter((item) => {
      // Search filter
      let matchesSearch = true;
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        const getVal = (val) => {
          if (val === null || val === undefined || val === "-") return "";
          return String(val).toLowerCase();
        };
        const searchableFields = [
          getVal(item.name),
          getVal(item.batch),
          getVal(item.batch_number),
          getVal(item.supplier),
          getVal(item.supplier_name),
          getVal(item.manufacturer),
          getVal(item.mfac),
          getVal(item.category),
          getVal(item.hsn),
          getVal(item.rack),
          getVal(item.rack_no),
          getVal(item.branch),
          getVal(item.branch_name),
        ];
        matchesSearch = searchableFields.some(field => field.includes(searchTerm));
      }
      
      // Status filter
      let matchesStatus = true;
      if (filters.status) {
        const itemStatus = (item.status || "").toLowerCase().trim();
        const filterStatus = filters.status.toLowerCase().trim();
        matchesStatus = itemStatus === filterStatus;
      }
      
      // Supplier filter
      let matchesSupplier = true;
      if (filters.supplier) {
        const itemSupplier = (item.supplier || item.supplier_name || "").toLowerCase();
        matchesSupplier = itemSupplier === filters.supplier.toLowerCase();
      }
      
      // Category filter
      let matchesCategory = true;
      if (filters.category) {
        const itemCategory = (item.category || "").toLowerCase();
        matchesCategory = itemCategory === filters.category.toLowerCase();
      }

      // Branch filter
      let matchesBranch = true;
      if (filters.branch) {
        const itemBranch = (item.branch || item.branch_name || "").toLowerCase();
        matchesBranch = itemBranch === filters.branch.toLowerCase();
      }
      
      // Expiry filter
      let matchesExpiry = true;
      if (filters.expiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let expiryDate = null;
        const expiryValue = item.expiry_date || item.expiry;
        
        if (expiryValue) {
          if (typeof expiryValue === 'string') {
            if (expiryValue.includes('/')) {
              const parts = expiryValue.split('/');
              if (parts.length === 2) {
                const month = parseInt(parts[0]) - 1;
                let year = parseInt(parts[1]);
                if (year < 100) year += 2000;
                expiryDate = new Date(year, month + 1, 0);
              }
            } else {
              expiryDate = new Date(expiryValue);
            }
          } else if (expiryValue instanceof Date) {
            expiryDate = expiryValue;
          }
        }
        
        if (expiryDate && !isNaN(expiryDate.getTime())) {
          expiryDate.setHours(0, 0, 0, 0);
          
          switch (filters.expiry) {
            case "expired":
              matchesExpiry = expiryDate < today;
              break;
            case "30days": {
              const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
              matchesExpiry = expiryDate >= today && expiryDate <= thirtyDays;
              break;
            }
            case "90days": {
              const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
              matchesExpiry = expiryDate >= today && expiryDate <= ninetyDays;
              break;
            }
            case "valid": {
              const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
              matchesExpiry = expiryDate > ninetyDays;
              break;
            }
            default:
              matchesExpiry = true;
          }
        } else {
          matchesExpiry = false;
        }
      }

      // Low stock quick filter
      let matchesLowStock = true;
      if (filters.lowStock) {
        const status = (item.status || "").toLowerCase();
        matchesLowStock = status === "low stock" || status === "out of stock";
      }

      return matchesSearch && matchesStatus && matchesSupplier && 
             matchesCategory && matchesBranch && matchesExpiry && matchesLowStock;
    });
  }, [items, filters]);

  // Extract unique values for filter dropdowns
  const uniqueSuppliers = useMemo(() => {
    const suppliers = items
      .map(item => item.supplier || item.supplier_name)
      .filter(Boolean)
      .filter(s => s !== "-" && s.trim() !== "");
    return [...new Set(suppliers)].sort();
  }, [items]);

  const uniqueCategories = useMemo(() => {
    const categories = items
      .map(item => item.category)
      .filter(Boolean)
      .filter(c => c !== "-" && c.trim() !== "");
    return [...new Set(categories)].sort();
  }, [items]);

  const uniqueBranches = useMemo(() => {
    const branches = items
      .map(item => item.branch || item.branch_name)
      .filter(Boolean)
      .filter(b => b !== "-" && b.trim() !== "");
    return [...new Set(branches)].sort();
  }, [items]);

  // Calculate stats from filtered data
  const calculatedStats = useMemo(() => {
    return {
      totalItems: items.length,
      totalStock: items.reduce((sum, i) => sum + Number(i.qty || i.current_stock || 0), 0),
      lowStock: items.filter(i => (i.status || "").toLowerCase() === "low stock").length,
      outOfStock: items.filter(i => (i.status || "").toLowerCase() === "out of stock").length,
      expired: items.filter(i => (i.status || "").toLowerCase() === "expired").length,
      expiringSoon: items.filter(i => (i.status || "").toLowerCase() === "expiring soon").length,
    };
  }, [items]);

  // =====================
  // HANDLERS
  // =====================
  
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
    if (!canAdjustStock) {
      toast.warning("Branch Required", "Please select a specific branch to edit items");
      return;
    }
    setSelectedItem(row);
    setModalMode("edit");
    setOpenModal(true);
  };

  const handleDelete = (row) => {
    if (!canAdjustStock) {
      toast.warning("Branch Required", "Please select a specific branch to delete items");
      return;
    }
    setConfirmDelete(row);
  };

  const handleStockAdjustment = (row) => {
    if (!canAdjustStock) {
      toast.warning(
        "Branch Required",
        "Please select a specific branch to make stock adjustments"
      );
      return;
    }
    setSelectedItem(row);
    setAdjustmentModal(true);
  };

  // ✅ UPDATED: Handle save with complete inventory update
  const handleEditSave = async (editedItem) => {
    try {
      console.log('📤 handleEditSave - Full data:', editedItem);

      // Call the inventory update API
      const result = await updateInventory(editedItem.inventory_id, {
        // Product Information
        name: editedItem.name,
        manufacturer: editedItem.manufacturer,
        category: editedItem.category,
        hsn_code: editedItem.hsn_code,
        
        // Batch Info
        batch_number: editedItem.batch_number,
        expiry_date: editedItem.expiry_date || editedItem.expiry,
        
        // Pricing
        mrp: editedItem.mrp,
        selling_rate: editedItem.selling_rate,
        last_purchase_rate: editedItem.purchase_rate || editedItem.last_purchase_rate,
        
        // Location
        rack_no: editedItem.rack_no,
        
        // Stock thresholds
        min_stock_level: editedItem.min_stock_level,
        max_stock_level: editedItem.max_stock_level,
        reorder_point: editedItem.reorder_point,
        minimum_stock: editedItem.minimum_stock,
      });

      if (result.success) {
        console.log('✅ Inventory updated successfully');
        toast.success('Item Updated', 'All changes have been saved successfully.');
        setOpenModal(false);
        setSelectedItem(null);
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      toast.error('Save Failed', error.message || 'Failed to update inventory item');
      throw error;
    }
  };

  // ✅ NEW: Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    
    setDeleting(true);
    try {
      const result = await deleteInventory(confirmDelete.inventory_id);
      
      if (result.success) {
        toast.success('Item Deleted', `${confirmDelete.name} has been removed from inventory.`);
        setConfirmDelete(null);
      } else {
        // Check for specific error codes
        if (result.error?.includes('stock') || result.error?.includes('STOCK_EXISTS')) {
          toast.error(
            'Cannot Delete', 
            'Cannot delete inventory with existing stock. Use stock adjustment to reduce to zero first.'
          );
        } else {
          toast.error('Delete Failed', result.error || 'Failed to delete inventory item');
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete Failed', error.message || 'An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const handleAdjustmentSubmit = async (adjustmentData) => {
    const result = await createAdjustment({
      shopId: selectedItem.shop_id,
      branchId: selectedItem.branch_id || currentBranchId,
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
      {/* BRANCH CONTEXT BANNER */}
      {isSuperAdmin && (
        <BranchContextBanner 
          isGlobalMode={isGlobalMode}
          branchName={currentBranchName}
          itemCount={filteredData.length}
        />
      )}

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
                value={summary?.totalItems || calculatedStats.totalItems}
                color="blue"
              />
              <SummaryCard
                icon={Package}
                label="Total Stock"
                value={summary?.totalStockQuantity || calculatedStats.totalStock}
                color="green"
                suffix="units"
              />
              <SummaryCard
                icon={TrendingDown}
                label="Low Stock"
                value={summary?.lowStockCount || calculatedStats.lowStock}
                color="yellow"
              />
              <SummaryCard
                icon={Clock}
                label="Expiring Soon"
                value={summary?.expiringSoonCount || calculatedStats.expiringSoon}
                color="orange"
              />
              <SummaryCard
                icon={AlertTriangle}
                label="Expired"
                value={summary?.expiredCount || calculatedStats.expired}
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
              branches={uniqueBranches}
              showBranchFilter={isGlobalMode}
              onAddMedicine={handleAddMedicine}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 px-2">
              {filteredData.length} of {items.length} items
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
          showBranchColumn={isGlobalMode}
          canAdjustStock={canAdjustStock}
        />
      </div>

      {/* VIEW/EDIT MODAL */}
      <ViewInventoryModal
        open={openModal}
        item={selectedItem}
        mode={modalMode}
        onClose={() => {
          setOpenModal(false);
          setSelectedItem(null);
        }}
        onSave={handleEditSave}
        onDelete={handleDelete}
        onAdjust={handleStockAdjustment}
        canAdjustStock={canAdjustStock}
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

      {/* ✅ UPDATED: CONFIRM DELETE with proper async handler */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        message={
          confirmDelete ? (
            <div className="space-y-2">
              <p>Are you sure you want to delete this inventory item?</p>
              <div className="bg-slate-50 p-3 rounded-lg text-sm">
                <p><strong>Item:</strong> {confirmDelete.name}</p>
                <p><strong>Batch:</strong> {confirmDelete.batch || confirmDelete.batch_number || '-'}</p>
                <p><strong>Current Stock:</strong> {confirmDelete.qty || confirmDelete.current_stock || 0} units</p>
              </div>
              {Number(confirmDelete.qty || confirmDelete.current_stock || 0) > 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                  <AlertTriangle size={14} />
                  <span>Items with stock cannot be deleted. Reduce stock to zero first.</span>
                </div>
              )}
            </div>
          ) : "Are you sure you want to delete this item?"
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmDisabled={deleting || Number(confirmDelete?.qty || confirmDelete?.current_stock || 0) > 0}
        type="danger"
      />

      {/* ADD MEDICINE MODAL */}
      <ProductMasterModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSave={handleMedicineSave}
        initialData={{}}
        mode="create"
      />
    </div>
  );
};

export default InventoryPage;