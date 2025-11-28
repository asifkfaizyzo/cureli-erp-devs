import prisma from "../../config/prisma.js";
import { createLog as createCadminLog } from "../cadmin/cadminDocs/cadminDocs.service.js";
/**
 * fileData should contain:
 * { shop_id, user_id, file_type, original_name, mime_type, file_size, storage_key }
 */
export async function uploadShopFile(fileData) {
  // Validate shop
  const shop = await prisma.shop.findUnique({ where: { shop_id: fileData.shop_id } });
  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NO_SHOP";
    throw err;
  }

  // Persist file row
  const file = await prisma.shopFile.create({
    data: {
      shop_id: fileData.shop_id,
      file_type: fileData.file_type,
      storage_key: fileData.storage_key,
      original_name: fileData.original_name,
      mime_type: fileData.mime_type,
      file_size: fileData.file_size,
      uploaded_by: fileData.user_id,
    },
  });

  // Map file_type to onboarding step
  const mapping = {
    drug_license: 7,
    pharmacy_registration: 8,                    
    business_registration_proof: 9,             
    shop_establishment_license: 10,                             
    pan_card: 11,                            
    address_proof: 12,                           
  };

  const targetStep = mapping[fileData.file_type];

  if (targetStep) {
    // Load user to check current onboarding_step
    const user = await prisma.user.findUnique({ where: { user_id: fileData.user_id } });
    if (user && (user.onboarding_step || 4) < targetStep) {
      await prisma.user.update({
        where: { user_id: fileData.user_id },
        data: { onboarding_step: targetStep },
      });
    }
  }

  return file;
}

/**
 * List rejected files for a shop
 */
export async function listRejectedFilesForShop(shop_id) {
  return prisma.shopFile.findMany({
    where: { shop_id, status: "rejected" },
    orderBy: { uploaded_at: "desc" },
  });
}

/**
 * Resubmit (replace) file — caller must handle file upload and provide storage_key etc.
 * fileData: { file_id, shop_id, storage_key, original_name, mime_type, file_size, owner_message }
 */
export async function resubmitFile({ file_id, shop_id, storage_key, original_name, mime_type, file_size, owner_message = null }) {
  const old = await prisma.shopFile.findUnique({ where: { file_id } });
  if (!old) {
    const err = new Error("file_not_found");
    err.code = "FILE_NOT_FOUND";
    throw err;
  }
  if (old.shop_id !== shop_id) {
    const err = new Error("forbidden");
    err.code = "FORBIDDEN";
    throw err;
  }

  const updated = await prisma.shopFile.update({
    where: { file_id },
    data: {
      storage_key,
      original_name,
      mime_type,
      file_size,
      status: "uploaded",
      verification_notes: null,
      verified_at: null,
      resubmission_count: { increment: 1 },
      uploaded_at: new Date()
    },
  });

  // Log owner resubmission
  await createCadminLog({ file_id, shop_id, actor_type: "owner", action: "resubmitted", reason: owner_message });

  return updated;
}

/**
 * Owner sends message to admin about a file (stored as log)
 */
export async function ownerMessage({ file_id, shop_id, message }) {
  const file = await prisma.shopFile.findUnique({ where: { file_id }});
  if (!file || file.shop_id !== shop_id) {
    const err = new Error("forbidden");
    err.code = "FORBIDDEN";
    throw err;
  }

  await createCadminLog({ file_id, shop_id, actor_type: "owner", action: "owner_message", reason: message });
  return { success: true };
}