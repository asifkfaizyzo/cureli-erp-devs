// cureli-admin/src/api/cadminAdmins.js
import CAdminAPI from "./axios";

// ============================================
// ADMIN CRUD
// ============================================

/**
 * Fetch admins with server-side filtering/sorting/pagination
 * @param {Object} params - { page, limit, search, status, role, sort, order }
 */
export function getAdmins(params = {}) {
  return CAdminAPI.get("/admins", { params });
}

/**
 * Fetch single admin with full details + activity logs
 * @param {string} id - Admin ID (UUID)
 */
export function getAdminById(id) {
  return CAdminAPI.get(`/admins/${id}`);
}

/**
 * Create new admin
 * @param {Object} data - { name, username, phone, email, password, role, status }
 */
export function createAdmin(data) {
  return CAdminAPI.post("/admins", data);
}

/**
 * Update admin profile/role
 * @param {string} id - Admin ID
 * @param {Object} data - { name?, username?, phone?, email?, role? }
 */
export function updateAdmin(id, data) {
  return CAdminAPI.patch(`/admins/${id}`, data);
}

/**
 * Toggle admin active status (suspend/activate)
 * @param {string} id - Admin ID
 * @param {boolean} isActive - true = activate, false = suspend
 */
export function toggleAdminAccess(id, isActive) {
  return CAdminAPI.patch(`/admins/${id}/access`, { is_active: isActive });
}

/**
 * Get paginated activity logs for admin
 * @param {string} id - Admin ID
 * @param {Object} params - { page, limit, action }
 */
export function getAdminActivity(id, params = {}) {
  return CAdminAPI.get(`/admins/${id}/activity`, { params });
}

// ============================================
// ROLE MANAGEMENT
// ============================================

/**
 * Fetch all roles with optional filters
 * @param {Object} params - { page?, limit?, search? }
 */
export function getRoles(params = {}) {
  return CAdminAPI.get("/roles", { params });
}

/**
 * Fetch single role by ID
 * @param {string} roleId - Role ID (UUID)
 */
export function getRoleById(roleId) {
  return CAdminAPI.get(`/roles/${roleId}`);
}

/**
 * Create a new role
 * @param {Object} data - { name, description?, permissions? }
 */
export function createRole(data) {
  return CAdminAPI.post("/roles", data);
}

/**
 * Update an existing role
 * @param {string} roleId - Role ID
 * @param {Object} data - { name?, description?, permissions? }
 */
export function updateRole(roleId, data) {
  return CAdminAPI.patch(`/roles/${roleId}`, data);
}

/**
 * Delete a role by ID
 * @param {string} roleId - Role ID
 */
export function deleteRole(roleId) {
  return CAdminAPI.delete(`/roles/${roleId}`);
}

/**
 * Get deletion impact for a role (how many admins will be affected)
 * @param {string} roleId - Role ID
 */
export function getRoleDeletionImpact(roleId) {
  return CAdminAPI.get(`/roles/${roleId}/deletion-impact`);
}

// ============================================
// ROLE ASSIGNMENTS
// ============================================

/**
 * Get all roles assigned to a specific admin
 * @param {string} cadminId - Admin ID
 */
export function getAdminRoles(cadminId) {
  return CAdminAPI.get(`/admins/${cadminId}/roles`);
}

/**
 * Assign (replace) roles for a specific admin
 * @param {string} cadminId - Admin ID
 * @param {Object} data - { role_ids: string[] }
 */
export function assignAdminRoles(cadminId, data) {
  return CAdminAPI.put(`/admins/${cadminId}/roles`, data);
}