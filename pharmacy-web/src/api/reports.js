// pharmacy-web/src/api/reports.js

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

const reportsAPI = {
  // ── SALES REPORTS ──────────────────────────────────────────────────────────

  getSalesSummary: async (filters = {}) => {
    const response = await API.get("/reports/sales/summary", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getSalesRegister: async (filters = {}) => {
    const response = await API.get("/reports/sales/register", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getSalesProfit: async (filters = {}) => {
    const response = await API.get("/reports/sales/profit", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getSalesReturnsReport: async (filters = {}) => {
    const response = await API.get("/reports/sales/returns", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getPaymentCollection: async (filters = {}) => {
    const response = await API.get("/reports/sales/payments", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getOutstandingReceivables: async (filters = {}) => {
    const response = await API.get("/reports/sales/outstanding", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getDayBook: async (filters = {}) => {
    const response = await API.get("/reports/sales/daybook", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ── PURCHASE REPORTS ───────────────────────────────────────────────────────

  // B1 — Purchase Register
  getPurchaseRegister: async (filters = {}) => {
    const response = await API.get("/reports/purchase/register", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // B2 — Purchase Outstanding & Payables
  getPurchaseOutstanding: async (filters = {}) => {
    const response = await API.get("/reports/purchase/outstanding", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // B3 — Purchase Returns
  getPurchaseReturnsReport: async (filters = {}) => {
    const response = await API.get("/reports/purchase/returns", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },
  getCurrentStockReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/current-stock", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getExpiryReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/expiry", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getMinStockReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/min-stock", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getDeadStockReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/dead-stock", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getStockAdjustmentsReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/adjustments", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },


};

export default reportsAPI;