import prisma from "../../config/prisma.js";

export async function updateShopInfo(user_id, data) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id: data.shop_id }
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (shop.owner_user_id !== user_id) {
    const err = new Error("Not authorized to update this shop");
    err.code = "FORBIDDEN";
    throw err;
  }

  return prisma.shop.update({
    where: { shop_id: data.shop_id },
    data: {
      business_name: data.business_name,
      address_line_1: data.address_line_1,
      address_line_2: data.address_line_2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode
    }
  });
}

export async function updateShopGst(user_id, data) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id: data.shop_id }
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (shop.owner_user_id !== user_id) {
    const err = new Error("Not authorized to update this shop");
    err.code = "FORBIDDEN";
    throw err;
  }

  return prisma.shop.update({
    where: { shop_id: data.shop_id },
    data: {
      business_type: data.business_type,
      gst_number: data.gst_number
    }
  });
}
