// backend/src/modules/cadmin/roles/cadminRoles.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  listRolesService,
  getRoleByIdService,
  createRoleService,
  updateRoleService,
  deleteRoleService,
  getAdminRolesService,
  assignRolesService,
  removeAllRolesService,
  getRoleDeletionImpactService,
} from "./cadminRoles.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getAuditContext(req) {
  return {
    actor_id:   req.cadmin.cadmin_id,
    actor_type: "CADMIN",
    ip_address: req.ip,
    user_agent: req.headers["user-agent"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

export async function listRolesController(req, res) {
  try {
    const { include_deleted, search } = req.query;
    const roles = await listRolesService({
      include_deleted: include_deleted === "true",
      search,
    });
    return success(res, "Roles fetched", { roles });
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function getRoleByIdController(req, res) {
  try {
    const role = await getRoleByIdService(req.params.role_id);
    return success(res, "Role fetched", { role });
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function createRoleController(req, res) {
  try {
    const role = await createRoleService(req.body, getAuditContext(req));
    return success(res, "Role created", { role }, 201);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function updateRoleController(req, res) {
  try {
    const role = await updateRoleService(
      req.params.role_id,
      req.body,
      getAuditContext(req)
    );
    return success(res, "Role updated", { role });
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function getRoleDeletionImpactController(req, res) {
  try {
    const impact = await getRoleDeletionImpactService(req.params.role_id);
    return success(res, "Role deletion impact fetched", { impact });
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function deleteRoleController(req, res) {
  try {
    await deleteRoleService(req.params.role_id, getAuditContext(req));
    return success(res, "Role deleted");
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNMENT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminRolesController(req, res) {
  try {
    const data = await getAdminRolesService(req.params.cadmin_id);
    return success(res, "Admin roles fetched", data);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function assignRolesController(req, res) {
  try {
    const data = await assignRolesService(
      req.params.cadmin_id,
      req.body,
      getAuditContext(req)
    );
    return success(res, "Roles assigned", data);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function removeAllRolesController(req, res) {
  try {
    await removeAllRolesService(req.params.cadmin_id, getAuditContext(req));
    return success(res, "All roles removed");
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}