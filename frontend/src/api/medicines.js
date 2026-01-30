// src/api/medicines.js

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

const medicinesAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get("/medicines", { 
      params: filters,
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },

  search: async (searchTerm, filters = {}) => {
    const response = await api.get("/medicines/search", {
      params: { q: searchTerm, limit: 50, ...filters },
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },

  getById: async (medicineId) => {
    const response = await api.get(`/medicines/${medicineId}`, {
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/medicines", data, {
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },

  bulkCreate: async (medicines) => {
    const response = await api.post("/medicines/bulk", { medicines }, {
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },

  update: async (medicineId, data) => {
    const response = await api.put(`/medicines/${medicineId}`, data, {
      headers: getBranchHeaders(),  // ✅ NEW
    });
    return response.data;
  },
};

export default medicinesAPI;