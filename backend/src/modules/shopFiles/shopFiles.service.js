import prisma from "../../config/prisma.js";

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
    registration: 8,
    proof: 9,
    ea_license: 10,
    pan: 11,
    address: 12,
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
