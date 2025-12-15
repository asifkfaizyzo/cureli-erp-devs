// src/api/cadminDocs.js

import CAdminAPI from "./axios";

/**
 * List shops for verification with filters, sorting, pagination
 */
export function listShopsForVerification(params = {}) {
  return CAdminAPI.get("/files", { params });
}

/**
 * Get shop details with all files for verification modal
 */
export function getShopVerificationDetail(shop_id) {
  return CAdminAPI.get(`/files/shop/${shop_id}`);
}

/**
 * Approve a document
 */
export function verifyFile(file_id) {
  return CAdminAPI.patch(`/files/${file_id}/verify`);
}

/**
 * Reject a document with reason
 */
export function rejectFile(file_id, reason) {
  return CAdminAPI.patch(`/files/${file_id}/reject`, { reason });
}