// src/api/suppliers.js
import api from "./axios";

const suppliersAPI = {
  /**
   * Get all suppliers (branch context aware)
   * In BRANCH mode: returns suppliers for that branch
   * In GLOBAL mode: returns all suppliers with branch info
   */
  getAll: async (filters = {}) => {
    const response = await api.get("/suppliers", { params: filters });
    return response.data;
  },

  /**
   * Search suppliers (respects branch context)
   */
  search: async (searchTerm, branchId = null) => {
    const params = {
      search: searchTerm,
      isActive: true,
      limit: 100,
    };
    if (branchId) {
      params.branch_id = branchId;
    }
    const response = await api.get("/suppliers", { params });
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
   * Create new supplier (requires branch context)
   */
  create: async (data, branchId) => {
    const response = await api.post("/suppliers", {
      ...data,
      branch_id: branchId,
    });
    return response.data;
  },

  /**
   * Update supplier
   */
  update: async (supplierId, data) => {
    const response = await api.put(`/suppliers/${supplierId}`, data);
    return response.data;
  },

  // ============================================
  // BRANCH MANAGEMENT (Super Admin Only)
  // ============================================

  /**
   * Get which branches a supplier is linked to
   */
  getSupplierBranches: async (supplierId) => {
    const response = await api.get(`/suppliers/${supplierId}/branches`);
    return response.data;
  },

  /**
   * Add supplier to a branch
   */
  addToBranch: async (supplierId, branchId) => {
    const response = await api.post(`/suppliers/${supplierId}/branches`, {
      branch_id: branchId,
    });
    return response.data;
  },

  /**
   * Remove supplier from a branch
   */
  removeFromBranch: async (supplierId, branchId) => {
    const response = await api.delete(`/suppliers/${supplierId}/branches`, {
      data: { branch_id: branchId },
    });
    return response.data;
  },

  /**
   * Bulk update supplier branches (set exact list)
   */
  updateBranches: async (supplierId, branchIds) => {
    const response = await api.put(`/suppliers/${supplierId}/branches`, {
      branch_ids: branchIds,
    });
    return response.data;
  },

  /**
   * Get suppliers available to add to a branch (not already linked)
   */
  getAvailableForBranch: async (branchId, search = "") => {
    const response = await api.get(`/suppliers/available/${branchId}`, {
      params: { search },
    });
    return response.data;
  },
};

export default suppliersAPI;