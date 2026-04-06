// cadmin/src/api/cadminMasterMedicines.js

import CAdminAPI from "./axios";

/**
 * Fetch master medicines with pagination and filters
 * @param {Object} params - { page, limit, search, type, sort, order }
 */
export function getMasterMedicines(params = {}) {
  return CAdminAPI.get("/master-medicines", { params });
}

/**
 * Fetch single master medicine by ID
 * @param {string} id - Master Medicine ID (UUID)
 */
export function getMasterMedicineById(id) {
  return CAdminAPI.get(`/master-medicines/${id}`);
}

/**
 * Fetch master medicine statistics
 */
export function getMasterMedicineStats() {
  return CAdminAPI.get("/master-medicines/stats");
}

/**
 * Build full image URL from relative path
 * @param {string} relativePath - e.g., "OTC_IMAGES/1000000_Enerzal/phase1_main.jpg"
 */
export function getImageUrl(relativePath) {
  if (!relativePath) return null;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${baseUrl}/static/medicine_images/${relativePath}`;
}