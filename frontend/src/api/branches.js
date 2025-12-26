// src/api/branches.js

import api from "./axios";

/**
 * Get all branches for the current shop
 * @param {Object} options
 * @param {boolean} options.include_inactive - Include inactive branches
 */
export async function fetchBranches(options = {}) {
  const params = new URLSearchParams();
  
  if (options.include_inactive) {
    params.append("include_inactive", "true");
  }

  const response = await api.get(`/branches?${params.toString()}`);
  return response.data;
}

/**
 * Get branches for dropdown (minimal data, Super Admin only)
 */
export async function fetchBranchesDropdown() {
  const response = await api.get("/branches/dropdown");
  return response.data;
}

/**
 * Get a single branch by ID
 * @param {string} branchId
 */
export async function fetchBranch(branchId) {
  const response = await api.get(`/branches/${branchId}`);
  return response.data;
}

/**
 * Get current branch context
 */
export async function fetchCurrentBranch() {
  const response = await api.get("/branches/current");
  return response.data;
}

/**
 * Switch branch context (Super Admin only)
 * @param {string} branchId
 */
export async function switchBranch(branchId) {
  const response = await api.post("/branches/switch", {
    branch_id: branchId,
  });
  return response.data;
}