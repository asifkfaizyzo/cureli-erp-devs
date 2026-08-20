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

  // A1 — Sales Summary
  getSalesSummary: async (filters = {}) => {
    const response = await API.get("/reports/sales/summary", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // A2 — Sales Register
  getSalesRegister: async (filters = {}) => {
    const response = await API.get("/reports/sales/register", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // A3 — Profit Report
  getSalesProfit: async (filters = {}) => {
    const response = await API.get("/reports/sales/profit", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // A4 — Sales Returns
  getSalesReturnsReport: async (filters = {}) => {
    const response = await API.get("/reports/sales/returns", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // A5 — Payment Collection
  getPaymentCollection: async (filters = {}) => {
    const response = await API.get("/reports/sales/payments", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // A6 — Outstanding & Receivables
  getOutstandingReceivables: async (filters = {}) => {
    const response = await API.get("/reports/sales/outstanding", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // A7 — Day Book
  getDayBook: async (filters = {}) => {
    const response = await API.get("/reports/sales/daybook", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },
};

export default reportsAPI;