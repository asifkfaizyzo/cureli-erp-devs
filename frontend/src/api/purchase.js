// src/api/purchase.js
import API from "./axios";

const purchaseAPI = {
  /**
   * Create purchase invoice (Draft)
   */
  create: async (data) => {
    try {
      console.log("🚀 Creating purchase invoice...", data);
      const response = await API.post("/purchase", data);
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
      const response = await API.put(`/purchase/${invoiceId}`, data);
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
      const response = await API.post(`/purchase/${invoiceId}/confirm`);
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
      const response = await API.get("/purchase", { params: filters });
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
      const response = await API.get(`/purchase/${invoiceId}`);
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
      const response = await API.post(`/purchase/${invoiceId}/cancel`, { reason });
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
      const response = await API.get("/purchase/stats", { params: filters });
      return response.data;
    } catch (error) {
      console.error("❌ Get stats failed:", error.response?.data);
      throw error;
    }
  },
};

export default purchaseAPI;