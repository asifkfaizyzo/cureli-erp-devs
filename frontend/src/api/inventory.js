// src/api/inventory.js
import api from "./axios";

const inventoryAPI = {
  /**
   * Get inventory for a specific medicine
   */
  getByMedicine: async (medicineId, filters = {}) => {
    const response = await api.get(`/inventory/medicine/${medicineId}`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get all inventory
   */
  getAll: async (filters = {}) => {
    const response = await api.get("/inventory", { params: filters });
    return response.data;
  },

  /**
   * Get stock summary
   */
  getSummary: async (branchId = null) => {
    const response = await api.get("/inventory/summary", {
      params: branchId ? { branchId } : {},
    });
    return response.data;
  },

  /**
   * Create stock adjustment
   */
  createAdjustment: async (data) => {
    const response = await api.post("/inventory/adjustment", data);
    return response.data;
  },
};

export default inventoryAPI;
