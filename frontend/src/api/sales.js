// frontend/src/api/sales.js

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

const salesAPI = {
  // ═══════════════════════════════════════════════════════════════════════
  // BATCH/STOCK
  // ═══════════════════════════════════════════════════════════════════════

  getAvailableBatches: async (medicineId, options = {}) => {
    const params = new URLSearchParams();
    if (options.includeLowStock) params.append("includeLowStock", "true");
    if (options.includeExpiring === false) params.append("includeExpiring", "false");

    const response = await API.get(`/sales/batches/${medicineId}?${params}`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // INVOICE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  createDraft: async (data) => {
    const response = await API.post("/sales", data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  addItems: async (invoiceId, data) => {
    const response = await API.post(`/sales/${invoiceId}/items`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  removeItem: async (invoiceId, itemId) => {
    const response = await API.delete(`/sales/${invoiceId}/items/${itemId}`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  park: async (invoiceId, data = {}) => {
    const response = await API.post(`/sales/${invoiceId}/park`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  resume: async (invoiceId) => {
    const response = await API.post(`/sales/${invoiceId}/resume`, {}, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getParked: async () => {
    const response = await API.get("/sales/parked", {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  confirm: async (invoiceId, data = {}) => {
    const response = await API.post(`/sales/${invoiceId}/confirm`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  cancel: async (invoiceId, reason) => {
    const response = await API.post(
      `/sales/${invoiceId}/cancel`,
      { reason },
      { headers: getBranchHeaders() }
    );
    return response.data;
  },

  recordPayment: async (invoiceId, data) => {
    const response = await API.post(`/sales/${invoiceId}/payments`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GET ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  getAll: async (filters = {}) => {
    const response = await API.get("/sales", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getById: async (invoiceId) => {
    const response = await API.get(`/sales/${invoiceId}`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getStats: async (filters = {}) => {
    const response = await API.get("/sales/stats", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SALES RETURNS
  // ═══════════════════════════════════════════════════════════════════════

  getReturnableItems: async (invoiceId) => {
    const response = await API.get(`/sales/${invoiceId}/returnable-items`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  createReturn: async (data) => {
    const response = await API.post("/sales/returns", data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getReturns: async (filters = {}) => {
    const response = await API.get("/sales/returns", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getReturnById: async (returnId) => {
    const response = await API.get(`/sales/returns/${returnId}`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  cancelReturn: async (returnId, reason) => {
    const response = await API.post(
      `/sales/returns/${returnId}/cancel`,
      { reason },
      { headers: getBranchHeaders() }
    );
    return response.data;
  },
};

export default salesAPI;