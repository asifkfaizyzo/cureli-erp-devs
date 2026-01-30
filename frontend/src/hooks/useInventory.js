// src/hooks/useInventory.js

import { useState, useEffect, useCallback } from "react";
import inventoryAPI from "../api/inventory";
import { useAuthStore, selectBranchContext } from "../store/useAuthStore";

export const useInventory = (initialFilters = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
  });

  // ✅ NEW: Subscribe to branch context changes
  const branchContext = useAuthStore(selectBranchContext);
  const branchMode = branchContext.mode;
  const branchId = branchContext.branch_id;
  const branchName = branchContext.branch_name;

  // Fetch inventory list
  const fetchInventory = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await inventoryAPI.getAll(filters);
      
      if (response.success) {
        // Map API data to component format
        const mappedItems = mapInventoryData(response.data.inventories || response.data);
        setItems(mappedItems);
        setPagination({
          total: response.data.total || mappedItems.length,
          limit: filters.limit || 100,
          offset: filters.offset || 0,
        });
      } else {
        throw new Error(response.message || "Failed to fetch inventory");
      }
    } catch (err) {
      console.error("Fetch inventory error:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch inventory");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch inventory summary
  const fetchSummary = useCallback(async (branchIdParam = null) => {
    try {
      const response = await inventoryAPI.getSummary(branchIdParam);
      
      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error("Fetch summary error:", err);
    }
  }, []);

  // Fetch inventory by medicine
  const fetchByMedicine = useCallback(async (medicineId, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await inventoryAPI.getByMedicine(medicineId, filters);
      
      if (response.success) {
        const mappedItems = mapInventoryData(response.data);
        setItems(mappedItems);
      } else {
        throw new Error(response.message || "Failed to fetch inventory");
      }
    } catch (err) {
      console.error("Fetch by medicine error:", err);
      setError(err.response?.data?.message || err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create stock adjustment
  const createAdjustment = useCallback(async (adjustmentData) => {
    try {
      const response = await inventoryAPI.createAdjustment(adjustmentData);
      
      if (response.success) {
        // Refresh inventory after adjustment
        await fetchInventory();
        await fetchSummary();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || "Failed to create adjustment");
      }
    } catch (err) {
      console.error("Create adjustment error:", err);
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || "Failed to create adjustment" 
      };
    }
  }, [fetchInventory, fetchSummary]);

  // Refresh data
  const refresh = useCallback((filters = {}) => {
    fetchInventory(filters);
    fetchSummary(filters.branchId);
  }, [fetchInventory, fetchSummary]);

  // ✅ NEW: Re-fetch when branch context changes
  useEffect(() => {
    console.log("🔄 Branch context changed, refetching inventory...", { 
      branchMode, 
      branchId, 
      branchName 
    });
    
    fetchInventory(initialFilters);
    fetchSummary();
  }, [branchMode, branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    error,
    summary,
    pagination,
    fetchInventory,
    fetchByMedicine,
    fetchSummary,
    createAdjustment,
    refresh,
    setItems,
    // ✅ NEW: Expose branch context for UI
    currentBranchMode: branchMode,
    currentBranchId: branchId,
    currentBranchName: branchName,
  };
};

// Helper function to map API data to component format
export const mapInventoryData = (inventories) => {
  if (!Array.isArray(inventories)) {
    return [];
  }

  return inventories.map((inv) => ({
    // Keep original API fields
    id: inv.inventory_id,
    inventory_id: inv.inventory_id,
    medicine_id: inv.medicine_id,
    shop_id: inv.shop_id,
    branch_id: inv.branch_id,
    
    // Map to component display fields
    name: inv.medicine?.name || inv.name || "Unknown",
    category: inv.medicine?.category || inv.category || "-",
    manufacturer: inv.medicine?.manufacturer || inv.manufacturer || "-",
    mfac: inv.medicine?.manufacturer || inv.mfac || "-",
    hsn: inv.medicine?.hsn_code || inv.hsn || "-",
    
    // Batch & Expiry
    batch: inv.batch_number || inv.batch || "-",
    batch_number: inv.batch_number,
    expiry: formatExpiryDate(inv.expiry_date),
    expiry_date: inv.expiry_date,
    
    // Stock info
    qty: inv.current_stock ?? inv.qty ?? 0,
    current_stock: inv.current_stock ?? 0,
    available_stock: inv.available_stock ?? 0,
    reserved_stock: inv.reserved_stock ?? 0,
    minStock: inv.minimum_stock ?? inv.minStock ?? null,
    minimum_stock: inv.minimum_stock,
    
    // Pricing
    mrp: inv.mrp ?? 0,
    slr: inv.selling_rate ?? inv.slr ?? null,
    selling_rate: inv.selling_rate,
    purchaseRate: inv.last_purchase_rate ?? inv.purchaseRate ?? null,
    last_purchase_rate: inv.last_purchase_rate,
    
    // Location
    rack: inv.rack_no || inv.rack || "-",
    rack_no: inv.rack_no,
    
    // Branch info
    branch: inv.branch?.branch_name || "-",
    branch_name: inv.branch?.branch_name || null,
    
    // Supplier - if available from purchase history
    supplier: inv.supplier_name || "-",
    supplier_name: inv.supplier_name || null,
    
    // Status calculation
    status: calculateStatus(inv),
    is_expired: inv.is_expired,
    is_active: inv.is_active,
    
    // Timestamps
    created_at: inv.created_at,
    updated_at: inv.updated_at,
    last_purchase_date: inv.last_purchase_date,
    
    // Original data for reference
    _original: inv,
  }));
};

// Helper to format expiry date
const formatExpiryDate = (dateString) => {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  } catch {
    return "-";
  }
};

// Helper to calculate status
const calculateStatus = (inv) => {
  const currentStock = Number(inv.current_stock ?? inv.qty ?? 0);
  const minStock = Number(inv.minimum_stock ?? inv.minStock ?? 0);
  
  // Check if expired
  if (inv.is_expired) {
    return "Expired";
  }
  
  // Check expiry date
  if (inv.expiry_date) {
    const expiryDate = new Date(inv.expiry_date);
    const today = new Date();
    if (expiryDate < today) {
      return "Expired";
    }
  }
  
  // Stock status
  if (currentStock <= 0) {
    return "Out of Stock";
  }
  
  if (minStock > 0 && currentStock <= minStock) {
    return "Low Stock";
  }
  
  return "In Stock";
};

export default useInventory;