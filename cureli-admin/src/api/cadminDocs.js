// cureli-admin/src/api/cadminDocs.js

import CAdminAPI from "./axios";

/**
 * GET /cadmin/files
 * List shops for verification with filters, sorting, pagination
 */
export function listShopsForVerification(params = {}) {
  return CAdminAPI.get("/files", { params });
}

/**
 * GET /cadmin/shops/:shop_id
 * Get shop details with all files for verification modal
 */
export function getShopVerificationDetail(shop_id) {
  return CAdminAPI.get(`/shops/${shop_id}`);
}

/**
 * PATCH /cadmin/files/:file_id/verify
 * Approve a document
 */
export function verifyFile(file_id) {
  return CAdminAPI.patch(`/files/${file_id}/verify`);
}

/**
 * PATCH /cadmin/files/:file_id/reject
 * Reject a document with reason
 */
export function rejectFile(file_id, reason) {
  return CAdminAPI.patch(`/files/${file_id}/reject`, { reason });
}