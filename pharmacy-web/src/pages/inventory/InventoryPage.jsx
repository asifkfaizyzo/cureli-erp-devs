// src/pages/inventory/InventoryPage.jsx

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useToast } from "../../components/common/Toast";
import { useInventoryData } from "../../hooks/inventory/useInventoryData";
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
} from "../../store/useAuthStore";
import InventoryFilters from "./components/InventoryFilters";
import InventoryTable from "./components/InventoryTable";
import ViewInventoryModal from "./components/ViewInventoryModal";
import StockAdjustmentModal from "./components/StockAdjustmentModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import AddInventoryModal from "./components/AddInventoryModal";
import inventoryAPI from "../../api/inventory";
import {
  RefreshCw,
  Package,
  TrendingDown,
  AlertTriangle,
  Clock,
  Layers,
  Building2,
  Info,
  Link2,
} from "lucide-react";

const safeString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return (
      value.branch_name ||
      value.name ||
      value.supplier_name ||
      value.medicine_name ||
      ""
    );
  }
  return String(value);
};

const SkeletonSummaryCard = ({ delay = 0 }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
    <div
      className="p-2 rounded-lg bg-slate-200 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-[18px] h-[18px]" />
    </div>
    <div className="flex-1">
      <div
        className="w-16 h-2.5 bg-slate-200 rounded animate-pulse mb-1.5"
        style={{ animationDelay: `${delay + 50}ms` }}
      />
      <div
        className="w-12 h-5 bg-slate-200 rounded animate-pulse"
        style={{ animationDelay: `${delay + 100}ms` }}
      />
    </div>
  </div>
);

