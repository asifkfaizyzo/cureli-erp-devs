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

  // API integration
  const {
    items,
    loading,
    error,
    summary,
    fetchInventory,
    createAdjustment,
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

  // Debug: Log unique status values in data
  useEffect(() => {
    if (items.length > 0) {
      const uniqueStatuses = [...new Set(items.map(i => i.status))];
      console.log("📊 Unique status values in data:", uniqueStatuses);
      console.log("📊 Sample items:", items.slice(0, 3).map(i => ({ 
        name: i.name, 
        status: i.status, 
        qty: i.qty,
        current_stock: i.current_stock 
      })));
    }
  }, [items]);

  // ============================================
  // IMPROVED FILTERING LOGIC
  // ============================================
const filteredData = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items.filter((item) => {
      // ==========================================
      // 1. SEARCH FILTER - ✅ ENHANCED
      // ==========================================
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
          getVal(item.batch_number), // ✅ ADDED
          getVal(item.supplier),
          getVal(item.supplier_name), // ✅ ADDED
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
      
      // ==========================================
      // 2. STATUS FILTER - Case insensitive
      // ==========================================
      let matchesStatus = true;
      if (filters.status) {
        const itemStatus = (item.status || "").toLowerCase().trim();
        const filterStatus = filters.status.toLowerCase().trim();
        matchesStatus = itemStatus === filterStatus;
      }
      
      // ==========================================
      // 3. SUPPLIER FILTER
      // ==========================================
      let matchesSupplier = true;
      if (filters.supplier) {
        const itemSupplier = (item.supplier || item.supplier_name || "").toLowerCase();
        matchesSupplier = itemSupplier === filters.supplier.toLowerCase();
      }
      
      // ==========================================
      // 4. CATEGORY FILTER
      // ==========================================
      let matchesCategory = true;
      if (filters.category) {
        const itemCategory = (item.category || "").toLowerCase();
        matchesCategory = itemCategory === filters.category.toLowerCase();
      }

      // ==========================================
      // 5. BRANCH FILTER
      // ==========================================
      let matchesBranch = true;
      if (filters.branch) {
        const itemBranch = (item.branch || item.branch_name || "").toLowerCase();
        matchesBranch = itemBranch === filters.branch.toLowerCase();
      }
      
      // ==========================================
      // 6. EXPIRY FILTER
      // ==========================================
      let matchesExpiry = true;
      if (filters.expiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let expiryDate = null;
        const expiryValue = item.expiry_date || item.expiry;
        
        if (expiryValue) {
          if (typeof expiryValue === 'string') {
            if (expiryValue.includes('/')) {
              // MM/YYYY or MM/YY format
              const parts = expiryValue.split('/');
              if (parts.length === 2) {
                const month = parseInt(parts[0]) - 1;
                let year = parseInt(parts[1]);
                if (year < 100) year += 2000;
                expiryDate = new Date(year, month + 1, 0);
              }
            } else {
              // ISO format
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

      // ==========================================
      // 7. LOW STOCK QUICK FILTER
      // ==========================================
      let matchesLowStock = true;
      if (filters.lowStock) {
        const status = (item.status || "").toLowerCase();
        matchesLowStock = status === "low stock" || status === "out of stock";
      }

      return matchesSearch && matchesStatus && matchesSupplier && 
             matchesCategory && matchesBranch && matchesExpiry && matchesLowStock;
    });
  }, [items, filters]);

  // ============================================
  // EXTRACT UNIQUE VALUES FOR FILTER DROPDOWNS
  // ============================================
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

  // ============================================
  // HANDLERS
  // ============================================
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

  const handleSave = async (updated) => {
    setOpenModal(false);
    toast.success("Inventory Updated", "Inventory item updated successfully.");
    refresh(filters);
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
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
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