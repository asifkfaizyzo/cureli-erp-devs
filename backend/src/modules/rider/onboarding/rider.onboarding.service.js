// backend/src/modules/rider/onboarding/rider.onboarding.service.js

import prisma from "../../../config/prisma.js";
import { uploadFile } from "../../../services/fileStorage.service.js";

const RIDER_DOCS_FOLDER = "rider_documents";

// Document types that require a back photo
const REQUIRES_BACK = ["AADHAAR_FRONT", "DRIVING_LICENSE_FRONT"];

// Map front → back document type
const BACK_PAIR = {
  AADHAAR_FRONT:         "AADHAAR_BACK",
  DRIVING_LICENSE_FRONT: "DRIVING_LICENSE_BACK",
};

// ── Get available zones ───────────────────────────────────────

export async function getAvailableZones() {
  const zones = await prisma.deliveryZone.findMany({
    where: { is_active: true },
    select: {
      zone_id: true,
      name:    true,
      city:    true,
      state:   true,
    },
    orderBy: [{ state: "asc" }, { city: "asc" }, { name: "asc" }],
  });
  return zones;
}

// ── Save personal details ─────────────────────────────────────

export async function savePersonalDetails(riderId, data) {
  const zone = await prisma.deliveryZone.findUnique({
    where: { zone_id: data.zone_id },
    select: { zone_id: true, is_active: true },
  });

  if (!zone || !zone.is_active) {
    const err = new Error("Selected zone is not available.");
    err.code = "INVALID_ZONE";
    throw err;
  }

  const updated = await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      full_name:          data.full_name,
      date_of_birth:      new Date(data.date_of_birth),
      sex:                data.sex ?? null,
      zone_id:            data.zone_id,
      vehicle_type:       data.vehicle_type,
      vehicle_number:     data.vehicle_number,
      vehicle_make_model: data.vehicle_make_model ?? null,
    },
    select: {
      rider_id:    true,
      full_name:   true,
      date_of_birth: true,
      sex:         true,
      zone_id:     true,
      vehicle_type: true,
      vehicle_number: true,
      vehicle_make_model: true,
    },
  });

  return updated;
}

// ── Save bank details ─────────────────────────────────────────

export async function saveBankDetails(riderId, data) {
  const updated = await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      bank_account_number: data.bank_account_number,
      bank_ifsc:           data.bank_ifsc,
      bank_holder_name:    data.bank_holder_name,
      bank_name:           data.bank_name,
      bank_verified:       false, // reset verification on any change
    },
    select: {
      rider_id:        true,
      bank_holder_name: true,
      bank_verified:   true,
    },
  });

  return updated;
}

// ── Save emergency contact ────────────────────────────────────

export async function saveEmergencyContact(riderId, data) {
  const updated = await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      emergency_contact_name:  data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
    },
    select: {
      rider_id:                true,
      emergency_contact_name:  true,
      emergency_contact_phone: true,
    },
  });

  return updated;
}

// ── Upload document ───────────────────────────────────────────

export async function uploadRiderDocument(riderId, documentType, file, isFront = true) {
  if (!file) {
    const err = new Error("No file provided.");
    err.code = "NO_FILE";
    throw err;
  }

  // Upload to S3
  const uploadResult = await uploadFile({
    buffer:       file.buffer,
    folder:       RIDER_DOCS_FOLDER,
    originalName: file.originalname,
    mimetype:     file.mimetype,
    size:         file.size,
  });

  // Determine which field to update
  const isBackPhoto = !isFront && REQUIRES_BACK.includes(documentType);
  const storageField = isBackPhoto ? "back_storage_key" : "storage_key";

  // Determine the actual document type to store
  // For back photos of Aadhaar/DL, we update the existing front document row
  const dbDocumentType = isBackPhoto
    ? documentType  // same row, just update back_storage_key
    : documentType;

  // Upsert the document record
  const document = await prisma.riderDocument.upsert({
    where: {
      rider_id_type: { rider_id: riderId, type: dbDocumentType },
    },
    update: {
      [storageField]:    uploadResult.storage_key,
      status:            "PENDING",
      rejection_reason:  null,
      uploaded_at:       new Date(),
      resubmission_count: { increment: 1 },
    },
    create: {
      rider_id:    riderId,
      type:        dbDocumentType,
      [storageField]: uploadResult.storage_key,
      status:      "PENDING",
      uploaded_at: new Date(),
    },
    select: {
      document_id:    true,
      type:           true,
      status:         true,
      uploaded_at:    true,
      resubmission_count: true,
    },
  });

  return document;
}

// ── Get document status summary ───────────────────────────────

export async function getDocumentStatus(riderId) {
  const documents = await prisma.riderDocument.findMany({
    where: { rider_id: riderId },
    select: {
      document_id:      true,
      type:             true,
      status:           true,
      rejection_reason: true,
      uploaded_at:      true,
      resubmission_count: true,
    },
  });

  // All required document types
  const required = [
    "PROFILE_PHOTO",
    "AADHAAR_FRONT",
    "AADHAAR_BACK",
    "PAN_FRONT",
    "DRIVING_LICENSE_FRONT",
    "DRIVING_LICENSE_BACK",
    "VEHICLE_RC",
  ];

  const uploaded = new Map(documents.map(d => [d.type, d]));

  return required.map(type => ({
    type,
    ...(uploaded.get(type) ?? {
      document_id:      null,
      status:           "NOT_UPLOADED",
      rejection_reason: null,
      uploaded_at:      null,
    }),
  }));
}

// ── Submit application ────────────────────────────────────────
// Validates all required documents are uploaded before marking as submitted

export async function submitApplication(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id:           true,
      full_name:          true,
      date_of_birth:      true,
      zone_id:            true,
      vehicle_type:       true,
      vehicle_number:     true,
      bank_account_number: true,
      bank_ifsc:          true,
      documents:          { select: { type: true, status: true } },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Check personal details completeness
  if (!rider.full_name || !rider.date_of_birth || !rider.zone_id) {
    const err = new Error("Please complete your personal details before submitting.");
    err.code = "INCOMPLETE_PROFILE";
    throw err;
  }

  if (!rider.vehicle_type || !rider.vehicle_number) {
    const err = new Error("Please add your vehicle details before submitting.");
    err.code = "INCOMPLETE_PROFILE";
    throw err;
  }

  if (!rider.bank_account_number || !rider.bank_ifsc) {
    const err = new Error("Please add your bank details before submitting.");
    err.code = "INCOMPLETE_PROFILE";
    throw err;
  }

  // Check all required documents are uploaded
  const required = [
    "PROFILE_PHOTO",
    "AADHAAR_FRONT",
    "AADHAAR_BACK",
    "PAN_FRONT",
    "DRIVING_LICENSE_FRONT",
    "DRIVING_LICENSE_BACK",
    "VEHICLE_RC",
  ];

  const uploadedTypes = new Set(rider.documents.map(d => d.type));
  const missing = required.filter(t => !uploadedTypes.has(t));

  if (missing.length > 0) {
    const err = new Error(`Missing required documents: ${missing.join(", ")}`);
    err.code = "MISSING_DOCUMENTS";
    err.missing = missing;
    throw err;
  }

  // Status is already PENDING_REVIEW — no status change needed
  // Just record the submission timestamp via last_seen_at update
  await prisma.rider.update({
    where: { rider_id: riderId },
    data:  { updated_at: new Date() },
  });

  return { submitted: true };
}