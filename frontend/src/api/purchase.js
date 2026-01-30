// src/api/purchase.js

import API from "./axios";
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

const purchaseAPI = {
  /**
   * Create purchase invoice (Draft)
   */
  create: async (data) => {
    try {
      console.log("🚀 Creating purchase invoice...", data);
      const response = await API.post("/purchase", data, {
        headers: getBranchHeaders(),  // ✅ NEW
      });
      console.log("✅ Purchase invoice created:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Purchase create failed:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        errors: error.response?.data?.errors,
        data: error.response?.data,
      });
      throw error;
    }
  },

  /**
   * Update purchase invoice (Draft only)
   */
  update: async (invoiceId, data) => {
    try {
      const response = await API.put(`/purchase/${invoiceId}`, data, {
        headers: getBranchHeaders(),  // ✅ NEW
      });
      return response.data;
    } catch (error) {
      console.error("❌ Purchase update failed:", error.response?.data);
      throw error;
    }
  },

  /**
   * Confirm purchase invoice (Stock update)
   */
  confirm: async (invoiceId) => {
    try {
      const response = await API.post(`/purchase/${invoiceId}/confirm`, {}, {
        headers: getBranchHeaders(),  // ✅ NEW
      });
      return response.data;
    } catch (error) {
      console.error("❌ Purchase confirm failed:", error.response?.data);
      throw error;
    }
  },

  /**
   * Get all purchase invoices
   */
  getAll: async (filters = {}) => {
    try {
      const response = await API.get("/purchase", { 
        params: filters,
        headers: getBranchHeaders(),  // ✅ NEW
      });
      return response.data;
    } catch (error) {
      console.error("❌ Get invoices failed:", error.response?.data);
      throw error;
    }
  },

  /**
   * Get single invoice details
   */
  getById: async (invoiceId) => {
    try {
      const response = await API.get(`/purchase/${invoiceId}`, {
        headers: getBranchHeaders(),  // ✅ NEW
      });
      return response.data;
    } catch (error) {
      console.error("❌ Get invoice details failed:", error.response?.data);
      throw error;
    }
  },

  /**
   * Cancel invoice
   */
  cancel: async (invoiceId, reason) => {
    try {
      const response = await API.post(`/purchase/${invoiceId}/cancel`, { reason }, {
        headers: getBranchHeaders(),  // ✅ NEW
      });
      return response.data;
    } catch (error) {
      console.error("❌ Cancel invoice failed:", error.response?.data);
      throw error;
    }
  },

  /**
   * Get purchase statistics
   */
  getStats: async (filters = {}) => {
    try {
      const response = await API.get("/purchase/stats", { 
        params: filters,
        headers: getBranchHeaders(),  // ✅ NEW
      });
      return response.data;
    } catch (error) {
      console.error("❌ Get stats failed:", error.response?.data);
      throw error;
    }
  },
};

export default purchaseAPI;