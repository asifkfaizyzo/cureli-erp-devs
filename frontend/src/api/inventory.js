// src/api/inventory.js

import api from "./axios";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Get branch context headers for API requests
 */
function getBranchHeaders() {
  const state = useAuthStore.getState();
  const { branchContext } = state;
  
  return {
    "X-Branch-Mode": branchContext.mode,
    "X-Branch-Id": branchContext.branch_id || "",
  };
}

const inventoryAPI = {
  /**
   * ✅ NEW: Get all inventory (alias for getAll)
   * This is what useInventoryData.js expects
   */
  getInventory: async (filters = {}) => {
    const response = await api.get("/inventory", { 
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Get inventory for a specific medicine
   */
  getByMedicine: async (medicineId, filters = {}) => {
    const response = await api.get(`/inventory/medicine/${medicineId}`, {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Get all inventory (alternative method name)
   */
  getAll: async (filters = {}) => {
    const response = await api.get("/inventory", { 
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Get stock summary
   */
  getSummary: async (branchId = null) => {
    const response = await api.get("/inventory/summary", {
      params: branchId ? { branchId } : {},
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Create stock adjustment
   */
  createAdjustment: async (data) => {
    const response = await api.post("/inventory/adjustment", data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Update inventory item
   */
  update: async (inventoryId, data) => {
    const response = await api.put(`/inventory/${inventoryId}`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Delete inventory item (soft delete)
   */
  delete: async (inventoryId) => {
    const response = await api.delete(`/inventory/${inventoryId}`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Get low stock items
   */
  getLowStock: async (filters = {}) => {
    const response = await api.get("/inventory/low-stock", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Get expiring soon items
   */
  getExpiringSoon: async (daysAhead = 90) => {
    const response = await api.get("/inventory/expiring-soon", {
      params: { daysAhead },
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Get stock ledger
   */
  getLedger: async (filters = {}) => {
    const response = await api.get("/inventory/ledger", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },
};

export default inventoryAPI;