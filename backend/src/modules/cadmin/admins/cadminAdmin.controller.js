// src/modules/cadmin/admins/cadminAdmin.controller.js

import { success, fail } from "../../../utils/response.js";
import * as audit from "../../audit/index.js";
import {
  getAdminsService,
  getAdminByIdService,
  createAdminService,
  updateAdminService,
  toggleAdminAccessService,
  getAdminActivityService,
} from "./cadminAdmin.service.js";

export async function getAdminsController(req, res) {
  try {
    const result = await getAdminsService(req.validated);
    return success(res, result);
  } catch (err) {
    console.error("cadmin.admins.list", err);
    return fail(res, err.message || "Failed to fetch admins", err.status || 500);
  }
}

export async function getAdminByIdController(req, res) {
  try {
    const { id } = req.params;
    const admin = await getAdminByIdService(id);
    return success(res, admin);
  } catch (err) {
    console.error("cadmin.admins.getById", err);
    return fail(res, err.message || "Failed to fetch admin", err.status || 500);
  }
}

export async function createAdminController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    const admin = await createAdminService(req.validated, auditContext);
    return success(res, admin, "Admin created successfully", 201);
  } catch (err) {
    console.error("cadmin.admins.create", err);
    return fail(res, err.message || "Failed to create admin", err.status || 500);
  }
}

export async function updateAdminController(req, res) {
  try {
    const { id } = req.params;
    const auditContext = audit.extractRequestContext(req);
    const admin = await updateAdminService(id, req.validated, auditContext);
    return success(res, admin, "Admin updated successfully");
  } catch (err) {
    console.error("cadmin.admins.update", err);
    return fail(res, err.message || "Failed to update admin", err.status || 500);
  }
}

export async function toggleAdminAccessController(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.validated;
    const auditContext = audit.extractRequestContext(req);
    const result = await toggleAdminAccessService(id, is_active, auditContext);
    const message = is_active ? "Admin activated successfully" : "Admin suspended successfully";
    return success(res, result, message);
  } catch (err) {
    console.error("cadmin.admins.toggleAccess", err);
    return fail(res, err.message || "Failed to update access", err.status || 500);
  }
}

export async function getAdminActivityController(req, res) {
  try {
    const { id } = req.params;
    const result = await getAdminActivityService(id, req.validated);
    return success(res, result);
  } catch (err) {
    console.error("cadmin.admins.activity", err);
    return fail(res, err.message || "Failed to fetch activity", err.status || 500);
  }
}