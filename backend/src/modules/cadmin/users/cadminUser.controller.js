// modules/cadminUsers/cadminUser.controller.js
import { success, fail } from "../../../utils/response.js";
import {
  getUsersService,
  getUserByIdService,
  updateUserService,
  toggleUserAccessService,
  resetUserPasswordService,
} from "./cadminUser.service.js";

export async function getUsersController(req, res) {
  try {
    const params = req.query || {};
    const result = await getUsersService(params);
    return success(res, result); // success util wraps { success, message, data: ... }
  } catch (err) {
    console.error("cadmin.users.get", err);
    return fail(res, err.message || "Failed to fetch users", err.status || 500);
  }
}

export async function getUserByIdController(req, res) {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);
    return success(res, user);
  } catch (err) {
    console.error("cadmin.users.getById", err);
    return fail(res, err.message || "Failed to fetch user", err.status || 500);
  }
}

export async function updateUserController(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const updated = await updateUserService(id, payload, req.cadmin);
    return success(res, updated, "User updated");
  } catch (err) {
    console.error("cadmin.users.update", err);
    return fail(res, err.message || "Failed to update user", err.status || 400);
  }
}

export async function toggleUserAccessController(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
      const e = new Error("is_active (boolean) required in body");
      e.status = 400;
      throw e;
    }
    const updated = await toggleUserAccessService(id, is_active, req.cadmin);
    return success(res, updated, "User access updated");
  } catch (err) {
    console.error("cadmin.users.toggleAccess", err);
    return fail(res, err.message || "Failed to update access", err.status || 400);
  }
}

export async function resetUserPasswordController(req, res) {
  try {
    const { id } = req.params;
    const result = await resetUserPasswordService(id, req.cadmin);
    return success(res, result, "Password reset initiated");
  } catch (err) {
    console.error("cadmin.users.resetPassword", err);
    return fail(res, err.message || "Failed to reset password", err.status || 400);
  }
}
