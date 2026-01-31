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

  const branchContext = useAuthStore(selectBranchContext);
  const branchMode = branchContext.mode;
  const branchId = branchContext.branch_id;
  const branchName = branchContext.branch_name;

  const fetchInventory = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await inventoryAPI.getAll(filters);
      
      if (response.success) {
        const rawData = response.data.inventories || response.data || [];
        console.log("📦 Raw inventory data from API:", rawData.slice(0, 2));
        
        const mappedItems = mapInventoryData(rawData);
        console.log("📦 Mapped inventory data:", mappedItems.slice(0, 2));
        
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

  const createAdjustment = useCallback(async (adjustmentData) => {
    try {
      const response = await inventoryAPI.createAdjustment(adjustmentData);
      if (response.success) {
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

  const refresh = useCallback((filters = {}) => {
    fetchInventory(filters);
    fetchSummary(filters.branchId);
  }, [fetchInventory, fetchSummary]);

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
    currentBranchMode: branchMode,
    currentBranchId: branchId,
    currentBranchName: branchName,
  };
};

// ✅ FIXED: Complete field mapping with all fallbacks
export const mapInventoryData = (inventories) => {
  if (!Array.isArray(inventories)) {
    console.warn("mapInventoryData received non-array:", inventories);
    return [];
  }

  return inventories.map((inv, index) => {
    // Debug first item
    if (index === 0) {
      console.log("🔍 First inventory item raw data:", {
        inventory_id: inv.inventory_id,
        medicine: inv.medicine,
        batch_number: inv.batch_number,
        current_stock: inv.current_stock,
        expiry_date: inv.expiry_date,
        status: inv.status,
      });
    }

    // ✅ CRITICAL: Get medicine data - handle both nested and flat structures
    const medicine = inv.medicine || {};
    const medicineName = medicine.name || inv.name || inv.medicine_name || "Unknown";
    const manufacturer = medicine.manufacturer || inv.manufacturer || inv.mfac || "-";
    const category = medicine.category || inv.category || "-";
    const hsnCode = medicine.hsn_code || inv.hsn_code || inv.hsn || "-";
    const packSize = medicine.pack_size || inv.pack_size || inv.pack || "-";
    
    // Branch data
    const branch = inv.branch || {};
    const branchName = branch.branch_name || inv.branch_name || "-";
    
    // Format expiry date
    const formattedExpiry = formatExpiryDate(inv.expiry_date);
    
    // Calculate status using all available thresholds
    const status = inv.status || calculateStatus({
      current_stock: inv.current_stock,
      minimum_stock: inv.minimum_stock,
      medicine_min_stock: medicine.min_stock_level || inv.medicine_min_stock,
      medicine_reorder_point: medicine.reorder_point || inv.medicine_reorder_point,
      is_expired: inv.is_expired,
      expiry_date: inv.expiry_date,
    });

    const mapped = {
      // IDs
      id: inv.inventory_id,
      inventory_id: inv.inventory_id,
      medicine_id: inv.medicine_id,
      shop_id: inv.shop_id,
      branch_id: inv.branch_id,
      
      // ✅ CRITICAL: Product display fields
      name: medicineName,
      category: category,
      manufacturer: manufacturer,
      mfac: manufacturer,
      hsn: hsnCode,
      pack: packSize,
      
      // Batch & Expiry
      batch: inv.batch_number || "-",
      batch_number: inv.batch_number,
      expiry: formattedExpiry,
      expiry_date: inv.expiry_date,
      
      // Stock info
      qty: Number(inv.current_stock ?? 0),
      current_stock: Number(inv.current_stock ?? 0),
      available_stock: Number(inv.available_stock ?? inv.current_stock ?? 0),
      reserved_stock: Number(inv.reserved_stock ?? 0),
      minStock: inv.minimum_stock ?? medicine.min_stock_level ?? null,
      minimum_stock: inv.minimum_stock,
      
      // Medicine-level thresholds
      medicine_min_stock: medicine.min_stock_level,
      medicine_max_stock: medicine.max_stock_level,
      medicine_reorder_point: medicine.reorder_point,
      
      // Pricing
      mrp: Number(inv.mrp ?? 0),
      slr: inv.selling_rate ?? null,
      selling_rate: inv.selling_rate,
      purchaseRate: inv.last_purchase_rate ?? null,
      last_purchase_rate: inv.last_purchase_rate,
      
      // Location
      rack: inv.rack_no || "-",
      rack_no: inv.rack_no,
      
      // Branch info
      branch: branchName,
      branch_name: branchName,
      
      // Supplier
      supplier: inv.supplier_name || "-",
      supplier_name: inv.supplier_name,
      
      // Status
      status: status,
      is_expired: inv.is_expired,
      is_active: inv.is_active,
      
      // Timestamps
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      last_purchase_date: inv.last_purchase_date,
    };

    // Debug first mapped item
    if (index === 0) {
      console.log("🔍 First inventory item MAPPED:", {
        name: mapped.name,
        category: mapped.category,
        manufacturer: mapped.manufacturer,
        batch: mapped.batch,
        qty: mapped.qty,
        status: mapped.status,
      });
    }

    return mapped;
  });
};

// Helper to format expiry date
const formatExpiryDate = (dateString) => {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  } catch {
    return "-";
  }
};

// ✅ ENHANCED: Status calculation with all thresholds
const calculateStatus = (inv) => {
  const currentStock = Number(inv.current_stock ?? inv.qty ?? 0);
  
  // Get thresholds - prioritize inventory level, then medicine level
  const minStock = Number(inv.minimum_stock ?? inv.minStock ?? inv.medicine_min_stock ?? 0);
  const reorderPoint = Number(inv.medicine_reorder_point ?? inv.reorder_point ?? 0);
  
  // 1. Check if expired
  if (inv.is_expired) {
    return "Expired";
  }
  
  // 2. Check expiry date
  if (inv.expiry_date) {
    const expiryDate = new Date(inv.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return "Expired";
    if (daysUntilExpiry <= 30) return "Expiring Soon";
  }
  
  // 3. Out of stock
  if (currentStock <= 0) {
    return "Out of Stock";
  }
  
  // 4. Low stock - check reorder point first, then min stock
  if (reorderPoint > 0 && currentStock <= reorderPoint) {
    return "Low Stock";
  }
  if (minStock > 0 && currentStock <= minStock) {
    return "Low Stock";
  }
  
  // 5. Default fallback when no thresholds set
  if (minStock === 0 && reorderPoint === 0) {
    if (currentStock <= 5) return "Low Stock";
  }
  
  return "In Stock";
};

export default useInventory;