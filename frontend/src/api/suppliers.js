// src/api/suppliers.js
import api from "./axios";

const suppliersAPI = {
  /**
   * Get all suppliers
   */
  getAll: async (filters = {}) => {
    const response = await api.get("/suppliers", { params: filters });
    return response.data;
  },

  /**
   * Search suppliers
   */
  search: async (searchTerm) => {
    const response = await api.get("/suppliers", {
      params: {
        search: searchTerm,
        isActive: true,
        limit: 100,
      },
    });
    return response.data;
  },

  /**
   * Get supplier by ID
   */
  getById: async (supplierId) => {
    const response = await api.get(`/suppliers/${supplierId}`);
    return response.data;
  },

  /**
   * Create new supplier
   */
  create: async (data) => {
    const response = await api.post("/suppliers", data);
    return response.data;
  },

  /**
   * Update supplier
   */
  update: async (supplierId, data) => {
    const response = await api.put(`/suppliers/${supplierId}`, data);
    return response.data;
  },
};

export default suppliersAPI;