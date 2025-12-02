import CAdminAPI from "./axios";

export function getAllCAdminUsers() {
  return CAdminAPI.get("/users/all");
}
