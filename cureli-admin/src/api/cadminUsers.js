//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\cureli-admin\src\api\cadminUsers.js
import CAdminAPI from "./axios";

/**
 * Fetch users with server-side filtering/sorting/pagination.
 * params: { page, limit, search, status, role, last_login, sort, order }
 */
export function getCAdminUsers(params = {}) {
  return CAdminAPI.get("/users", { params });
}

/**
 * Fetch single user with full details (shop, documents, activity, etc.)
 */
export function getCAdminUserById(id) {
  return CAdminAPI.get(`/users/${id}`);
}

/**
 * Toggle user active status (suspend/activate)
 * @param {string} id - User ID
 * @param {boolean} is_active - true = activate, false = suspend
 */
export function toggleCAdminUserAccess(id, is_active) {
  return CAdminAPI.patch(`/users/${id}/access`, { is_active });
}

/**
 * Update user profile fields (first_name, last_name, username, role)
 */
export function updateCAdminUser(id, payload) {
  return CAdminAPI.patch(`/users/${id}`, payload);
}

/**
 * Send password reset email to user
 */
export function resetCAdminUserPassword(id) {
  return CAdminAPI.post(`/users/${id}/reset-password`);
}