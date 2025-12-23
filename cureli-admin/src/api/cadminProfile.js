import CAdminAPI from "./axios";

/**
 * Get current admin's profile + pending counts
 */
export function getMyProfile() {
  return CAdminAPI.get("/me");
}

/**
 * Get just the pending counts (for polling/refresh)
 */
export function getPendingCounts() {
  return CAdminAPI.get("/pending-counts");
}

/**
 * Logout current admin
 */
export function logoutAdmin() {
  return CAdminAPI.post("/logout");
}