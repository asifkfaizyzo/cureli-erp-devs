// backend/src/modules/shopFiles/shopFiles.service.js

import prisma from "../../config/prisma.js";
import { createVerificationLog } from "../cadmin/cadminDocs/cadminDocs.service.js";

/**
 * UPLOAD SHOP FILE (Initial upload during onboarding)
 * fileData should contain:
 * { shop_id, user_id, file_type, original_name, mime_type, file_size, storage_key }
 */
export async function uploadShopFile(fileData) {
  // Validate shop
  const shop = await prisma.shop.findUnique({ 
    where: { shop_id: fileData.shop_id } 
  });
  
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
      status: "uploaded",  // Default: awaiting admin review
    },
  });

  // Update shop to pending_review (files submitted, waiting for admin)
  await prisma.shop.update({
    where: { shop_id: fileData.shop_id },
    data: { verification_status: "pending_review" }
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
    const user = await prisma.user.findUnique({ 
      where: { user_id: fileData.user_id } 
    });
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
 * LIST REJECTED FILES FOR SHOP
 * Used by owner to see which files were rejected and need resubmission
 */
export async function listRejectedFilesForShop(shop_id) {
  return prisma.shopFile.findMany({
    where: { shop_id, status: "rejected" },
    select: {
      file_id: true,
      file_type: true,
      original_name: true,
      status: true,
      verification_notes: true,        // Rejection reason
      resubmission_count: true,
      uploaded_at: true,
      rejected_at: true,
      last_resubmitted_at: true,
    },
    orderBy: { rejected_at: "desc" },
  });
}

/**
 * RESUBMIT FILE (Owner resubmits a rejected file)
 * 
 * When user resubmits:
 * 1. Replace file storage (new upload)
 * 2. Reset file status to "uploaded" (back to pending admin review)
 * 3. Clear verification_notes (rejection reason)
 * 4. Increment resubmission_count (track how many times resubmitted)
 * 5. Update last_resubmitted_at (track when resubmitted)
 * 6. Reset shop to "pending_review" (since a file changed)
 * 7. Log the resubmission action
 * 
 * fileData: { file_id, shop_id, storage_key, original_name, mime_type, file_size, owner_message }
 */
export async function resubmitFile({
  file_id,
  shop_id,
  storage_key,
  original_name,
  mime_type,
  file_size,
  owner_message = null,
}) {
  const old = await prisma.shopFile.findUnique({ where: { file_id } });
  
  if (!old) {
    const err = new Error("File not found");
    err.code = "FILE_NOT_FOUND";
    throw err;
  }
  
  if (old.shop_id !== shop_id) {
    const err = new Error("Forbidden");
    err.code = "FORBIDDEN";
    throw err;
  }

  // Update file: reset to uploaded, clear rejection reason, increment counter
  const updated = await prisma.shopFile.update({
    where: { file_id },
    data: {
      storage_key,                      // New file
      original_name,
      mime_type,
      file_size,
      status: "uploaded",                // Reset to pending review
      verification_notes: null,           // Clear rejection reason
      verified_at: null,                  // Clear verification date
      rejected_at: null,                  // Clear rejection date
      last_resubmitted_at: new Date(),    // Track when resubmitted
      resubmission_count: { increment: 1 }, // Increment counter
      uploaded_at: new Date(),            // Update upload timestamp
    },
  });

  // Reset shop status back to pending_review (a file was resubmitted)
  await prisma.shop.update({
    where: { shop_id },
    data: { verification_status: "pending_review" }
  });


  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: { owner_user_id: true }
  });

  if (shop?.owner_user_id) {
    await prisma.user.update({
      where: { user_id: shop.owner_user_id },
      data: { 
        status: "pending_verification",
        first_login_after_verification: false // Reset this too
      }
    });
    console.log("✅ Reset user status to pending_verification");
  }
  // Log owner resubmission
  await createVerificationLog({
    file_id,
    shop_id,
    actor_type: "owner",
    action: "resubmitted",
    reason: owner_message || "File resubmitted by owner",
  });

  return updated;
}

/**
 * OWNER MESSAGE TO ADMIN
 * Owner can leave a message on a rejected file (stored in verification logs)
 * This helps admin understand context for resubmission
 */
export async function ownerMessage({ file_id, shop_id, message }) {
  const file = await prisma.shopFile.findUnique({ where: { file_id } });
  
  if (!file || file.shop_id !== shop_id) {
    const err = new Error("Forbidden");
    err.code = "FORBIDDEN";
    throw err;
  }

  if (!message || !message.trim()) {
    const err = new Error("Message is required");
    err.code = "INVALID";
    throw err;
  }

  await createVerificationLog({
    file_id,
    shop_id,
    actor_type: "owner",
    action: "owner_message",
    reason: message.trim(),
  });

  return { success: true };
}
