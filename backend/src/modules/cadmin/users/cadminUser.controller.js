// ============================================
// backend\src\modules\cadmin\users\cadminUser.controller.js
// ============================================

import { success, fail } from "../../../utils/response.js";
import * as svc from "./cadminUser.service.js";
import * as audit from "../../audit/index.js";

/**
 * GET /cadmin/users
 * List all ERP users with filters
 */
export async function getUsersController(req, res) {
  try {
    const params = req.query || {};
    const result = await svc.getUsersService(params);
    return success(res, result);
  } catch (err) {
    console.error("cadmin.users.get", err);
    return fail(res, err.message || "Failed to fetch users", err.status || 500);
  }
}

/**
 * GET /cadmin/users/:id
 * Get single user details
 */
export async function getUserByIdController(req, res) {
  try {
    const { id } = req.params;
    const user = await svc.getUserByIdService(id);
    return success(res, user);
  } catch (err) {
    console.error("cadmin.users.getById", err);
    return fail(res, err.message || "Failed to fetch user", err.status || 500);
  }
}

/**
 * PATCH /cadmin/users/:id
 * Update user profile (by admin)
 */
export async function updateUserController(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const cadmin_id = req.cadmin?.cadmin_id;

    const auditContext = audit.extractRequestContext(req);
    const updated = await svc.updateUserService(id, payload, cadmin_id, auditContext);
    
    return success(res, updated, "User updated");
  } catch (err) {
    console.error("cadmin.users.update", err);
    return fail(res, err.message || "Failed to update user", err.status || 400);
  }
}

/**
 * PATCH /cadmin/users/:id/access
 * Toggle user active status (activate/suspend)
 */
export async function toggleUserAccessController(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (typeof is_active !== "boolean") {
      return fail(res, "is_active (boolean) required in body", 400);
    }

    const cadmin_id = req.cadmin?.cadmin_id;
    const auditContext = audit.extractRequestContext(req);
    
    const updated = await svc.toggleUserAccessService(id, is_active, cadmin_id, auditContext);
    
    return success(res, updated, "User access updated");
  } catch (err) {
    console.error("cadmin.users.toggleAccess", err);
    return fail(res, err.message || "Failed to update access", err.status || 400);
  }
}

/**
 * POST /cadmin/users/:id/reset-password
 * Send password reset email to user
 */
export async function resetUserPasswordController(req, res) {
  try {
    const { id } = req.params;
    const cadmin_id = req.cadmin?.cadmin_id;
    
    const auditContext = audit.extractRequestContext(req);
    const result = await svc.resetUserPasswordService(id, cadmin_id, auditContext);
    
    return success(res, result, "Password reset initiated");
  } catch (err) {
    console.error("cadmin.users.resetPassword", err);
    return fail(res, err.message || "Failed to reset password", err.status || 400);
  }
}