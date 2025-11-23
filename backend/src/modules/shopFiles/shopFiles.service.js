import prisma from "../../config/prisma.js";

export async function uploadShopFile(data) {
  return await prisma.shopFile.create({
    data: {
      shop_id: data.shop_id,
      uploaded_by: data.user_id,
      file_type: data.file_type,
      original_name: data.original_name,
      mime_type: data.mime_type,
      file_size: data.file_size,
      storage_key: data.storage_key,
    },
  });
}