const SummaryCard = ({ icon: Icon, label, value, color, suffix }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${colorClasses[color]}`}
    >
      <div className="p-2 rounded-lg bg-white/60">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">
          {label}
        </p>
        <p className="text-lg font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix && <span className="text-xs font-normal ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
};

const BranchContextBanner = ({ isGlobalMode, branchName, itemCount }) => {
  if (isGlobalMode) {
    return (
      <div className="shrink-0 px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Layers size={16} className="text-blue-500" />
          <span>
            Viewing inventory from <strong>All Branches</strong>
          </span>
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
        <span>
          Viewing inventory for{" "}
          <strong>{branchName || "Selected Branch"}</strong>
        </span>
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

  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const isGlobalMode = branchContext.mode === "GLOBAL";
  const canAdjustStock =
    branchContext.mode === "BRANCH" && !!branchContext.branch_id;

  const {
    medicines,
    loading,
    fetchInventory,
    deleteMedicine,
    catalogLinkStatus,
    catalogStatusLoading,
    refreshCatalogStatus,
  } = useInventoryData();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasLoadedOnce = useRef(false);

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

  // Sort state — sent to API
  const [sortConfig, setSortConfig] = useState({
    sortBy: null,
    order: null,
  });

  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [adjustmentModal, setAdjustmentModal] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── NEW state ─────────────────────────────────────────────────────────────
  const [addInventoryModalOpen, setAddInventoryModalOpen] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────

  // ── REPLACED handleAddMedicine ────────────────────────────────────────────
  const handleAddMedicine = useCallback(() => {
    if (isGlobalMode) {
      toast.warning(
        "Branch Required",
        "Please select a specific branch to add medicines",
      );
      return;
    }
    setAddInventoryModalOpen(true);
  }, [isGlobalMode, toast]);
  // ─────────────────────────────────────────────────────────────────────────

  // ── NEW handler ───────────────────────────────────────────────────────────
  const handleAddInventorySave = useCallback(
    async (data) => {
      try {
        await inventoryAPI.createWithMedicine(data);
        toast.success(
          "Medicine Added",
          `${data.name} has been added to inventory successfully.`,
        );
        setAddInventoryModalOpen(false);

        // ── FIX: pass branch context when refreshing, same as the fetch effect ──
        const refreshFilters = {};
        if (!isGlobalMode && branchContext.branch_id) {
          refreshFilters.branchId = branchContext.branch_id;
        }
        await fetchInventory(refreshFilters);
      } catch (error) {
        console.error("Add inventory error:", error);
        throw error;
      }
    },
    [toast, fetchInventory, isGlobalMode, branchContext.branch_id], // ← add deps
  );
  // ─────────────────────────────────────────────────────────────────────────

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Sort handler — cycles: none → asc → desc → none
  const handleSortChange = useCallback((column) => {
    setSortConfig((prev) => {
      if (prev.sortBy !== column) {
        return { sortBy: column, order: "asc" };
      }
      if (prev.order === "asc") {
        return { sortBy: column, order: "desc" };
      }
      return { sortBy: null, order: null };
    });
  }, []);

  // Single consolidated fetch effect — includes sort params
  useEffect(() => {
    const apiFilters = {};

    if (filters.search) apiFilters.search = filters.search;
    if (filters.includeExpired) apiFilters.includeExpired = true;
    if (filters.lowStock) apiFilters.lowStock = true;

    if (!isGlobalMode && branchContext.branch_id) {
      apiFilters.branchId = branchContext.branch_id;
    }

    if (filters.branchId) {
      apiFilters.branchId = filters.branchId;
    }

    if (sortConfig.sortBy) {
      apiFilters.sortBy = sortConfig.sortBy;
      apiFilters.sortOrder = sortConfig.order;
    }

    const delay = filters.search ? 300 : 0;

    const timeoutId = setTimeout(() => {
      fetchInventory(apiFilters)
        .then(() => {
          if (!hasLoadedOnce.current) {
            hasLoadedOnce.current = true;
            setIsInitialLoad(false);
          }
        })
        .catch(() => {
          if (!hasLoadedOnce.current) {
            hasLoadedOnce.current = true;
            setIsInitialLoad(false);
          }
        });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [
    filters.search,
    filters.branchId,
    filters.includeExpired,
    filters.lowStock,
    sortConfig.sortBy,
    sortConfig.order,
    fetchInventory,
    branchContext.branch_id,
    branchContext.mode,
    isGlobalMode,
  ]);

  useEffect(() => {
    if (Array.isArray(medicines) && medicines.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
      hasLoadedOnce.current = true;
    }
  }, [medicines, isInitialLoad]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(medicines) || medicines.length === 0) return [];

    return medicines.filter((item) => {
      if (!item) return false;

      const getVal = (val) => {
        if (val === null || val === undefined || val === "-") return "";
        if (typeof val === "object") {
          return val.branch_name || val.name || val.supplier_name || "";
        }
        return String(val).toLowerCase();
      };

      let matchesSearch = true;
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        const searchableFields = [
          getVal(item.name),
          getVal(item.medicine_name),
          getVal(item.batch),
          getVal(item.batch_number),
          getVal(item.supplier),
          getVal(item.supplier_name),
          getVal(item.manufacturer),
          getVal(item.medicine_manufacturer),
          getVal(item.category),
          getVal(item.medicine_category),
          getVal(item.hsn),
          getVal(item.medicine_hsn_code),
          getVal(item.rack_no),
          getVal(item.branch),
          getVal(item.branch_name),
        ];
        matchesSearch = searchableFields.some((field) =>
          field.includes(searchTerm),
        );
      }

      let matchesStatus = true;
      if (filters.status) {
        const itemStatus = getVal(item.status).toLowerCase().trim();
        const filterStatus = filters.status.toLowerCase().trim();
        matchesStatus = itemStatus === filterStatus;
      }

      let matchesSupplier = true;
      if (filters.supplier) {
        const itemSupplier = getVal(
          item.supplier || item.supplier_name,
        ).toLowerCase();
        matchesSupplier = itemSupplier === filters.supplier.toLowerCase();
      }

      let matchesCategory = true;
      if (filters.category) {
        const itemCategory = getVal(
          item.category || item.medicine_category,
        ).toLowerCase();
        matchesCategory = itemCategory === filters.category.toLowerCase();
      }

      let matchesBranch = true;
      if (filters.branch) {
        const itemBranch = getVal(
          item.branch || item.branch_name,
        ).toLowerCase();
        matchesBranch = itemBranch === filters.branch.toLowerCase();
      }

      let matchesExpiry = true;
      if (filters.expiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let expiryDate = null;
        const expiryValue = item.expiry_date || item.expiry;

        if (expiryValue) {
          if (typeof expiryValue === "string") {
            if (expiryValue.includes("/")) {
              const parts = expiryValue.split("/");
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
              const thirtyDays = new Date(
                today.getTime() + 30 * 24 * 60 * 60 * 1000,
              );
              matchesExpiry = expiryDate >= today && expiryDate <= thirtyDays;
              break;
            }
            case "90days": {
              const ninetyDays = new Date(
                today.getTime() + 90 * 24 * 60 * 60 * 1000,
              );
              matchesExpiry = expiryDate >= today && expiryDate <= ninetyDays;
              break;
            }
            case "valid": {
              const ninetyDays = new Date(
                today.getTime() + 90 * 24 * 60 * 60 * 1000,
              );
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

      let matchesLowStock = true;
      if (filters.lowStock) {
        const status = getVal(item.status).toLowerCase();
        matchesLowStock = status === "low stock" || status === "out of stock";
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSupplier &&
        matchesCategory &&
        matchesBranch &&
        matchesExpiry &&
        matchesLowStock
      );
    });
  }, [medicines, filters]);

  const uniqueSuppliers = useMemo(() => {
    if (!Array.isArray(medicines)) return [];
    const suppliers = medicines
      .map((item) => {
        if (item.supplier && typeof item.supplier === "object") {
          return item.supplier.supplier_name || item.supplier.name || "";
        }
        return safeString(item.supplier_name || item.supplier);
      })
      .filter((s) => s && s !== "-" && s.trim() !== "");
    return [...new Set(suppliers)].sort();
  }, [medicines]);

  const uniqueCategories = useMemo(() => {
    if (!Array.isArray(medicines)) return [];
    const categories = medicines
      .map((item) => {
        if (item.category && typeof item.category === "object") {
          return item.category.name || "";
        }
        return safeString(item.category || item.medicine_category);
      })
      .filter((c) => c && c !== "-" && c.trim() !== "");
    return [...new Set(categories)].sort();
  }, [medicines]);

  const uniqueBranches = useMemo(() => {
    if (!Array.isArray(medicines)) return [];
    const branches = medicines
      .map((item) => {
        if (item.branch && typeof item.branch === "object") {
          return item.branch.branch_name || "";
        }
        return safeString(item.branch_name || item.branch);
      })
      .filter((b) => b && b !== "-" && b.trim() !== "");
    return [...new Set(branches)].sort();
  }, [medicines]);

  const calculatedStats = useMemo(() => {
    if (!Array.isArray(medicines)) {
      return {
        totalItems: 0,
        totalStock: 0,
        lowStock: 0,
        outOfStock: 0,
        expired: 0,
        expiringSoon: 0,
      };
    }
    return {
      totalItems: medicines.length,
      totalStock: medicines.reduce(
        (sum, i) => sum + Number(i?.qty || i?.current_stock || 0),
        0,
      ),
      lowStock: medicines.filter(
        (i) => safeString(i?.status).toLowerCase() === "low stock",
      ).length,
      outOfStock: medicines.filter(
        (i) => safeString(i?.status).toLowerCase() === "out of stock",
      ).length,
      expired: medicines.filter(
        (i) => safeString(i?.status).toLowerCase() === "expired",
      ).length,
      expiringSoon: medicines.filter(
        (i) => safeString(i?.status).toLowerCase() === "expiring soon",
      ).length,
    };
  }, [medicines]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInventory();
      await refreshCatalogStatus();
      toast.success("Refreshed", "Inventory data updated");
    } catch (error) {
      toast.error("Refresh Failed", error.message || "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleView = (row) => {
    setSelectedItem(row);
    setModalMode("view");
    setOpenModal(true);
  };

  const handleEdit = (row) => {
    if (!canAdjustStock) {
      toast.warning(
        "Branch Required",
        "Please select a specific branch to edit items",
      );
      return;
    }
    setSelectedItem(row);
    setModalMode("edit");
    setOpenModal(true);
  };

  const handleDelete = (row) => {
    if (!canAdjustStock) {
      toast.warning(
        "Branch Required",
        "Please select a specific branch to delete items",
      );
      return;
    }
    setConfirmDelete(row);
  };

  const handleStockAdjustment = (row) => {
    if (!canAdjustStock) {
      toast.warning(
        "Branch Required",
        "Please select a specific branch to make stock adjustments",
      );
      return;
    }
    setAdjustmentItem(row);
    setOpenModal(false);
    setAdjustmentModal(true);
  };

  const handleEditSave = async (editedItem) => {
    try {
      await inventoryAPI.update(editedItem.inventory_id, editedItem);
      toast.success(
        "Item Updated",
        "All changes have been saved successfully.",
      );
      setOpenModal(false);
      setSelectedItem(null);
      await fetchInventory();
    } catch (error) {
      console.error("Failed to save inventory item:", error);
      toast.error(
        "Save Failed",
        error.response?.data?.message ||
          error.message ||
          "Failed to update inventory item",
      );
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteMedicine(confirmDelete.inventory_id);
      toast.success(
        "Item Deleted",
        `${confirmDelete.name || confirmDelete.medicine_name} has been removed from inventory.`,
      );
      setConfirmDelete(null);
      await fetchInventory();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        "Delete Failed",
        error.message || "An unexpected error occurred",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleAdjustmentSubmit = async (adjustmentData) => {
    try {
      await inventoryAPI.createAdjustment({
        inventoryId: adjustmentItem.inventory_id,
        medicineId: adjustmentItem.medicine_id,
        shopId: adjustmentItem.shop_id,
        branchId:
          adjustmentItem.branch_id ||
          (typeof adjustmentItem.branch === "object"
            ? adjustmentItem.branch?.branch_id
            : null),
        batchNumber:
          adjustmentItem.batch_number || adjustmentItem.batch || null,
        newQuantity: adjustmentData.newQuantity,
        reason: adjustmentData.reason,
        reasonNotes: adjustmentData.reasonNotes,
      });

      toast.success("Stock Adjusted", "Stock adjustment created successfully.");
      setAdjustmentModal(false);
      setAdjustmentItem(null);
      setSelectedItem(null);
      await fetchInventory();
    } catch (error) {
      console.error("Adjustment error:", error);
      toast.error(
        "Adjustment Failed",
        error.response?.data?.message ||
          error.message ||
          "Failed to adjust stock",
      );
      throw error;
    }
  };

  const isTableLoading = loading && !isInitialLoad;
  const isSummaryLoading = isInitialLoad && loading;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-50">
      {isSuperAdmin && (
        <BranchContextBanner
          isGlobalMode={isGlobalMode}
          branchName={branchContext.branch_name}
          itemCount={filteredData.length}
        />
      )}

      <div className="shrink-0 p-4 pb-3">
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
                value={calculatedStats.totalItems}
                color="blue"
              />
              <SummaryCard
                icon={Package}
                label="Total Stock"
                value={calculatedStats.totalStock}
                color="green"
                suffix="units"
              />
              <SummaryCard
                icon={TrendingDown}
                label="Low Stock"
                value={calculatedStats.lowStock}
                color="yellow"
              />
              <SummaryCard
                icon={Clock}
                label="Expiring Soon"
                value={calculatedStats.expiringSoon}
                color="orange"
              />
              <SummaryCard
                icon={AlertTriangle}
                label="Expired"
                value={calculatedStats.expired}
                color="red"
              />
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-3">
        <InventoryFilters
          filters={filters}
          onChange={handleFilterChange}
          suppliers={uniqueSuppliers}
          categories={uniqueCategories}
          branches={uniqueBranches}
          showBranchFilter={isGlobalMode}
          onAddMedicine={handleAddMedicine}
          onRefresh={handleRefresh}
          isRefreshing={refreshing || loading}
          totalItems={filteredData.length}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-4">
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
          catalogLinkStatus={catalogLinkStatus}
          catalogStatusLoading={catalogStatusLoading}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
        />
      </div>

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
        onAdjust={async (item, adjustmentData) => {
          if (adjustmentData) {
            try {
              await inventoryAPI.createAdjustment({
                inventoryId: item.inventory_id,
                medicineId: item.medicine_id,
                shopId: item.shop_id,
                branchId:
                  item.branch_id ||
                  (typeof item.branch === "object"
                    ? item.branch?.branch_id
                    : null),
                batchNumber: item.batch_number || item.batch || null,
                newQuantity: adjustmentData.newQuantity,
                reason: adjustmentData.reason,
                reasonNotes: adjustmentData.reasonNotes,
              });
              toast.success(
                "Stock Adjusted",
                "Stock adjustment saved successfully.",
              );
              setOpenModal(false);
              setSelectedItem(null);
              await fetchInventory();
            } catch (error) {
              console.error("Inline adjustment error:", error);
              throw error;
            }
          } else {
            handleStockAdjustment(item);
          }
        }}
        canAdjustStock={canAdjustStock}
      />

      {adjustmentModal && adjustmentItem && (
        <StockAdjustmentModal
          open={adjustmentModal}
          item={adjustmentItem}
          onClose={() => {
            setAdjustmentModal(false);
            setAdjustmentItem(null);
            setSelectedItem(null);
          }}
          onSubmit={handleAdjustmentSubmit}
        />
      )}

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
                <p>
                  <strong>Item:</strong>{" "}
                  {confirmDelete.name || confirmDelete.medicine_name}
                </p>
                <p>
                  <strong>Batch:</strong>{" "}
                  {confirmDelete.batch || confirmDelete.batch_number || "-"}
                </p>
                <p>
                  <strong>Current Stock:</strong>{" "}
                  {confirmDelete.qty || confirmDelete.current_stock || 0} units
                </p>
              </div>
              {Number(confirmDelete.qty || confirmDelete.current_stock || 0) >
                0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                  <AlertTriangle size={14} />
                  <span>
                    Items with stock cannot be deleted. Reduce stock to zero
                    first.
                  </span>
                </div>
              )}
            </div>
          ) : (
            "Are you sure you want to delete this item?"
          )
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmDisabled={
          deleting ||
          Number(confirmDelete?.qty || confirmDelete?.current_stock || 0) > 0
        }
        type="danger"
      />

      {/* ── NEW: AddInventoryModal ──────────────────────────────────────── */}
      <AddInventoryModal
        open={addInventoryModalOpen}
        onClose={() => setAddInventoryModalOpen(false)}
        onSave={handleAddInventorySave}
      />
      {/* ─────────────────────────────────────────────────────────────────── */}
    </div>
  );
};

export default InventoryPage;
