// backend/src/modules/cadmin/delivery/cadminRiders.controller.js

import { fail, success } from "../../../utils/response.js";
import {
  listRiders,
  getRiderDetail,
  reviewDocument,
  approveRider,
  rejectRider,
  suspendRider,
  reactivateRider,
  createRiderByAdmin,
  listZones,
  createZone,
  updateZone,
} from "./cadminRiders.service.js";

// ── Riders ────────────────────────────────────────────────────

export async function getRiders(req, res) {
  try {
    const result = await listRiders(req.query);
    return success(res, "Riders retrieved", result);
  } catch {
    return fail(res, "Failed to fetch riders", 500);
  }
}

export async function getRider(req, res) {
  try {
    const rider = await getRiderDetail(req.params.riderId);
    return success(res, "Rider retrieved", rider);
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, "Failed to fetch rider", 500);
  }
}

export async function reviewRiderDocument(req, res) {
  const { action, rejection_reason } = req.body;
  try {
    const result = await reviewDocument(
      req.params.riderId,
      req.params.documentId,
      action,
      rejection_reason,
      req.cadmin.cadmin_id
    );
    return success(res, "Document reviewed", result);
  } catch (err) {
    const map = { INVALID_ACTION: 400, REASON_REQUIRED: 400, NOT_FOUND: 404 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function approveRiderApplication(req, res) {
  try {
    const result = await approveRider(req.params.riderId, req.cadmin.cadmin_id);
    return success(res, "Rider approved and activated", result);
  } catch (err) {
    const map = { NOT_FOUND: 404, DOCUMENTS_PENDING: 400 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function rejectRiderApplication(req, res) {
  const { reason } = req.body;
  try {
    const result = await rejectRider(req.params.riderId, reason, req.cadmin.cadmin_id);
    return success(res, "Rider application rejected", result);
  } catch (err) {
    const map = { REASON_REQUIRED: 400, NOT_FOUND: 404 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function suspendRiderAccount(req, res) {
  const { reason } = req.body;
  try {
    const result = await suspendRider(req.params.riderId, reason, req.cadmin.cadmin_id);
    return success(res, "Rider suspended", result);
  } catch (err) {
    const map = { REASON_REQUIRED: 400, NOT_FOUND: 404 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function reactivateRiderAccount(req, res) {
  try {
    const result = await reactivateRider(req.params.riderId);
    return success(res, "Rider reactivated", result);
  } catch (err) {
    const map = { NOT_FOUND: 404, INVALID_STATUS: 400 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function createRider(req, res) {
  const { phone } = req.body;
  if (!phone) return fail(res, "Phone number is required", 400);
  try {
    const rider = await createRiderByAdmin(phone, req.cadmin.cadmin_id);
    return success(res, "Rider created", rider, 201);
  } catch (err) {
    if (err.code === "ALREADY_EXISTS") return fail(res, err.message, 409);
    return fail(res, "Failed to create rider", 500);
  }
}

// ── Zones ─────────────────────────────────────────────────────

export async function getZones(req, res) {
  try {
    const zones = await listZones(req.query);
    return success(res, "Zones retrieved", zones);
  } catch {
    return fail(res, "Failed to fetch zones", 500);
  }
}

export async function addZone(req, res) {
  const { name, city, state } = req.body;
  if (!name || !city || !state) return fail(res, "Name, city, and state are required", 400);
  try {
    const zone = await createZone({ name, city, state }, req.cadmin.cadmin_id);
    return success(res, "Zone created", zone, 201);
  } catch {
    return fail(res, "Failed to create zone", 500);
  }
}

export async function editZone(req, res) {
  try {
    const zone = await updateZone(req.params.zoneId, req.body);
    return success(res, "Zone updated", zone);
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, "Failed to update zone", 500);
  }
}