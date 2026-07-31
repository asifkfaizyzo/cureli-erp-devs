// backend/src/modules/cadmin/delivery/cadminRiders.service.js

import prisma from "../../../config/prisma.js";
import { sseService } from "../../../services/sse.service.js";

// ── List riders ───────────────────────────────────────────────

export async function listRiders(query = {}) {
  const {
    status,
    zone_id,
    search,
    page  = 1,
    limit = 20,
  } = query;

  const where = { deleted_at: null };

  if (status)  where.status  = status;
  if (zone_id) where.zone_id = zone_id;
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { phone:     { contains: search } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [riders, total] = await Promise.all([
    prisma.rider.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { created_at: "desc" },
      select: {
        rider_id:        true,
        phone:           true,
        full_name:       true,
        status:          true,
        is_online:       true,
        rating:          true,
        total_deliveries: true,
        created_at:      true,
        profile_photo_key: true,
        zone: { select: { name: true, city: true } },
        documents: {
          select: { type: true, status: true },
        },
        _count: {
          select: { deliveries: true },
        },
      },
    }),
    prisma.rider.count({ where }),
  ]);

  return {
    riders,
    meta: {
      total,
      page:        Number(page),
      limit:       Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ── Get rider detail ──────────────────────────────────────────

export async function getRiderDetail(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    include: {
      zone:      true,
      documents: true,
      appeals: {
        orderBy: { created_at: "desc" },
        take: 5,
      },
      tickets: {
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          ticket_id:  true,
          category:   true,
          status:     true,
          created_at: true,
        },
      },
      _count: {
        select: {
          deliveries: true,
          ratingsReceived: true,
        },
      },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return rider;
}

// ── Review document ───────────────────────────────────────────

export async function reviewDocument(riderId, documentId, action, rejectionReason, reviewedBy) {
  if (!["APPROVED", "REJECTED"].includes(action)) {
    const err = new Error("Action must be APPROVED or REJECTED.");
    err.code = "INVALID_ACTION";
    throw err;
  }

  if (action === "REJECTED" && !rejectionReason) {
    const err = new Error("Rejection reason is required.");
    err.code = "REASON_REQUIRED";
    throw err;
  }

  const document = await prisma.riderDocument.findFirst({
    where: { document_id: documentId, rider_id: riderId },
  });

  if (!document) {
    const err = new Error("Document not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const updated = await prisma.riderDocument.update({
    where: { document_id: documentId },
    data: {
      status:           action,
      rejection_reason: action === "REJECTED" ? rejectionReason : null,
      reviewed_by:      reviewedBy,
      reviewed_at:      new Date(),
    },
  });

  return updated;
}

// ── Approve application ───────────────────────────────────────

export async function approveRider(riderId, reviewedBy) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    include: { documents: true },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // All documents must be approved
  const unapproved = rider.documents.filter(d => d.status !== "APPROVED");
  if (unapproved.length > 0) {
    const err = new Error("All documents must be approved before activating the rider.");
    err.code = "DOCUMENTS_PENDING";
    err.unapproved = unapproved.map(d => d.type);
    throw err;
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data:  { status: "ACTIVE" },
  });

  // Notify rider via SSE if connected
  sseService.notifyRider(riderId, "APPLICATION_APPROVED", {
    message: "Your application has been approved. You can now go online.",
  });

  return { approved: true };
}

// ── Reject application ────────────────────────────────────────

export async function rejectRider(riderId, reason, reviewedBy) {
  if (!reason) {
    const err = new Error("Rejection reason is required.");
    err.code = "REASON_REQUIRED";
    throw err;
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data:  { status: "REJECTED" },
  });

  sseService.notifyRider(riderId, "APPLICATION_REJECTED", {
    message: reason,
  });

  return { rejected: true };
}

// ── Suspend rider ─────────────────────────────────────────────

export async function suspendRider(riderId, reason, suspendedBy) {
  if (!reason) {
    const err = new Error("Suspension reason is required.");
    err.code = "REASON_REQUIRED";
    throw err;
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      status:            "SUSPENDED",
      suspension_reason: reason,
      suspended_at:      new Date(),
      suspended_by:      suspendedBy,
      is_online:         false,
    },
  });

  // Revoke all active sessions
  await prisma.riderSession.updateMany({
    where: { rider_id: riderId, is_active: true },
    data: {
      is_active:      false,
      revoked_at:     new Date(),
      revoked_reason: "suspended",
    },
  });

  // Force SSE disconnect notification
  sseService.notifyRider(riderId, "ACCOUNT_SUSPENDED", { reason });

  return { suspended: true };
}

// ── Reactivate rider ──────────────────────────────────────────

export async function reactivateRider(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: { status: true },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!["SUSPENDED", "REJECTED"].includes(rider.status)) {
    const err = new Error("Only suspended or rejected riders can be reactivated.");
    err.code = "INVALID_STATUS";
    throw err;
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      status:            "ACTIVE",
      suspension_reason: null,
      suspended_at:      null,
      suspended_by:      null,
    },
  });

  sseService.notifyRider(riderId, "ACCOUNT_REACTIVATED", {
    message: "Your account has been reactivated.",
  });

  return { reactivated: true };
}

// ── Create rider (CAdmin invite — Path B) ─────────────────────

export async function createRiderByAdmin(phone, createdBy) {
  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "").trim();
  const phoneVariants = [phone, `+91${raw10}`, `91${raw10}`, raw10];

  const existing = await prisma.rider.findFirst({
    where: { phone: { in: phoneVariants }, deleted_at: null },
  });

  if (existing) {
    const err = new Error("A rider with this phone number already exists.");
    err.code = "ALREADY_EXISTS";
    throw err;
  }

  const rider = await prisma.rider.create({
    data: {
      phone:  phone,
      status: "PENDING_REVIEW",
    },
    select: {
      rider_id:   true,
      phone:      true,
      status:     true,
      created_at: true,
    },
  });

  return rider;
}

// ── Zone management ───────────────────────────────────────────

export async function listZones(query = {}) {
  const { is_active } = query;
  const where = {};
  if (is_active !== undefined) where.is_active = is_active === "true";

  return prisma.deliveryZone.findMany({
    where,
    orderBy: [{ state: "asc" }, { city: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { riders: true } },
    },
  });
}

export async function createZone(data, createdBy) {
  return prisma.deliveryZone.create({
    data: {
      name:  data.name,
      city:  data.city,
      state: data.state,
    },
  });
}

export async function updateZone(zoneId, data) {
  const zone = await prisma.deliveryZone.findUnique({ where: { zone_id: zoneId } });
  if (!zone) {
    const err = new Error("Zone not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return prisma.deliveryZone.update({
    where: { zone_id: zoneId },
    data: {
      name:      data.name      ?? zone.name,
      city:      data.city      ?? zone.city,
      state:     data.state     ?? zone.state,
      is_active: data.is_active ?? zone.is_active,
    },
  });
}