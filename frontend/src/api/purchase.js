// frontend/src/api/purchase.js
import API from "./axios";
import { useAuthStore } from "../store/useAuthStore";

function getBranchHeaders() {
  const state = useAuthStore.getState();
  const { branchContext } = state;
  
  return {
    "X-Branch-Mode": branchContext.mode || "BRANCH",
    "X-Branch-Id": branchContext.branch_id || "",
  };
}

const purchaseAPI = {
  create: async (data) => {
    try {
      const response = await API.post("/purchase", data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Purchase create failed:", error.response?.data);
      throw error;
    }
  },

  update: async (invoiceId, data) => {
    try {
      const response = await API.put(`/purchase/${invoiceId}`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Purchase update failed:", error.response?.data);
      throw error;
    }
  },

  confirm: async (invoiceId) => {
    try {
      const response = await API.post(`/purchase/${invoiceId}/confirm`, {}, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Purchase confirm failed:", error.response?.data);
      throw error;
    }
  },

  getAll: async (filters = {}) => {
    try {
      const response = await API.get("/purchase", { 
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Get invoices failed:", error.response?.data);
      throw error;
    }
  },

  getById: async (invoiceId) => {
    try {
      const response = await API.get(`/purchase/${invoiceId}`, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Get invoice details failed:", error.response?.data);
      throw error;
    }
  },

  cancel: async (invoiceId, reason) => {
    try {
      const response = await API.post(`/purchase/${invoiceId}/cancel`, { reason }, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Cancel invoice failed:", error.response?.data);
      throw error;
    }
  },

  getStats: async (filters = {}) => {
    try {
      const response = await API.get("/purchase/stats", { 
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Get stats failed:", error.response?.data);
      throw error;
    }
  },

  // ✅ NEW: Update payment status (Super Admin only)
  updatePaymentStatus: async (invoiceId, data) => {
    try {
      const response = await API.patch(`/purchase/${invoiceId}/payment-status`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Update payment status failed:", error.response?.data);
      throw error;
    }
  },

  // ✅ NEW: Record payment
  recordPayment: async (invoiceId, data) => {
    try {
      const response = await API.post(`/purchase/${invoiceId}/payments`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Record payment failed:", error.response?.data);
      throw error;
    }
  },

  // ✅ NEW: Revert to draft (for super admin)
  revertToDraft: async (invoiceId) => {
    try {
      const response = await API.patch(`/purchase/${invoiceId}`, { status: 'DRAFT' }, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("❌ Revert to draft failed:", error.response?.data);
      throw error;
    }
  },
};

export default purchaseAPI;