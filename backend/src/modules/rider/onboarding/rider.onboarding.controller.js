// backend/src/modules/rider/onboarding/rider.onboarding.controller.js

import { fail, success } from "../../../utils/response.js";
import {
  personalDetailsSchema,
  bankDetailsSchema,
  emergencyContactSchema,
} from "./rider.onboarding.schema.js";
import {
  getAvailableZones,
  savePersonalDetails,
  saveBankDetails,
  saveEmergencyContact,
  uploadRiderDocument,
  getDocumentStatus,
  submitApplication,
} from "./rider.onboarding.service.js";

export async function listZones(req, res) {
  try {
    const zones = await getAvailableZones();
    return success(res, "Zones retrieved", zones);
  } catch {
    return fail(res, "Failed to fetch zones", 500);
  }
}

export async function updatePersonalDetails(req, res) {
  const parsed = personalDetailsSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await savePersonalDetails(req.rider.rider_id, parsed.data);
    return success(res, "Personal details saved", result);
  } catch (err) {
    if (err.code === "INVALID_ZONE") return fail(res, err.message, 400);
    return fail(res, "Failed to save details", 500);
  }
}

export async function updateBankDetails(req, res) {
  const parsed = bankDetailsSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await saveBankDetails(req.rider.rider_id, parsed.data);
    return success(res, "Bank details saved", result);
  } catch {
    return fail(res, "Failed to save bank details", 500);
  }
}

export async function updateEmergencyContact(req, res) {
  const parsed = emergencyContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await saveEmergencyContact(req.rider.rider_id, parsed.data);
    return success(res, "Emergency contact saved", result);
  } catch {
    return fail(res, "Failed to save emergency contact", 500);
  }
}

export async function uploadDocument(req, res) {
  const { document_type, is_front } = req.body;

  const validTypes = [
    "PROFILE_PHOTO",
    "AADHAAR_FRONT",
    "AADHAAR_BACK",
    "PAN_FRONT",
    "DRIVING_LICENSE_FRONT",
    "DRIVING_LICENSE_BACK",
    "VEHICLE_RC",
  ];

  if (!document_type || !validTypes.includes(document_type)) {
    return fail(res, "Invalid document type", 400);
  }

  if (!req.file) {
    return fail(res, "No file uploaded", 400);
  }

  try {
    const isFront = is_front !== "false";
    const result = await uploadRiderDocument(
      req.rider.rider_id,
      document_type,
      req.file,
      isFront
    );
    return success(res, "Document uploaded successfully", result);
  } catch (err) {
    if (err.code === "NO_FILE") return fail(res, err.message, 400);
    return fail(res, "Failed to upload document", 500);
  }
}

export async function getDocuments(req, res) {
  try {
    const docs = await getDocumentStatus(req.rider.rider_id);
    return success(res, "Documents retrieved", docs);
  } catch {
    return fail(res, "Failed to fetch documents", 500);
  }
}

export async function submitOnboarding(req, res) {
  try {
    const result = await submitApplication(req.rider.rider_id);
    return success(res, "Application submitted for review", result);
  } catch (err) {
    const statusMap = {
      NOT_FOUND:          404,
      INCOMPLETE_PROFILE: 400,
      MISSING_DOCUMENTS:  400,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}