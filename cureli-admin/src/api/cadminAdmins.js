import CAdminAPI from "./axios";

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