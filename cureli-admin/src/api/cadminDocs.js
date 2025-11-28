// src/api/cadminDocs.js
import CAdminAPI from "./axios";

export async function getAdminFiles({ status = "uploaded", q = "", limit = 12, offset = 0 } = {}) {
  const params = { status, q, limit, offset };
  return CAdminAPI.get("/files", { params });
}

export async function getAdminFile(file_id) {
  return CAdminAPI.get(`/files/${file_id}`);
}

export async function verifyAdminFile(file_id) {
  return CAdminAPI.patch(`/files/${file_id}/verify`);
}

export async function rejectAdminFile(file_id, reason) {
  return CAdminAPI.patch(`/files/${file_id}/reject`, { reason });
}
