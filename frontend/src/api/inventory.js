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
   * Get inventory for a specific medicine
   */
  getByMedicine: async (medicineId, filters = {}) => {
    const response = await api.get(`/inventory/medicine/${medicineId}`, {
      params: filters,
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },

  /**
   * Get all inventory
   */
  getAll: async (filters = {}) => {
    const response = await api.get("/inventory", { 
      params: filters,
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },

  /**
   * Get stock summary
   */
  getSummary: async (branchId = null) => {
    const response = await api.get("/inventory/summary", {
      params: branchId ? { branchId } : {},
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },

  /**
   * Create stock adjustment
   */
  createAdjustment: async (data) => {
    const response = await api.post("/inventory/adjustment", data, {
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },
};

export default inventoryAPI;