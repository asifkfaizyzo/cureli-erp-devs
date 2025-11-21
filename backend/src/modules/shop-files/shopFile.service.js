import prisma from "../../config/prisma.js";

export async function saveShopFile({ shop_id, user_id, file, file_type }) {
  return prisma.shopFile.create({
    data: {
      shop_id,
      file_type,
      storage_key: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      uploaded_by: user_id,
      status: "uploaded",
    },
  });
}
